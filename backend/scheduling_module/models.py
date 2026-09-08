from datetime import timezone
from django.db import models
from django.core.exceptions import ValidationError
from account_module.models import CustomUser, University
import os
import json


def validate_yaml_file(value):
    ext = os.path.splitext(value.name)[1]
    if ext.lower() not in ['.yaml', '.yml']:
        raise ValidationError('فایل باید در فرمت YAML باشد.')


class UniversityConfig(models.Model):
    """
    پیکربندی یک نیمسال زمان‌بندی برای یک دانشگاه (University).
    هر دانشگاه می‌تواند چند UniversityConfig (برای نیمسال‌های مختلف) داشته باشد.
    """
    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        related_name='configs',
        verbose_name='دانشگاه (مستأجر)',
        null=True, blank=True,
    )
    name = models.CharField(max_length=255, verbose_name='نام پیکربندی')
    semester = models.CharField(max_length=100, verbose_name='نیمسال تحصیلی')
    days_of_week = models.JSONField(default=list, verbose_name='روزهای هفته')
    time_slots = models.JSONField(default=list, verbose_name='بازه‌های زمانی')
    max_units_per_student = models.IntegerField(default=20, verbose_name='حداکثر واحد هر دانشجو')
    max_classes_per_day = models.IntegerField(default=3, verbose_name='حداکثر کلاس در روز')
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, verbose_name='ایجاد کننده')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'پیکربندی نیمسال'
        verbose_name_plural = 'پیکربندی‌های نیمسال'
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['name']),
            models.Index(fields=['university']),
        ]

    def __str__(self):
        return f"{self.name} - {self.semester}"
    
    def get_university_users(self):
        """دریافت همه کاربران مرتبط با این دانشگاه"""
        if self.university_id:
            return CustomUser.objects.filter(university=self.university)
        return CustomUser.objects.filter(id=self.created_by_id)


class Place(models.Model):
    PLACE_TYPES = [
        ('کلاس تئوری', 'کلاس تئوری'),
        ('آزمایشگاه', 'آزمایشگاه'),
        ('کارگاه', 'کارگاه'),
        ('سالن ورزشی', 'سالن ورزشی'),
        ('استخر', 'استخر'),
        ('زمین چمن', 'زمین چمن'),
        ('سالن آمفی‌تئاتر', 'سالن آمفی‌تئاتر'),
        ('سالن اجتماعات', 'سالن اجتماعات'),
        ('کتابخانه', 'کتابخانه'),
        ('سایر', 'سایر'),
    ]

    GENDER_CHOICES = [
        (0, 'مختلط'),
        (1, 'مرد'),
        (2, 'زن'),
    ]

    code = models.CharField(max_length=20, verbose_name='کد مکان')
    name = models.CharField(max_length=255, verbose_name='نام مکان')
    capacity = models.IntegerField(verbose_name='ظرفیت')
    place_type = models.CharField(max_length=50, choices=PLACE_TYPES, verbose_name='نوع مکان')
    gender = models.IntegerField(choices=GENDER_CHOICES, default=0, verbose_name='جنسیت')
    facilities = models.JSONField(default=list, verbose_name='امکانات')
    available = models.BooleanField(default=True, verbose_name='فعال')
    university_config = models.ForeignKey(UniversityConfig, on_delete=models.CASCADE, related_name='places')

    class Meta:
        verbose_name = 'مکان'
        verbose_name_plural = 'مکان‌ها'
        unique_together = ['code', 'university_config']
        indexes = [
            models.Index(fields=['university_config']),
            models.Index(fields=['available']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.university_config.name}"
    
    def clean(self):
        """اعتبارسنجی یکتایی کد در هر دانشگاه"""
        if Place.objects.filter(
            code=self.code, 
            university_config=self.university_config
        ).exclude(id=self.id).exists():
            raise ValidationError({'code': 'کد مکان در این دانشگاه تکراری است'})


class Teacher(models.Model):
    DEGREE_CHOICES = [
        (1, 'کارشناسی'),
        (2, 'کارشناسی ارشد'),
        (3, 'دکتری'),
    ]

    EMPLOYMENT_CHOICES = [
        (1, 'تمام وقت'),
        (2, 'نیمه وقت'),
        (3, 'حقالتدریس'),
    ]

    GENDER_CHOICES = [
        (1, 'مرد'),
        (2, 'زن'),
    ]

    code = models.CharField(max_length=20, verbose_name='کد استاد')
    full_name = models.CharField(max_length=255, verbose_name='نام کامل')
    gender = models.IntegerField(choices=GENDER_CHOICES, verbose_name='جنسیت')
    degree = models.IntegerField(choices=DEGREE_CHOICES, verbose_name='مدرک')
    employment_type = models.IntegerField(choices=EMPLOYMENT_CHOICES, verbose_name='نوع استخدام')
    position = models.IntegerField(verbose_name='پست')
    max_units = models.IntegerField(verbose_name='حداکثر واحد')
    min_units = models.IntegerField(verbose_name='حداقل واحد')
    unavailable_times = models.JSONField(default=list, verbose_name='زمان‌های غیرقابل دسترس')
    university_config = models.ForeignKey(UniversityConfig, on_delete=models.CASCADE, related_name='teachers')
    
    # ارتباط با کاربر برای لاگین
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teacher_profile',
        verbose_name='حساب کاربری'
    )

    class Meta:
        verbose_name = 'استاد'
        verbose_name_plural = 'اساتید'
        unique_together = ['code', 'university_config']
        indexes = [
            models.Index(fields=['university_config']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.code}) - {self.university_config.name}"
    
    def clean(self):
        """اعتبارسنجی یکتایی کد در هر دانشگاه"""
        if Teacher.objects.filter(
            code=self.code, 
            university_config=self.university_config
        ).exclude(id=self.id).exists():
            raise ValidationError({'code': 'کد استاد در این دانشگاه تکراری است'})


