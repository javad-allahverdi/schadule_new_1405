from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django.core.exceptions import ValidationError
from django.db import transaction
import json
import threading
import logging

# Django REST Framework imports
from rest_framework import viewsets, status, generics, mixins, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import (
    SchedulingTask, ScheduleResult, UniversityConfig, 
    Place, Teacher, Course, ScheduleConstraint, StudentGroup, Schedule
)
from .forms import (
    ExcelUploadForm, SchedulingConfigForm, ManualCourseForm,
    ManualTeacherForm, ScheduleFilterForm
)
from .utils import ExcelToYAMLConverter, run_scheduling_algorithm, ScheduleExporter, export_university_config_to_excel

# Serializers
from .serializers import (
    TeacherSerializer, CourseSerializer, PlaceSerializer,
    UniversityConfigSerializer, ScheduleConstraintSerializer, 
    StudentGroupSerializer, ScheduleSerializer, TeacherScheduleSerializer,
    UniversityStatsSerializer, TeacherCreateSerializer, SchedulingTaskSerializer
)

# Permissions
from .permissions import (
    IsUniversityMember, IsAdminOrEducationOfficer, IsTeacherOnly,
    IsAdminOnly, CanViewSchedule, CanManageTeachers, CanManageCourses,
    CanManagePlaces, CanRunScheduling
)

# تنظیم لاگر
logger = logging.getLogger(__name__)


# ============================================================================
# API VIEWS (REST Framework) - با دسترسی Multi-Tenant
# ============================================================================

class UniversityConfigViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت پیکربندی دانشگاه‌ها
    """
    queryset = UniversityConfig.objects.all()
    serializer_class = UniversityConfigSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'semester']
    ordering_fields = ['created_at', 'name']
    
    def get_queryset(self):
        """
        فیلتر کردن دانشگاه‌ها بر اساس نقش کاربر
        """
        user = self.request.user
        
        if user.role == 'supervisor':
            return UniversityConfig.objects.all()
        
        if not user.university_id:
            return UniversityConfig.objects.none()

        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط پیکربندی‌های دانشگاه خودشان را می‌بینند
            return UniversityConfig.objects.filter(university_id=user.university_id)
        
        if user.role == 'teacher':
            # استاد فقط دانشگاهی که در آن تدریس می‌کند
            if hasattr(user, 'teacher_profile'):
                return UniversityConfig.objects.filter(id=user.teacher_profile.university_config_id)
            return UniversityConfig.objects.none()
        
        return UniversityConfig.objects.none()
    
    def perform_create(self, serializer):
        """ایجاد دانشگاه جدید"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def copy_from(self, request, pk=None):
        """
        کپی کردن اساتید/مکان‌ها/دروس/گروه‌های دانشجویی از یک نیمسال دیگر
        (source_id) به این نیمسال، برای جلوگیری از ورود دوباره‌ی اطلاعاتی
        که بین نیمسال‌ها کمتر تغییر می‌کنند (مثل اساتید و مکان‌ها).
        حساب کاربری (لاگین) اساتید عمداً کپی نمی‌شود.
        """
        target = self.get_object()
        source_id = request.data.get('source_id')

        if not source_id:
            return Response({'success': False, 'message': 'نیمسال مبدأ مشخص نشده است'},
                             status=status.HTTP_400_BAD_REQUEST)

        try:
            source = UniversityConfig.objects.get(id=source_id)
        except UniversityConfig.DoesNotExist:
            return Response({'success': False, 'message': 'نیمسال مبدأ یافت نشد'},
                             status=status.HTTP_404_NOT_FOUND)

        if source.id == target.id:
            return Response({'success': False, 'message': 'نیمسال مبدأ و مقصد نمی‌توانند یکسان باشند'},
                             status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role != 'supervisor':
            if source.university_id != user.university_id or target.university_id != user.university_id:
                return Response({'success': False, 'message': 'شما به یکی از این نیمسال‌ها دسترسی ندارید'},
                                 status=status.HTTP_403_FORBIDDEN)

        copy_teachers = bool(request.data.get('copy_teachers', True))
        copy_places = bool(request.data.get('copy_places', True))
        copy_courses = bool(request.data.get('copy_courses', False))
        copy_groups = bool(request.data.get('copy_groups', False))

        # دروس بدون حداقل یک استاد مجاز معنا ندارند؛ پس اگر دروس کپی می‌شود، اساتید هم باید کپی شوند
        if copy_courses:
            copy_teachers = True

        counts = {'teachers': 0, 'places': 0, 'courses': 0, 'groups': 0}

        with transaction.atomic():
            teacher_map = {}

            if copy_teachers:
                for t in source.teachers.all():
                    new_teacher = Teacher.objects.create(
                        code=t.code, full_name=t.full_name, gender=t.gender, degree=t.degree,
                        employment_type=t.employment_type, position=t.position,
                        max_units=t.max_units, min_units=t.min_units,
                        unavailable_times=t.unavailable_times,
                        university_config=target,
                    )
                    teacher_map[t.code] = new_teacher
                    counts['teachers'] += 1

            if copy_places:
                for p in source.places.all():
                    Place.objects.create(
                        code=p.code, name=p.name, capacity=p.capacity, place_type=p.place_type,
                        gender=p.gender, facilities=p.facilities, available=p.available,
                        university_config=target,
                    )
                    counts['places'] += 1

            if copy_courses:
                for c in source.courses.all():
                    new_course = Course.objects.create(
                        code=c.code, name=c.name, course_type=c.course_type, unit_type=c.unit_type,
                        units=c.units, priority=c.priority, gender=c.gender,
                        required_place_type=c.required_place_type,
                        prerequisites=c.prerequisites, corequisites=c.corequisites,
                        expected_students=c.expected_students, required_place=c.required_place,
                        fixed=c.fixed, university_config=target,
                    )
                    for old_teacher in c.teachers.all():
                        new_t = teacher_map.get(old_teacher.code)
                        if new_t:
                            new_course.teachers.add(new_t)
                    counts['courses'] += 1

            if copy_groups:
                for g in source.student_groups.all():
                    StudentGroup.objects.create(
                        name=g.name, size=g.size, entry_year=g.entry_year,
                        field_of_study=g.field_of_study, degree_level=g.degree_level,
                        gender=g.gender, required_courses=g.required_courses,
                        optional_courses=g.optional_courses, university_config=target,
                    )
                    counts['groups'] += 1

        return Response({
            'success': True,
            'message': 'اطلاعات با موفقیت کپی شد',
            'counts': counts,
        })

    @action(detail=True, methods=['get'])
    def export_excel(self, request, pk=None):
        """صدور همه‌ی اطلاعات ورودی این نیمسال (اساتید/دروس/مکان‌ها/گروه‌ها) به یک فایل اکسل"""
        uc = self.get_object()
        content = export_university_config_to_excel(uc)
        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"semester_{uc.id}_data.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """دریافت آمار دانشگاه"""
        university = self.get_object()
        
        stats = {
            'total_teachers': university.teachers.count(),
            'total_courses': university.courses.count(),
            'total_places': university.places.count(),
            'total_student_groups': university.student_groups.count(),
            'total_schedules': Schedule.objects.filter(university_config=university).count(),
            
            'available_places': university.places.filter(available=True).count(),
            'available_teachers': university.teachers.count(),  # همه اساتید فعال در نظر گرفته می‌شوند
            
            'average_courses_per_teacher': university.courses.aggregate(
                avg=Avg('teachers__count')
            )['avg'] or 0,
            
            'average_students_per_group': university.student_groups.aggregate(
                avg=Avg('size')
            )['avg'] or 0,
        }
        
        # محاسبه درصد پوشش زمان‌بندی
        total_possible_slots = len(university.days_of_week) * len(university.time_slots)
        if total_possible_slots > 0:
            scheduled_slots = Schedule.objects.filter(university_config=university).count()
            stats['schedule_coverage'] = (scheduled_slots / total_possible_slots) * 100
        else:
            stats['schedule_coverage'] = 0
        
        serializer = UniversityStatsSerializer(data=stats)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت اساتید
    """
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanManageTeachers, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'full_name', 'user__email', 'user__username']
    ordering_fields = ['full_name', 'code', 'max_units']
    
    def get_serializer_class(self):
        """انتخاب سریالایزر مناسب"""
        if self.action == 'create':
            return TeacherCreateSerializer
        return TeacherSerializer
    
    def get_queryset(self):
        """
        فیلتر کردن اساتید بر اساس دانشگاه
        """
        user = self.request.user
        university_id = self.request.query_params.get('university_id')
        
        # اگر university_id مشخص شده
        if university_id:
            queryset = Teacher.objects.filter(university_config_id=university_id)
        else:
            queryset = Teacher.objects.all()
        
        # فیلتر بر اساس دسترسی کاربر
        if user.role == 'supervisor':
            return queryset
        
        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط به دانشگاه (تننت) خودشان دسترسی دارند
            return queryset.filter(university_config__university_id=user.university_id)
        
        if user.role == 'teacher':
            # استاد فقط خودش و همکارانش در همان دانشگاه
            if hasattr(user, 'teacher_profile'):
                teacher_university = user.teacher_profile.university_config
                return queryset.filter(university_config=teacher_university)
            return Teacher.objects.none()
        
        return Teacher.objects.none()
    
    @action(detail=False, methods=['get'])
    def without_account(self, request):
        """اساتیدی که حساب کاربری ندارند"""
        queryset = self.get_queryset().filter(user__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_user_account(self, request, pk=None):
        """ایجاد حساب کاربری برای استاد"""
        teacher = self.get_object()
        
        if teacher.user:
            return Response({
                'success': False,
                'message': 'این استاد قبلاً حساب کاربری دارد'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ایجاد کاربر
        username = f"teacher_{teacher.code}_{teacher.university_config.id}"
        email = request.data.get('email', f"{teacher.code}@{teacher.university_config.name.replace(' ', '').lower()}.edu")
        password = request.data.get('password', teacher.code)
        
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=teacher.full_name.split()[0] if teacher.full_name else '',
            last_name=' '.join(teacher.full_name.split()[1:]) if teacher.full_name else '',
            role='teacher',
            university=teacher.university_config.university,
            national_code=request.data.get('national_code', ''),
            phone_number=request.data.get('phone_number', ''),
            gender='male' if teacher.gender == 1 else 'female',
            department=request.data.get('department', ''),
            is_verified=True
        )
        
        teacher.user = user
        teacher.save()
        
        return Response({
            'success': True,
            'message': 'حساب کاربری با موفقیت ایجاد شد',
            'username': username,
            'email': email
        })


class CourseViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت دروس
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanManageCourses, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'course_type', 'unit_type']
    ordering_fields = ['code', 'name', 'priority', 'units']
    
    def get_queryset(self):
        user = self.request.user
        university_id = self.request.query_params.get('university_id')
        
        # فیلتر بر اساس دانشگاه
        if university_id:
            queryset = Course.objects.filter(university_config_id=university_id)
        else:
            queryset = Course.objects.all()
        
        # فیلتر بر اساس دسترسی کاربر
        if user.role == 'supervisor':
            return queryset
        
        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط به دانشگاه (تننت) خودشان دسترسی دارند
            return queryset.filter(university_config__university_id=user.university_id)
        
        if user.role == 'teacher':
            if hasattr(user, 'teacher_profile'):
                teacher_university = user.teacher_profile.university_config
                # استاد فقط دروس دانشگاه خودش را می‌بیند
                return queryset.filter(university_config=teacher_university)
            return Course.objects.none()
        
        return Course.objects.none()


class PlaceViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت مکان‌ها (کلاس‌ها)
    """
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanManagePlaces, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'place_type']
    ordering_fields = ['code', 'name', 'capacity']
    
    def get_queryset(self):
        user = self.request.user
        university_id = self.request.query_params.get('university_id')
        
        if university_id:
            queryset = Place.objects.filter(university_config_id=university_id)
        else:
            queryset = Place.objects.all()
        
        if user.role == 'supervisor':
            return queryset
        
        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط به دانشگاه (تننت) خودشان دسترسی دارند
            return queryset.filter(university_config__university_id=user.university_id)
        
        if user.role == 'teacher':
            if hasattr(user, 'teacher_profile'):
                teacher_university = user.teacher_profile.university_config
                return queryset.filter(university_config=teacher_university)
            return Place.objects.none()
        
        return Place.objects.none()


class StudentGroupViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت گروه‌های دانشجویی
    """
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanManageCourses, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'size']
    
    def get_queryset(self):
        user = self.request.user
        university_id = self.request.query_params.get('university_id')
        
        if university_id:
            queryset = StudentGroup.objects.filter(university_config_id=university_id)
        else:
            queryset = StudentGroup.objects.all()
        
        if user.role == 'supervisor':
            return queryset
        
        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط به دانشگاه (تننت) خودشان دسترسی دارند
            return queryset.filter(university_config__university_id=user.university_id)
        
        if user.role == 'teacher':
            if hasattr(user, 'teacher_profile'):
                teacher_university = user.teacher_profile.university_config
                return queryset.filter(university_config=teacher_university)
            return StudentGroup.objects.none()
        
        return StudentGroup.objects.none()


class ScheduleConstraintViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت محدودیت‌های زمان‌بندی
    """
    queryset = ScheduleConstraint.objects.all()
    serializer_class = ScheduleConstraintSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanRunScheduling, IsUniversityMember]
    
    def get_queryset(self):
        university_id = self.request.query_params.get('university_id')
        if university_id:
            return ScheduleConstraint.objects.filter(university_config_id=university_id)
        
        # اگر university_id مشخص نشده، بر اساس دسترسی کاربر
        user = self.request.user
        
        if user.role == 'supervisor':
            return ScheduleConstraint.objects.all()
        
        if user.role in ('admin', 'education_officer'):
            return ScheduleConstraint.objects.filter(university_config__university_id=user.university_id)
        
        return ScheduleConstraint.objects.none()


class SchedulingTaskViewSet(viewsets.ModelViewSet):
    """
    API ViewSet برای مدیریت وظایف زمان‌بندی
    """
    queryset = SchedulingTask.objects.all()
    serializer_class = SchedulingTaskSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, CanRunScheduling, IsUniversityMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'completed_at', 'status']
    
    def get_queryset(self):
        user = self.request.user
        university_id = self.request.query_params.get('university_id')
        
        if university_id:
            queryset = SchedulingTask.objects.filter(university_config_id=university_id)
        else:
            queryset = SchedulingTask.objects.all()
        
        if user.role == 'supervisor':
            return queryset
        
        if user.role in ('admin', 'education_officer'):
            # مدیر و مسئول آموزش فقط به دانشگاه (تننت) خودشان دسترسی دارند
            return queryset.filter(university_config__university_id=user.university_id)
        
        if user.role == 'teacher':
            # استاد فقط وظایف عمومی یا وظایف دانشگاه خودش
            if hasattr(user, 'teacher_profile'):
                teacher_university = user.teacher_profile.university_config
                return queryset.filter(
                    Q(university_config=teacher_university) | Q(is_public=True)
                )
            return queryset.filter(is_public=True)
        
        return queryset.filter(is_public=True)
    
    def perform_create(self, serializer):
        """ایجاد وظیفه جدید"""
        university_id = self.request.data.get('university_config')
        if not university_id:
            # اگر دانشگاه مشخص نشده، اولین دانشگاه کاربر
            user_universities = UniversityConfig.objects.filter(university_id=self.request.user.university_id)
            if user_universities.exists():
                university_id = user_universities.first().id
            else:
                raise ValidationError('هیچ دانشگاهی برای کاربر وجود ندارد')
        
        serializer.save(created_by=self.request.user, university_config_id=university_id)
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """اجرای وظیفه زمان‌بندی"""
        task = self.get_object()
        
        if task.status in ['processing', 'completed']:
            return Response({
                'success': False,
                'message': f'وظیفه در حال حاضر {task.get_status_display()} است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # اجرای الگوریتم در background
        task.status = 'processing'
        task.save()
        
        threading.Thread(target=run_scheduling_algorithm, args=(task.id,)).start()
        
        return Response({
            'success': True,
            'message': 'الگوریتم زمان‌بندی شروع شد',
            'task_id': task.id,
            'status': task.status
        })
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """دریافت وضعیت وظیفه"""
        task = self.get_object()

        has_result = hasattr(task, 'schedule_result')
        response_data = {
            'id': task.id,
            'name': task.name,
            'status': task.status,
            'status_display': task.get_status_display(),
            'execution_time': task.execution_time,
            'created_at': task.created_at,
            'completed_at': task.completed_at,
            'progress': self._get_progress(task),
            'result': task.result,
            'has_schedule_result': has_result,
            'approval_status': getattr(task.schedule_result, 'approval_status', None) if has_result else None,
        }

        if has_result:
            sr = task.schedule_result
            response_data['schedule_data'] = sr.schedule_data
            response_data['total_cost'] = sr.total_cost
            response_data['teacher_conflicts'] = sr.teacher_conflicts
            response_data['place_conflicts'] = sr.place_conflicts
            response_data['capacity_issues'] = sr.capacity_issues
            response_data['gender_mismatches'] = sr.gender_mismatches
            response_data['rejection_note'] = sr.rejection_note

        return Response(response_data)
    
    def _get_progress(self, task):
        """محاسبه پیشرفت (در صورت وجود)"""
        if task.status == 'completed':
            return 100
        elif task.status == 'failed':
            return 0
        elif task.status == 'processing':
            return 50  # اجرای الگوریتم synchronous/threaded است و پیشرفت دقیق لحظه‌ای گزارش نمی‌شود
        return 0

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        تأیید و نهایی‌کردن نتیجه‌ی زمان‌بندی.
        فقط مدیر دانشگاه، مسئول آموزش یا سوپروایزر می‌توانند تأیید کنند.
        """
        task = self.get_object()

        if request.user.role not in ('admin', 'education_officer', 'supervisor'):
            return Response({
                'success': False, 'message': 'شما دسترسی تأیید زمان‌بندی را ندارید'
            }, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(task, 'schedule_result'):
            return Response({
                'success': False, 'message': 'برای این وظیفه هنوز نتیجه‌ای تولید نشده است'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = task.schedule_result
        result.approval_status = 'approved'
        result.approved_by = request.user
        result.approved_at = timezone.now()
        result.rejection_note = ''
        result.save()

        return Response({
            'success': True,
            'message': 'برنامه زمان‌بندی با موفقیت تأیید و نهایی شد',
            'approval_status': result.approval_status,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        رد کردن نتیجه‌ی زمان‌بندی برای بازنگری. برنامه نهایی نمی‌شود و
        می‌توان با پارامترهای جدید دوباره اجرا (run) کرد.
        """
        task = self.get_object()

        if request.user.role not in ('admin', 'education_officer', 'supervisor'):
            return Response({
                'success': False, 'message': 'شما دسترسی رد کردن زمان‌بندی را ندارید'
            }, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(task, 'schedule_result'):
            return Response({
                'success': False, 'message': 'برای این وظیفه هنوز نتیجه‌ای تولید نشده است'
            }, status=status.HTTP_400_BAD_REQUEST)

        note = request.data.get('note', '')
        result = task.schedule_result
        result.approval_status = 'rejected'
        result.approved_by = None
        result.approved_at = None
        result.rejection_note = note
        result.save()

        return Response({
            'success': True,
            'message': 'زمان‌بندی رد شد. می‌توانید با تنظیمات جدید دوباره اجرا کنید.',
            'approval_status': result.approval_status,
        })

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """صدور نتیجه‌ی زمان‌بندی: ?file_format=pdf|excel|json|text"""
        task = self.get_object()

        if not hasattr(task, 'schedule_result'):
            return Response({
                'success': False, 'message': 'برای این وظیفه هنوز نتیجه‌ای تولید نشده است'
            }, status=status.HTTP_400_BAD_REQUEST)

        exporter = ScheduleExporter(task.schedule_result)
        # نکته‌ی مهم: نام پارامتر «file_format» است، نه «format»؛ چون DRF از
        # پارامتر رزروشده‌ی «format» برای content negotiation خودش استفاده
        # می‌کند و همنام بودن باعث خطای ۴۰۴ بدون رسیدن به این view می‌شد.
        fmt = request.query_params.get('file_format', 'pdf')
        filename_base = f"schedule_{task.id}"

        if fmt == 'pdf':
            content = exporter.export_to_pdf()
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.pdf"'
            return response

        if fmt == 'excel':
            content = exporter.export_to_excel()
            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.xlsx"'
            return response

        if fmt == 'text':
            content = exporter.export_to_text()
            response = HttpResponse(content, content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.txt"'
            return response

        # پیش‌فرض: json
        content = exporter.export_to_json()
        response = HttpResponse(content, content_type='application/json; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename_base}.json"'
        return response


# ============================================================================
# VIEWS مخصوص اساتید
# ============================================================================

class TeacherScheduleAPIView(generics.ListAPIView):
    """
    API برای دریافت برنامه زمان‌بندی استاد لاگین کرده
    """
    serializer_class = TeacherScheduleSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsTeacherOnly]
    
    def get_queryset(self):
        user = self.request.user
        
        # فقط اگر استاد باشد
        if user.role != 'teacher':
            return Schedule.objects.none()
        
        # اگر پروفایل استاد دارد
        if hasattr(user, 'teacher_profile'):
            teacher = user.teacher_profile
            return Schedule.objects.filter(
                teacher=teacher
            ).order_by('day_of_week', 'start_time')
        
        return Schedule.objects.none()
    
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # فیلترهای اختیاری
        semester = request.query_params.get('semester')
        day_of_week = request.query_params.get('day_of_week')
        
        if semester:
            queryset = queryset.filter(semester=semester)
        
        if day_of_week:
            queryset = queryset.filter(day_of_week=day_of_week)
        
        # گروه‌بندی بر اساس روز
        schedule_by_day = {}
        for schedule in queryset:
            day_name = schedule.get_day_of_week_display()
            if day_name not in schedule_by_day:
                schedule_by_day[day_name] = []
            
            schedule_by_day[day_name].append(
                self.get_serializer(schedule).data
            )
        
        return Response({
            'success': True,
            'teacher': {
                'id': user.teacher_profile.id if hasattr(user, 'teacher_profile') else None,
                'name': user.get_full_name(),
                'code': user.teacher_profile.code if hasattr(user, 'teacher_profile') else None
            },
            'schedule': schedule_by_day,
            'total_classes': queryset.count()
        })


class TeacherCoursesAPIView(generics.ListAPIView):
    """
    API برای دریافت دروس تدریسی استاد
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsTeacherOnly]
    
    def get(self, request, *args, **kwargs):
        user = self.request.user
        
        if not hasattr(user, 'teacher_profile'):
            return Response({
                'success': False,
                'message': 'پروفایل استاد یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        
        teacher = user.teacher_profile
        courses = Course.objects.filter(teachers=teacher)
        
        course_data = []
        for course in courses:
            course_data.append({
                'id': course.id,
                'code': course.code,
                'name': course.name,
                'units': course.units,
                'course_type': course.course_type,
                'expected_students': course.expected_students,
                'university': course.university_config.name
            })
        
        return Response({
            'success': True,
            'teacher': {
                'id': teacher.id,
                'name': teacher.full_name,
                'code': teacher.code
            },
            'courses': course_data,
            'total_courses': len(course_data)
        })


# ============================================================================
# APIهای عمومی برای فرانت‌اند
# ============================================================================

class UniversityDashboardAPIView(APIView):
    """
    API برای داشبورد مدیر دانشگاه
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOnly]
    
    def get(self, request):
        user = request.user
        
        # دانشگاه‌های کاربر (در معماری چندمستأجری، یعنی پیکربندی‌های نیمسال دانشگاه خودش)
        universities = UniversityConfig.objects.filter(university_id=user.university_id)
        
        dashboard_data = []
        for university in universities:
            stats = {
                'id': university.id,
                'name': university.name,
                'semester': university.semester,
                'teachers_count': university.teachers.count(),
                'courses_count': university.courses.count(),
                'places_count': university.places.count(),
                'student_groups_count': university.student_groups.count(),
                'scheduling_tasks_count': university.scheduling_tasks.count(),
                'schedules_count': Schedule.objects.filter(university_config=university).count(),
                'recent_tasks': list(
                    university.scheduling_tasks
                    .order_by('-created_at')[:5]
                    .values('id', 'name', 'status', 'created_at')
                )
            }
            dashboard_data.append(stats)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'name': user.get_full_name(),
                'role': user.role
            },
            'universities': dashboard_data,
            'total_universities': len(dashboard_data)
        })


class EducationOfficerDashboardAPIView(APIView):
    """
    API برای داشبورد مسئول آموزش
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrEducationOfficer]
    
    def get(self, request):
        user = request.user
        
        # مسئول آموزش فقط دانشگاه خودش را می‌بیند؛ سوپروایزر همه را
        if user.role == 'supervisor':
            universities = UniversityConfig.objects.all()
            teachers_qs = Teacher.objects.all()
            courses_qs = Course.objects.all()
            places_qs = Place.objects.all()
            groups_qs = StudentGroup.objects.all()
            schedules_qs = Schedule.objects.all()
            tasks_qs = SchedulingTask.objects.all()
        else:
            universities = UniversityConfig.objects.filter(university_id=user.university_id)
            teachers_qs = Teacher.objects.filter(university_config__university_id=user.university_id)
            courses_qs = Course.objects.filter(university_config__university_id=user.university_id)
            places_qs = Place.objects.filter(university_config__university_id=user.university_id)
            groups_qs = StudentGroup.objects.filter(university_config__university_id=user.university_id)
            schedules_qs = Schedule.objects.filter(university_config__university_id=user.university_id)
            tasks_qs = SchedulingTask.objects.filter(university_config__university_id=user.university_id)
        
        total_stats = {
            'universities_count': universities.count(),
            'teachers_count': teachers_qs.count(),
            'courses_count': courses_qs.count(),
            'places_count': places_qs.count(),
            'student_groups_count': groups_qs.count(),
            'schedules_count': schedules_qs.count(),
            'pending_tasks': tasks_qs.filter(status='pending').count(),
            'processing_tasks': tasks_qs.filter(status='processing').count(),
            'completed_tasks': tasks_qs.filter(status='completed').count(),
        }
        
        # دانشگاه‌های با بیشترین فعالیت
        active_universities = list(
            universities.annotate(
                tasks_count=Count('scheduling_tasks'),
                schedules_count=Count('schedules')
            ).order_by('-tasks_count')[:10]
            .values('id', 'name', 'tasks_count', 'schedules_count')
        )
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'name': user.get_full_name(),
                'role': user.role
            },
            'total_stats': total_stats,
            'active_universities': active_universities,
            'recent_tasks': list(
                SchedulingTask.objects
                .order_by('-created_at')[:10]
                .values('id', 'name', 'status', 'created_by__first_name', 'created_by__last_name', 'university_config__name')
            )
        })


# ============================================================================
# VIEWS سنتی (برای رابط وب)
# ============================================================================

class SchedulingBaseView(View):
    """View پایه برای بررسی دسترسی‌ها"""

    def check_permission(self, request):
        user = request.user
        if user.role in ['admin', 'education_officer']:
            return True
        return False

    def dispatch(self, request, *args, **kwargs):
        if not self.check_permission(request):
            return render(request, 'scheduling_module/access_denied.html')
        return super().dispatch(request, *args, **kwargs)


class ExcelUploadView(SchedulingBaseView):
    """View برای آپلود فایل اکسل"""

    @method_decorator(login_required)
    def get(self, request):
        form = ExcelUploadForm()
        return render(request, 'scheduling_module/excel_upload.html', {'form': form})

    @method_decorator(login_required)
    def post(self, request):
        form = ExcelUploadForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                # پیدا کردن دانشگاه کاربر
                university = UniversityConfig.objects.filter(created_by=request.user).first()
                if not university:
                    university = UniversityConfig.objects.create(
                        name=f"دانشگاه {request.user.get_full_name() or request.user.username}",
                        semester="نیمسال اول",
                        days_of_week=[
                            {"id": 0, "name": "شنبه", "enabled": True},
                            {"id": 1, "name": "یکشنبه", "enabled": True},
                            {"id": 2, "name": "دوشنبه", "enabled": True},
                            {"id": 3, "name": "سه‌شنبه", "enabled": True},
                            {"id": 4, "name": "چهارشنبه", "enabled": True}
                        ],
                        time_slots=[
                            {"id": 0, "start": "08:00", "end": "10:00", "enabled": True},
                            {"id": 1, "start": "10:00", "end": "12:00", "enabled": True},
                            {"id": 2, "start": "14:00", "end": "16:00", "enabled": True},
                            {"id": 3, "start": "16:00", "end": "18:00", "enabled": True}
                        ],
                        max_units_per_student=20,
                        max_classes_per_day=3,
                        created_by=request.user
                    )
                
                # تبدیل اکسل به YAML و ایجاد وظیفه
                converter = ExcelToYAMLConverter(request.FILES['excel_file'])
                yaml_content = converter.convert()

                task = SchedulingTask.objects.create(
                    created_by=request.user,
                    university_config=university,
                    name=form.cleaned_data['config_name'],
                    status='pending'
                )

                # ذخیره فایل YAML
                import os
                from django.conf import settings

                config_dir = os.path.join(settings.MEDIA_ROOT, 'scheduling_configs')
                os.makedirs(config_dir, exist_ok=True)

                config_path = os.path.join(config_dir, f'{task.id}.yaml')
                with open(config_path, 'w', encoding='utf-8') as f:
                    f.write(yaml_content)

                task.config_file.name = f'scheduling_configs/{task.id}.yaml'
                task.save()

                # اجرای الگوریتم در background
                threading.Thread(target=run_scheduling_algorithm, args=(task.id,)).start()

                messages.success(request, 'فایل با موفقیت آپلود شد و الگوریتم زمان‌بندی شروع شد.')
                return redirect('scheduling:task_detail', pk=task.id)

            except Exception as e:
                messages.error(request, f'خطا در پردازش فایل: {str(e)}')
                form.add_error('excel_file', f'خطا در پردازش فایل: {str(e)}')

        return render(request, 'scheduling_module/excel_upload.html', {'form': form})


class ManualInputView(SchedulingBaseView):
    """View برای ورود دستی اطلاعات"""

    @method_decorator(login_required)
    def get(self, request):
        # پیدا کردن دانشگاه کاربر
        university = UniversityConfig.objects.filter(created_by=request.user).first()
        if not university:
            messages.warning(request, 'لطفاً ابتدا دانشگاه خود را ایجاد کنید.')
            return redirect('scheduling:university_create')
        
        course_form = ManualCourseForm()
        teacher_form = ManualTeacherForm()
        config_form = SchedulingConfigForm()

        return render(request, 'scheduling_module/manual_input.html', {
            'course_form': course_form,
            'teacher_form': teacher_form,
            'config_form': config_form,
            'university': university
        })

    @method_decorator(login_required)
    def post(self, request):
        course_form = ManualCourseForm(request.POST)
        teacher_form = ManualTeacherForm(request.POST)
        config_form = SchedulingConfigForm(request.POST)

        if 'add_course' in request.POST and course_form.is_valid():
            # ذخیره درس جدید
            university = UniversityConfig.objects.filter(created_by=request.user).first()
            if university:
                Course.objects.create(
                    university_config=university,
                    code=course_form.cleaned_data['code'],
                    name=course_form.cleaned_data['name'],
                    course_type=course_form.cleaned_data['course_type'],
                    units=course_form.cleaned_data['units'],
                    expected_students=course_form.cleaned_data['expected_students'],
                    required_place_type=course_form.cleaned_data['required_place_type']
                )
                messages.success(request, 'درس جدید با موفقیت اضافه شد.')
            return redirect('scheduling:manual_input')

        elif 'add_teacher' in request.POST and teacher_form.is_valid():
            # ذخیره استاد جدید
            university = UniversityConfig.objects.filter(created_by=request.user).first()
            if university:
                Teacher.objects.create(
                    university_config=university,
                    code=teacher_form.cleaned_data['code'],
                    full_name=teacher_form.cleaned_data['full_name'],
                    gender=teacher_form.cleaned_data['gender'],
                    max_units=teacher_form.cleaned_data['max_units'],
                    min_units=teacher_form.cleaned_data['min_units']
                )
                messages.success(request, 'استاد جدید با موفقیت اضافه شد.')
            return redirect('scheduling:manual_input')

        elif 'create_schedule' in request.POST and config_form.is_valid():
            # ایجاد زمان‌بندی جدید
            try:
                university = UniversityConfig.objects.filter(created_by=request.user).first()
                if not university:
                    messages.error(request, 'لطفاً ابتدا دانشگاه خود را ایجاد کنید.')
                    return redirect('scheduling:manual_input')
                
                task = SchedulingTask.objects.create(
                    created_by=request.user,
                    university_config=university,
                    name=config_form.cleaned_data['name'],
                    description=config_form.cleaned_data.get('description', ''),
                    algorithm_params={
                        'popsize': config_form.cleaned_data['popsize'],
                        'maxgen': config_form.cleaned_data['maxgen'],
                        'teacher_conflict_cost': config_form.cleaned_data['teacher_conflict_cost'],
                        'place_conflict_cost': config_form.cleaned_data['place_conflict_cost'],
                        'capacity_cost': config_form.cleaned_data['capacity_cost'],
                        'gender_mismatch_cost': config_form.cleaned_data['gender_mismatch_cost'],
                    },
                    status='pending'
                )

                # اجرای الگوریتم در background
                threading.Thread(target=run_scheduling_algorithm, args=(task.id,)).start()

                messages.success(request, 'زمان‌بندی با موفقیت ایجاد شد و در حال پردازش است.')
                return redirect('scheduling:task_detail', pk=task.id)

            except Exception as e:
                messages.error(request, f'خطا در ایجاد زمان‌بندی: {str(e)}')

        return render(request, 'scheduling_module/manual_input.html', {
            'course_form': course_form,
            'teacher_form': teacher_form,
            'config_form': config_form
        })


class TaskListView(SchedulingBaseView):
    """View برای نمایش لیست وظایف زمان‌بندی"""

    @method_decorator(login_required)
    def get(self, request):
        user = request.user
        form = ScheduleFilterForm(request.GET or None)

        # فیلتر کردن وظایف بر اساس نقش کاربر
        if user.role in ['admin', 'education_officer']:
            # مدیر و مسئول آموزش فقط وظایف دانشگاه (تننت) خودشان را می‌بینند
            user_universities = UniversityConfig.objects.filter(university_id=user.university_id)
            tasks = SchedulingTask.objects.filter(university_config__in=user_universities)
        elif user.role == 'supervisor':
            tasks = SchedulingTask.objects.all()
        else:
            tasks = SchedulingTask.objects.filter(Q(created_by=user) | Q(is_public=True))

        # اعمال فیلترها
        if form.is_valid():
            status_filter = form.cleaned_data.get('status')
            date_from = form.cleaned_data.get('date_from')
            date_to = form.cleaned_data.get('date_to')
            search = form.cleaned_data.get('search')

            if status_filter:
                tasks = tasks.filter(status=status_filter)
            if date_from:
                tasks = tasks.filter(created_at__date__gte=date_from)
            if date_to:
                tasks = tasks.filter(created_at__date__lte=date_to)
            if search:
                tasks = tasks.filter(Q(name__icontains=search) | Q(description__icontains=search))

        # مرتب‌سازی
        tasks = tasks.order_by('-created_at')

        return render(request, 'scheduling_module/task_list.html', {
            'tasks': tasks,
            'form': form
        })


class TeacherScheduleView(View):
    """View برای نمایش برنامه زمان‌بندی اساتید"""

    @method_decorator(login_required)
    def get(self, request):
        user = request.user
        
        if user.role == 'teacher':
            # استاد فقط برنامه خودش
            if hasattr(user, 'teacher_profile'):
                schedules = Schedule.objects.filter(teacher=user.teacher_profile)
                return render(request, 'scheduling_module/teacher_schedule.html', {
                    'schedules': schedules,
                    'teacher': user.teacher_profile
                })
            else:
                messages.error(request, 'پروفایل استاد یافت نشد.')
                return redirect('dashboard')
        
        # مدیر یا مسئول آموزش برنامه اساتید دانشگاه خودشان را می‌بینند؛ سوپروایزر همه را
        if user.role == 'supervisor':
            universities = UniversityConfig.objects.all()
        else:
            universities = UniversityConfig.objects.filter(university_id=user.university_id)
        
        # همه اساتید دانشگاه‌های کاربر
        teachers = Teacher.objects.filter(university_config__in=universities)
        
        context = {
            'teachers': teachers,
            'universities': universities,
        }
        
        return render(request, 'scheduling_module/teacher_schedule.html', context)


# ============================================================================
# API‌های ساده برای React
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_university_list(request):
    """لیست دانشگاه‌های کاربر"""
    user = request.user
    
    if user.role == 'supervisor':
        universities = UniversityConfig.objects.all()
    elif user.role in ('admin', 'education_officer'):
        universities = UniversityConfig.objects.filter(university_id=user.university_id)
    elif user.role == 'teacher':
        if hasattr(user, 'teacher_profile'):
            universities = UniversityConfig.objects.filter(id=user.teacher_profile.university_config_id)
        else:
            universities = UniversityConfig.objects.none()
    else:
        universities = UniversityConfig.objects.none()
    
    data = list(universities.values('id', 'name', 'semester', 'created_at'))
    
    return Response({
        'success': True,
        'count': len(data),
        'universities': data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOnly])
def api_create_university(request):
    """ایجاد دانشگاه جدید"""
    try:
        name = request.data.get('name')
        semester = request.data.get('semester', 'نیمسال اول')

        if not request.user.university_id and request.user.role != 'supervisor':
            return Response({
                'success': False,
                'message': 'حساب شما به هیچ دانشگاهی متصل نیست'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not name:
            return Response({
                'success': False,
                'message': 'نام پیکربندی الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # بررسی تکراری نبودن نام در همان دانشگاه (تننت)
        if UniversityConfig.objects.filter(name=name, university_id=request.user.university_id).exists():
            return Response({
                'success': False,
                'message': 'پیکربندی‌ای با این نام قبلاً برای دانشگاه شما ثبت شده است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        university = UniversityConfig.objects.create(
            university_id=request.user.university_id,
            name=name,
            semester=semester,
            days_of_week=[
                {"id": 0, "name": "شنبه", "enabled": True},
                {"id": 1, "name": "یکشنبه", "enabled": True},
                {"id": 2, "name": "دوشنبه", "enabled": True},
                {"id": 3, "name": "سه‌شنبه", "enabled": True},
                {"id": 4, "name": "چهارشنبه", "enabled": True}
            ],
            time_slots=[
                {"id": 0, "start": "08:00", "end": "10:00", "enabled": True},
                {"id": 1, "start": "10:00", "end": "12:00", "enabled": True},
                {"id": 2, "start": "14:00", "end": "16:00", "enabled": True},
                {"id": 3, "start": "16:00", "end": "18:00", "enabled": True}
            ],
            max_units_per_student=20,
            max_classes_per_day=3,
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'message': 'دانشگاه با موفقیت ایجاد شد',
            'university': {
                'id': university.id,
                'name': university.name,
                'semester': university.semester,
                'created_at': university.created_at
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'خطا در ایجاد دانشگاه: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsUniversityMember])
def api_university_stats(request, university_id):
    """آمار دانشگاه"""
    try:
        university = UniversityConfig.objects.get(id=university_id)
        
        # بررسی دسترسی
        if not request.user.role == 'supervisor':
            if request.user.role == 'admin' and university.created_by != request.user:
                return Response({
                    'success': False,
                    'message': 'دسترسی غیرمجاز'
                }, status=status.HTTP_403_FORBIDDEN)
        
        stats = {
            'id': university.id,
            'name': university.name,
            'semester': university.semester,
            
            'teachers': {
                'total': university.teachers.count(),
                'with_account': university.teachers.filter(user__isnull=False).count(),
                'without_account': university.teachers.filter(user__isnull=True).count(),
            },
            
            'courses': {
                'total': university.courses.count(),
                'by_type': dict(university.courses.values_list('course_type').annotate(count=Count('id'))),
            },
            
            'places': {
                'total': university.places.count(),
                'available': university.places.filter(available=True).count(),
                'by_type': dict(university.places.values_list('place_type').annotate(count=Count('id'))),
            },
            
            'student_groups': {
                'total': university.student_groups.count(),
                'total_capacity': university.student_groups.aggregate(total=Sum('size'))['total'] or 0,
            },
            
            'scheduling': {
                'tasks': university.scheduling_tasks.count(),
                'pending': university.scheduling_tasks.filter(status='pending').count(),
                'processing': university.scheduling_tasks.filter(status='processing').count(),
                'completed': university.scheduling_tasks.filter(status='completed').count(),
            },
            
            'schedules': {
                'total': Schedule.objects.filter(university_config=university).count(),
                'by_day': dict(Schedule.objects.filter(university_config=university)
                              .values_list('day_of_week')
                              .annotate(count=Count('id'))),
            }
        }
        
        return Response({
            'success': True,
            'stats': stats
        })
        
    except UniversityConfig.DoesNotExist:
        return Response({
            'success': False,
            'message': 'دانشگاه یافت نشد'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'خطا در دریافت آمار: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)