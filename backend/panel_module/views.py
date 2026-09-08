from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Count

from rest_framework import viewsets, status, permissions
from rest_framework.response import Response

from scheduling_module.models import SchedulingTask, ScheduleResult, Place
from account_module.models import CustomUser
from .models import Department, SystemLog
from .serializers import SystemLogSerializer, DepartmentSerializer

User = get_user_model()


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


# ============================================
# Views سنتی (رندر Template) - برای پنل ادمین داخلی
# ============================================

class DashboardView(View):
    @method_decorator(login_required)
    def get(self, request):
        user = request.user
        context = {}

        if user.role == 'supervisor':
            context.update({
                'total_universities': getattr(user, 'created_universities', CustomUser.objects.none()).count()
                if hasattr(user, 'created_universities') else 0,
                'total_tasks': SchedulingTask.objects.count(),
                'completed_tasks': SchedulingTask.objects.filter(status='completed').count(),
                'pending_tasks': SchedulingTask.objects.filter(status='pending').count(),
                'total_users': CustomUser.objects.count(),
                'recent_tasks': SchedulingTask.objects.order_by('-created_at')[:5],
                'recent_logs': SystemLog.objects.order_by('-created_at')[:10],
            })

        elif user.role in ['admin', 'education_officer']:
            uni = user.university
            tasks = SchedulingTask.objects.filter(university_config__university=uni) if uni else SchedulingTask.objects.none()
            context.update({
                'total_tasks': tasks.count(),
                'completed_tasks': tasks.filter(status='completed').count(),
                'pending_tasks': tasks.filter(status='pending').count(),
                'total_users': CustomUser.objects.filter(university=uni).count() if uni else 0,
                'recent_tasks': tasks.order_by('-created_at')[:5],
                'recent_logs': SystemLog.objects.filter(university=uni).order_by('-created_at')[:10] if uni else [],
            })

        elif user.role == 'teacher':
            teacher_profile = getattr(user, 'teacher_profile', None)
            context.update({
                'my_courses': teacher_profile.courses.all() if teacher_profile else [],
                'upcoming_classes': [],
            })

        return render(request, 'panel_module/dashboard.html', context)


class UserManagementView(View):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if request.user.role not in ['supervisor', 'admin', 'education_officer']:
            return render(request, 'panel_module/access_denied.html')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        if request.user.role == 'supervisor':
            users = CustomUser.objects.all()
        else:
            users = CustomUser.objects.filter(university=request.user.university)
        return render(request, 'panel_module/user_management.html', {'users': users})


class ReportsView(View):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if request.user.role not in ['supervisor', 'admin', 'education_officer']:
            return render(request, 'panel_module/access_denied.html')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        tasks_qs = SchedulingTask.objects.all()
        users_qs = CustomUser.objects.all()

        if request.user.role != 'supervisor':
            tasks_qs = tasks_qs.filter(university_config__university=request.user.university)
            users_qs = users_qs.filter(university=request.user.university)

        context = {
            'tasks_by_status': tasks_qs.values('status').annotate(count=Count('id')),
            'users_by_role': users_qs.values('role').annotate(count=Count('id')),
        }
        return render(request, 'panel_module/reports.html', context)


# ============================================
# DRF ViewSets - برای رابط React
# ============================================

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SystemLog.objects.all()

        if user.role != 'supervisor':
            queryset = queryset.filter(university=user.university)

        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)

        return queryset[:200]


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Department.objects.select_related('university', 'head').all()
        if user.role != 'supervisor':
            queryset = queryset.filter(university=user.university)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            serializer.save()
        else:
            serializer.save(university=user.university)


class DashboardStatsView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """آمار داشبورد بر اساس نقش کاربر"""
        user = request.user

        if user.role == 'supervisor':
            places_qs = Place.objects.all()
            users_qs = CustomUser.objects.all()
            tasks_qs = SchedulingTask.objects.all()
        else:
            places_qs = Place.objects.filter(university_config__university=user.university)
            users_qs = CustomUser.objects.filter(university=user.university)
            tasks_qs = SchedulingTask.objects.filter(university_config__university=user.university)

        stats = {
            'total_places': places_qs.count(),
            'active_places': places_qs.filter(available=True).count(),
            'total_users': users_qs.count(),
            'total_tasks': tasks_qs.count(),
            'completed_tasks': tasks_qs.filter(status='completed').count(),
            'pending_tasks': tasks_qs.filter(status='pending').count(),
            'recent_logs': SystemLogSerializer(
                SystemLog.objects.filter(
                    university=user.university
                ).order_by('-created_at')[:10] if user.role != 'supervisor' else
                SystemLog.objects.order_by('-created_at')[:10],
                many=True
            ).data
        }

        return Response(stats)