class Course(models.Model):
    COURSE_TYPES = [
        ('تئوری', 'تئوری'),
        ('عملی', 'عملی'),
        ('تئوری_عملی', 'تئوری_عملی'),
    ]

    UNIT_TYPES = [
        ('پایه', 'پایه'),
        ('تخصصی', 'تخصصی'),
        ('عمومی', 'عمومی'),
    ]

    code = models.CharField(max_length=20, verbose_name='کد درس')
    name = models.CharField(max_length=255, verbose_name='نام درس')
    course_type = models.CharField(max_length=20, choices=COURSE_TYPES, verbose_name='نوع درس')
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPES, verbose_name='نوع واحد')
    units = models.IntegerField(verbose_name='تعداد واحد')
    priority = models.IntegerField(default=1, verbose_name='اولویت')
    gender = models.IntegerField(default=0, verbose_name='جنسیت')
    required_place_type = models.CharField(max_length=50, verbose_name='نوع مکان مورد نیاز')
    prerequisites = models.JSONField(default=list, verbose_name='پیش‌نیازها')
    corequisites = models.JSONField(default=list, verbose_name='هم‌نیازها')
    expected_students = models.IntegerField(verbose_name='تعداد دانشجوی مورد انتظار')
    teachers = models.ManyToManyField(Teacher, related_name='courses', verbose_name='اساتید')
    required_place = models.CharField(max_length=20, blank=True, null=True, verbose_name='مکان الزامی')
    fixed = models.BooleanField(default=False, verbose_name='ثابت')
    university_config = models.ForeignKey(UniversityConfig, on_delete=models.CASCADE, related_name='courses')

    class Meta:
        verbose_name = 'درس'
        verbose_name_plural = 'دروس'
        unique_together = ['code', 'university_config']
        indexes = [
            models.Index(fields=['university_config']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.university_config.name}"
    
    def clean(self):
        """اعتبارسنجی یکتایی کد در هر دانشگاه"""
        if Course.objects.filter(
            code=self.code, 
            university_config=self.university_config
        ).exclude(id=self.id).exists():
            raise ValidationError({'code': 'کد درس در این دانشگاه تکراری است'})


class StudentGroup(models.Model):
    DEGREE_LEVEL_CHOICES = [
        ('associate', 'کاردانی'),
        ('bachelor', 'کارشناسی'),
        ('master', 'کارشناسی ارشد'),
        ('phd', 'دکتری'),
    ]
    GENDER_CHOICES = [
        (0, 'مختلط'),
        (1, 'مرد'),
        (2, 'زن'),
    ]

    name = models.CharField(max_length=255, verbose_name='نام گروه')
    size = models.IntegerField(verbose_name='ظرفیت گروه', default=30)
    entry_year = models.IntegerField(
        null=True, blank=True, verbose_name='سال ورود',
        help_text='مثلاً ۱۴۰۳ برای دانشجویان ورودی ۱۴۰۳'
    )
    field_of_study = models.CharField(max_length=255, blank=True, verbose_name='رشته تحصیلی')
    degree_level = models.CharField(
        max_length=20, choices=DEGREE_LEVEL_CHOICES, default='bachelor',
        verbose_name='مقطع تحصیلی'
    )
    gender = models.IntegerField(
        choices=GENDER_CHOICES, default=0, verbose_name='جنسیت گروه',
        help_text='برای تطبیق با جنسیت مکان و درس در الگوریتم زمان‌بندی'
    )
    required_courses = models.JSONField(default=list, verbose_name='دروس الزامی')
    optional_courses = models.JSONField(default=list, verbose_name='دروس اختیاری')
    university_config = models.ForeignKey(
        UniversityConfig, 
        on_delete=models.CASCADE, 
        related_name='student_groups',
        verbose_name='دانشگاه'
    )
    
    class Meta:
        verbose_name = 'گروه دانشجویی'
        verbose_name_plural = 'گروه‌های دانشجویی'
        ordering = ['-entry_year', 'name']
        indexes = [
            models.Index(fields=['university_config']),
        ]

    def __str__(self):
        return f"{self.name} - ظرفیت: {self.size} - {self.university_config.name}"


class SchedulingTask(models.Model):
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('processing', 'در حال پردازش'),
        ('completed', 'تکمیل شده'),
        ('failed', 'ناموفق'),
    ]

    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
                                   related_name='scheduling_tasks', verbose_name='ایجاد کننده')
    name = models.CharField(max_length=255, verbose_name='نام زمان‌بندی')
    config_file = models.FileField(
        upload_to='scheduling_configs/',
        validators=[validate_yaml_file],
        verbose_name='فایل پیکربندی',
        null=True,
        blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    result = models.JSONField(null=True, blank=True, verbose_name='نتایج')
    algorithm_params = models.JSONField(default=dict, verbose_name='پارامترهای الگوریتم')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تکمیل')
    execution_time = models.FloatField(null=True, blank=True, verbose_name='زمان اجرا (ثانیه)')
    is_public = models.BooleanField(default=False, verbose_name='عمومی')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    # ارتباط با دانشگاه
    university_config = models.ForeignKey(
        UniversityConfig, 
        on_delete=models.CASCADE, 
        related_name='scheduling_tasks',
        verbose_name='دانشگاه'
    )

    class Meta:
        verbose_name = 'وظیفه زمان‌بندی'
        verbose_name_plural = 'وظایف زمان‌بندی'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['status']),
            models.Index(fields=['university_config']),
        ]

    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"

    def clean(self):
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()


