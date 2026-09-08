from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from .models import Department, SystemLog  # مدل‌های panel_module
from scheduling_module.models import (
    UniversityConfig, Place, Teacher, Course, StudentGroup,
    SchedulingTask, ScheduleResult, ScheduleConstraint, Schedule
)
from account_module.models import CustomUser

class UniversityConfigSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)
    places_count = serializers.IntegerField(source='places.count', read_only=True)
    teachers_count = serializers.IntegerField(source='teachers.count', read_only=True)
    courses_count = serializers.IntegerField(source='courses.count', read_only=True)
    
    class Meta:
        model = UniversityConfig
        fields = [
            'id', 'university', 'university_name', 'name', 'semester', 'days_of_week', 'time_slots',
            'max_units_per_student', 'max_classes_per_day',
            'created_by', 'created_by_name', 'created_by_username',
            'created_at', 'updated_at', 'places_count', 'teachers_count', 'courses_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            # پیکربندی همیشه به دانشگاه (تننت) خود کاربر وصل می‌شود، نه دانشگاه دلخواه
            if request.user.role != 'supervisor':
                validated_data['university'] = request.user.university
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # فقط سوپروایزر می‌تواند university یک پیکربندی را تغییر دهد؛
        # برای بقیه‌ی نقش‌ها این فیلد نادیده گرفته می‌شود تا نتوانند
        # پیکربندی را (تصادفی یا عمدی) به دانشگاه دیگری منتقل کنند
        if request and hasattr(request, 'user') and request.user.role != 'supervisor':
            validated_data.pop('university', None)
        return super().update(instance, validated_data)
    
    def validate_name(self, value):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.university_id:
            if UniversityConfig.objects.filter(
                name=value, 
                university=request.user.university
            ).exists():
                raise serializers.ValidationError("پیکربندی‌ای با این نام قبلاً برای این دانشگاه ثبت شده است.")
        return value


class PlaceSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    place_type_display = serializers.CharField(source='get_place_type_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Place
        fields = [
            'id', 'code', 'name', 'capacity', 'place_type', 'place_type_display',
            'gender', 'gender_display', 'facilities', 'available',
            'university_config', 'university_name'
        ]
    
    def validate(self, data):
        if 'code' in data and 'university_config' in data:
            queryset = Place.objects.filter(
                code=data['code'],
                university_config=data['university_config']
            )
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'code': 'کد مکان در این دانشگاه تکراری است'
                })
        
        return data
    
    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("ظرفیت باید بزرگتر از صفر باشد")
        return value


class TeacherSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    degree_display = serializers.CharField(source='get_degree_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'code', 'full_name', 'gender', 'gender_display',
            'degree', 'degree_display', 'employment_type', 'employment_type_display',
            'position', 'max_units', 'min_units', 'unavailable_times',
            'university_config', 'university_name', 'user', 'user_email', 'user_username'
        ]
        read_only_fields = ['user']
    
    def validate(self, data):
        if 'code' in data and 'university_config' in data:
            queryset = Teacher.objects.filter(
                code=data['code'],
                university_config=data['university_config']
            )
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'code': 'کد استاد در این دانشگاه تکراری است'
                })
        
        if 'max_units' in data and 'min_units' in data:
            if data['max_units'] < data['min_units']:
                raise serializers.ValidationError({
                    'max_units': 'حداکثر واحد باید بیشتر یا مساوی حداقل واحد باشد'
                })
        
        if 'max_units' in data and (data['max_units'] < 0 or data['max_units'] > 24):
            raise serializers.ValidationError({
                'max_units': 'حداکثر واحد باید بین ۰ تا ۲۴ باشد'
            })
        
        if 'min_units' in data and (data['min_units'] < 0 or data['min_units'] > 24):
            raise serializers.ValidationError({
                'min_units': 'حداقل واحد باید بین ۰ تا ۲۴ باشد'
            })
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        create_user = validated_data.pop('create_user', False)
        
        with transaction.atomic():
            teacher = Teacher.objects.create(**validated_data)
            
            if create_user and request:
                username = f"teacher_{teacher.code}_{teacher.university_config.id}"
                email = f"{teacher.code}@{teacher.university_config.name.replace(' ', '').lower()}.edu"
                
                user = CustomUser.objects.create_user(
                    username=username,
                    email=email,
                    password=teacher.code,
                    first_name=teacher.full_name.split()[0] if teacher.full_name else '',
                    last_name=' '.join(teacher.full_name.split()[1:]) if teacher.full_name else '',
                    role='teacher',
                    university=teacher.university_config.university,
                    national_code='',
                    phone_number='',
                    gender='male' if teacher.gender == 1 else 'female',
                    department='',
                    is_verified=False
                )
                
                teacher.user = user
                teacher.save()
        
        return teacher


class TeacherCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    create_user_account = serializers.BooleanField(default=False, write_only=True)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'code', 'full_name', 'name', 'last_name', 'email',
            'gender', 'degree', 'employment_type', 'position',
            'max_units', 'min_units', 'unavailable_times',
            'university_config', 'create_user_account'
        ]
    
    def validate(self, data):
        name = data.pop('name', '')
        last_name = data.pop('last_name', '')
        if name and last_name:
            data['full_name'] = f"{name} {last_name}"
        
        return super().validate(data)
    
    def create(self, validated_data):
        create_user_account = validated_data.pop('create_user_account', False)
        email = validated_data.pop('email', None)
        
        with transaction.atomic():
            teacher = Teacher.objects.create(**validated_data)
            
            if create_user_account:
                request = self.context.get('request')
                if request and email:
                    user = CustomUser.objects.create_user(
                        username=email,
                        email=email,
                        password=teacher.code,
                        first_name=validated_data.get('full_name', '').split()[0],
                        last_name=' '.join(validated_data.get('full_name', '').split()[1:]),
                        role='teacher',
                        university=teacher.university_config.university,
                        is_verified=False
                    )
                    
                    teacher.user = user
                    teacher.save()
        
        return teacher


class CourseSerializer(serializers.ModelSerializer):
    teachers_info = serializers.SerializerMethodField()
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    course_type_display = serializers.CharField(source='get_course_type_display', read_only=True)
    unit_type_display = serializers.CharField(source='get_unit_type_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'course_type', 'course_type_display',
            'unit_type', 'unit_type_display', 'units', 'priority',
            'gender', 'gender_display', 'required_place_type',
            'prerequisites', 'corequisites', 'expected_students',
            'teachers', 'teachers_info', 'required_place', 'fixed',
            'university_config', 'university_name'
        ]
    
    def get_teachers_info(self, obj):
        return [
            {
                'id': teacher.id,
                'code': teacher.code,
                'full_name': teacher.full_name
            }
            for teacher in obj.teachers.all()
        ]
    
    def validate(self, data):
        if 'code' in data and 'university_config' in data:
            queryset = Course.objects.filter(
                code=data['code'],
                university_config=data['university_config']
            )
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'code': 'کد درس در این دانشگاه تکراری است'
                })
        
        if 'units' in data and (data['units'] <= 0 or data['units'] > 4):
            raise serializers.ValidationError({
                'units': 'تعداد واحد باید بین ۱ تا ۴ باشد'
            })
        
        if 'expected_students' in data and data['expected_students'] <= 0:
            raise serializers.ValidationError({
                'expected_students': 'تعداد دانشجویان باید بیشتر از صفر باشد'
            })
        
        return data


class StudentGroupSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    total_courses = serializers.SerializerMethodField()
    degree_level_display = serializers.CharField(source='get_degree_level_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = StudentGroup
        fields = ['id', 'name', 'size', 'entry_year', 'field_of_study', 'degree_level',
                 'degree_level_display', 'gender', 'gender_display',
                 'required_courses', 'optional_courses', 
                 'total_courses', 'university_config', 'university_name']
    
    def get_total_courses(self, obj):
        return len(obj.required_courses) + len(obj.optional_courses)
    
    def validate(self, data):
        if 'size' in data and data['size'] <= 0:
            raise serializers.ValidationError({
                'size': 'ظرفیت گروه باید بزرگتر از صفر باشد'
            })
        
        return data


class SchedulingTaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    
    class Meta:
        model = SchedulingTask
        fields = [
            'id', 'name', 'created_by', 'created_by_name',
            'config_file', 'status', 'status_display', 'result',
            'algorithm_params', 'created_at', 'completed_at',
            'execution_time', 'is_public', 'description',
            'university_config', 'university_name'
        ]
        read_only_fields = ['created_by', 'created_at', 'completed_at', 'execution_time']


class ScheduleResultSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)
    
    class Meta:
        model = ScheduleResult
        fields = [
            'id', 'task', 'task_name', 'schedule_data',
            'total_cost', 'teacher_conflicts', 'place_conflicts',
            'capacity_issues', 'gender_mismatches', 'total_courses',
            'created_at'
        ]
        read_only_fields = ['created_at']


class ScheduleConstraintSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    constraint_type_display = serializers.CharField(source='get_constraint_type_display', read_only=True)
    
    class Meta:
        model = ScheduleConstraint
        fields = [
            'id', 'university_config', 'university_name',
            'constraint_type', 'constraint_type_display',
            'parameters', 'description', 'is_active'
        ]
    
    def validate_parameters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("پارامترها باید به فرمت JSON (دیکشنری) باشند")
        return value


class ScheduleSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    teacher_code = serializers.CharField(source='teacher.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_code = serializers.CharField(source='classroom.code', read_only=True)
    student_group_name = serializers.CharField(source='student_group.name', read_only=True)
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    university_name = serializers.CharField(source='university_config.name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = [
            'id', 'university_config', 'university_name',
            'teacher', 'teacher_name', 'teacher_code',
            'course', 'course_name', 'course_code',
            'classroom', 'classroom_name', 'classroom_code',
            'student_group', 'student_group_name',
            'day_of_week', 'day_name', 'start_time', 'end_time',
            'time_slot', 'semester', 'academic_year',
            'duration', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_duration(self, obj):
        return obj.get_duration()


class TeacherScheduleSerializer(serializers.ModelSerializer):
    course_info = serializers.SerializerMethodField()
    classroom_info = serializers.SerializerMethodField()
    time_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Schedule
        fields = [
            'id', 'course_info', 'classroom_info', 'time_info',
            'day_of_week', 'start_time', 'end_time',
            'student_group', 'semester'
        ]
    
    def get_course_info(self, obj):
        return {
            'id': obj.course.id,
            'name': obj.course.name,
            'code': obj.course.code,
            'units': obj.course.units
        }
    
    def get_classroom_info(self, obj):
        return {
            'id': obj.classroom.id,
            'name': obj.classroom.name,
            'code': obj.classroom.code
        }
    
    def get_time_info(self, obj):
        return {
            'day': obj.get_day_of_week_display(),
            'start': obj.start_time.strftime('%H:%M'),
            'end': obj.end_time.strftime('%H:%M'),
            'time_slot': obj.time_slot
        }


class UniversityStatsSerializer(serializers.Serializer):
    total_teachers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_places = serializers.IntegerField()
    total_student_groups = serializers.IntegerField()
    total_schedules = serializers.IntegerField()
    
    available_places = serializers.IntegerField()
    available_teachers = serializers.IntegerField()
    
    average_courses_per_teacher = serializers.FloatField()
    average_students_per_group = serializers.FloatField()
    
    schedule_coverage = serializers.FloatField(help_text="درصد پوشش زمان‌بندی")


class SystemLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = SystemLog
        fields = ['id', 'user', 'user_name', 'university', 'university_name',
                 'action', 'action_display', 'description',
                 'ip_address', 'created_at']


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'university', 'university_name', 'head', 'head_name',
                 'description', 'created_at']
        read_only_fields = ['university']

    def validate(self, data):
        code = data.get('code', getattr(self.instance, 'code', None))
        university = data.get('university', getattr(self.instance, 'university', None))
        if code and university:
            queryset = Department.objects.filter(code=code, university=university)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError({'code': 'کد گروه در این دانشگاه تکراری است'})
        return data