class ScheduleResult(models.Model):
    APPROVAL_CHOICES = [
        ('pending_review', 'در انتظار بررسی'),
        ('approved', 'تأیید شده (نهایی)'),
        ('rejected', 'رد شده (نیاز به بازنگری)'),
    ]

    task = models.OneToOneField(SchedulingTask, on_delete=models.CASCADE, 
                                related_name='schedule_result', verbose_name='وظیفه')
    schedule_data = models.JSONField(verbose_name='داده‌های زمان‌بندی')
    total_cost = models.FloatField(verbose_name='هزینه کل')
    teacher_conflicts = models.IntegerField(default=0, verbose_name='تداخل اساتید')
    place_conflicts = models.IntegerField(default=0, verbose_name='تداخل مکان‌ها')
    capacity_issues = models.IntegerField(default=0, verbose_name='مشکلات ظرفیت')
    gender_mismatches = models.IntegerField(default=0, verbose_name='عدم تطابق جنسیت')
    total_courses = models.IntegerField(default=0, verbose_name='تعداد کل دروس')

    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_CHOICES, default='pending_review',
        verbose_name='وضعیت تأیید'
    )
    approved_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_schedule_results', verbose_name='تأیید شده توسط'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ تأیید')
    rejection_note = models.TextField(blank=True, verbose_name='دلیل رد / یادداشت بازنگری')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    class Meta:
        verbose_name = 'نتیجه زمان‌بندی'
        verbose_name_plural = 'نتایج زمان‌بندی'
        indexes = [
            models.Index(fields=['task']),
            models.Index(fields=['approval_status']),
        ]

    def __str__(self):
        return f"نتیجه برای {self.task.name}"


class ScheduleConstraint(models.Model):
    CONSTRAINT_TYPES = [
        ('teacher_unavailable', 'عدم دسترسی استاد'),
        ('concurrent_courses', 'دروس همزمان'),
        ('same_teacher_courses', 'دروس یک استاد'),
        ('place_unavailable', 'عدم دسترسی مکان'),
        ('time_preference', 'ترجیح زمانی'),
    ]

    university_config = models.ForeignKey(UniversityConfig, on_delete=models.CASCADE, related_name='constraints')
    constraint_type = models.CharField(max_length=50, choices=CONSTRAINT_TYPES, verbose_name='نوع محدودیت')
    parameters = models.JSONField(verbose_name='پارامترها')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        verbose_name = 'محدودیت زمان‌بندی'
        verbose_name_plural = 'محدودیت‌های زمان‌بندی'
        indexes = [
            models.Index(fields=['university_config']),
        ]

    def __str__(self):
        return f"{self.get_constraint_type_display()} - {self.description[:50]}"


# ============== مدل جدید برای ذخیره زمانبندی نهایی ==============
class Schedule(models.Model):
    DAY_CHOICES = [
        (0, 'شنبه'),
        (1, 'یکشنبه'),
        (2, 'دوشنبه'),
        (3, 'سه‌شنبه'),
        (4, 'چهارشنبه'),
        (5, 'پنجشنبه'),
    ]
    
    university_config = models.ForeignKey(
        UniversityConfig,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='دانشگاه'
    )

    schedule_result = models.ForeignKey(
        'ScheduleResult',
        on_delete=models.CASCADE,
        related_name='schedule_entries',
        verbose_name='نتیجه زمان‌بندی',
        null=True, blank=True,
    )
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='استاد',
        null=True,
        blank=True
    )
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='درس'
    )
    
    classroom = models.ForeignKey(
        Place,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='کلاس'
    )
    
    student_group = models.ForeignKey(
        StudentGroup,
        on_delete=models.SET_NULL,
        related_name='schedules',
        verbose_name='گروه دانشجویی',
        null=True,
        blank=True
    )
    
    day_of_week = models.IntegerField(choices=DAY_CHOICES, verbose_name='روز هفته')
    start_time = models.TimeField(verbose_name='ساعت شروع')
    end_time = models.TimeField(verbose_name='ساعت پایان')
    
    # برای راحتی ذخیره به صورت رشته
    time_slot = models.CharField(max_length=50, verbose_name='بازه زمانی')
    
    semester = models.CharField(max_length=100, verbose_name='نیمسال')
    academic_year = models.CharField(max_length=20, verbose_name='سال تحصیلی')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')

    class Meta:
        verbose_name = 'برنامه زمان‌بندی'
        verbose_name_plural = 'برنامه‌های زمان‌بندی'
        ordering = ['day_of_week', 'start_time']
        indexes = [
            models.Index(fields=['university_config']),
            models.Index(fields=['teacher']),
            models.Index(fields=['day_of_week', 'start_time']),
            models.Index(fields=['semester']),
        ]

    def __str__(self):
        return f"{self.course.name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"
    
    def get_day_name(self):
        return dict(self.DAY_CHOICES).get(self.day_of_week, 'نامشخص')
    
    def get_duration(self):
        """محاسبه مدت زمان کلاس (به دقیقه)"""
        from datetime import datetime
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        duration = end - start
        return int(duration.total_seconds() / 60)