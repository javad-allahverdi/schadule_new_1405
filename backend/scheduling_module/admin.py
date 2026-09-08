# from django.contrib import admin
# from django.utils.html import format_html
# from django.utils import timezone
# from .models import (
#     UniversityConfig, Place, Teacher, Course, 
#     SchedulingTask, ScheduleResult, ScheduleConstraint, StudentGroup
# )


# class PlaceInline(admin.TabularInline):
#     """Inline برای نمایش مکان‌ها در صفحه پیکربندی دانشگاه"""
#     model = Place
#     extra = 0
#     fields = ('code', 'name', 'place_type', 'capacity', 'available')
#     readonly_fields = ('available',)
#     show_change_link = True
#     verbose_name = 'مکان'
#     verbose_name_plural = 'مکان‌ها'
#     classes = ('collapse',)


# class TeacherInline(admin.TabularInline):
#     """Inline برای نمایش اساتید در صفحه پیکربندی دانشگاه"""
#     model = Teacher
#     extra = 0
#     fields = ('code', 'full_name', 'gender', 'degree', 'max_units')
#     show_change_link = True
#     verbose_name = 'استاد'
#     verbose_name_plural = 'اساتید'
#     classes = ('collapse',)
    
#     def get_gender_display(self, obj):
#         """نمایش جنسیت به صورت متن"""
#         gender_dict = dict(Teacher.GENDER_CHOICES)
#         return gender_dict.get(obj.gender, 'نامشخص')
    
#     def get_degree_display(self, obj):
#         """نمایش مدرک به صورت متن"""
#         degree_dict = dict(Teacher.DEGREE_CHOICES)
#         return degree_dict.get(obj.degree, 'نامشخص')


# class CourseInline(admin.TabularInline):
#     """Inline برای نمایش دروس در صفحه پیکربندی دانشگاه"""
#     model = Course
#     extra = 0
#     fields = ('code', 'name', 'course_type', 'units', 'priority', 'expected_students')
#     filter_horizontal = ('teachers',)
#     show_change_link = True
#     verbose_name = 'درس'
#     verbose_name_plural = 'دروس'
#     classes = ('collapse',)


# class ScheduleConstraintInline(admin.TabularInline):
#     """Inline برای نمایش محدودیت‌ها در صفحه پیکربندی دانشگاه"""
#     model = ScheduleConstraint
#     extra = 0
#     fields = ('constraint_type', 'is_active', 'description')
#     show_change_link = True
#     verbose_name = 'محدودیت'
#     verbose_name_plural = 'محدودیت‌ها'
#     classes = ('collapse',)


# @admin.register(UniversityConfig)
# class UniversityConfigAdmin(admin.ModelAdmin):
#     list_display = ('name', 'semester', 'created_by_info', 'created_at', 'places_count', 'teachers_count', 'courses_count')
#     list_filter = ('semester', 'created_at')
#     search_fields = ('name', 'semester', 'created_by__username', 'created_by__first_name')
#     raw_id_fields = ('created_by',)
#     readonly_fields = ('created_at', 'updated_at')
#     date_hierarchy = 'created_at'
#     ordering = ('-created_at',)
    
#     inlines = [PlaceInline, TeacherInline, CourseInline, ScheduleConstraintInline]
    
#     fieldsets = (
#         ('اطلاعات دانشگاه', {
#             'fields': ('name', 'semester')
#         }),
#         ('تنظیمات زمان‌بندی', {
#             'fields': ('days_of_week', 'time_slots', 'max_units_per_student', 'max_classes_per_day'),
#             'description': 'تنظیمات اصلی برای الگوریتم زمان‌بندی'
#         }),
#         ('اطلاعات ایجاد کننده', {
#             'fields': ('created_by',),
#             'classes': ('collapse',)
#         }),
#         ('تاریخ‌چه', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def created_by_info(self, obj):
#         if obj.created_by:
#             return obj.created_by.get_full_name()
#         return '-'
#     created_by_info.short_description = 'ایجاد کننده'
    
#     def places_count(self, obj):
#         return obj.places.count()
#     places_count.short_description = 'تعداد مکان‌ها'
    
#     def teachers_count(self, obj):
#         return obj.teachers.count()
#     teachers_count.short_description = 'تعداد اساتید'
    
#     def courses_count(self, obj):
#         return obj.courses.count()
#     courses_count.short_description = 'تعداد دروس'


# @admin.register(Place)
# class PlaceAdmin(admin.ModelAdmin):
#     list_display = ('code', 'name', 'place_type', 'capacity', 'gender_display', 'available', 'university_config')
#     list_filter = ('place_type', 'gender', 'available', 'university_config__name')
#     search_fields = ('code', 'name', 'university_config__name')
#     list_editable = ('available',)
#     list_select_related = ('university_config',)
    
#     fieldsets = (
#         ('اطلاعات شناسایی', {
#             'fields': ('code', 'name', 'university_config')
#         }),
#         ('ویژگی‌های مکان', {
#             'fields': ('place_type', 'capacity', 'gender', 'facilities')
#         }),
#         ('وضعیت', {
#             'fields': ('available',)
#         }),
#     )
    
#     def gender_display(self, obj):
#         return dict(Place.GENDER_CHOICES).get(obj.gender, 'نامشخص')
#     gender_display.short_description = 'جنسیت'


# @admin.register(Teacher)
# class TeacherAdmin(admin.ModelAdmin):
#     list_display = ('code', 'full_name', 'gender_display', 'degree_display', 'employment_type_display', 
#                    'max_units', 'min_units', 'university_config')
#     list_filter = ('gender', 'degree', 'employment_type', 'university_config__name')
#     search_fields = ('code', 'full_name', 'university_config__name')
#     list_select_related = ('university_config',)
    
#     fieldsets = (
#         ('اطلاعات شناسایی', {
#             'fields': ('code', 'full_name', 'university_config')
#         }),
#         ('مشخصات فردی', {
#             'fields': ('gender', 'degree', 'employment_type', 'position')
#         }),
#         ('ظرفیت تدریس', {
#             'fields': ('max_units', 'min_units')
#         }),
#         ('محدودیت‌های زمانی', {
#             'fields': ('unavailable_times',),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def gender_display(self, obj):
#         return dict(Teacher.GENDER_CHOICES).get(obj.gender, 'نامشخص')
#     gender_display.short_description = 'جنسیت'
    
#     def degree_display(self, obj):
#         return dict(Teacher.DEGREE_CHOICES).get(obj.degree, 'نامشخص')
#     degree_display.short_description = 'مدرک'
    
#     def employment_type_display(self, obj):
#         return dict(Teacher.EMPLOYMENT_CHOICES).get(obj.employment_type, 'نامشخص')
#     employment_type_display.short_description = 'نوع استخدام'


# @admin.register(Course)
# class CourseAdmin(admin.ModelAdmin):
#     list_display = ('code', 'name', 'course_type', 'units', 'priority', 'expected_students', 
#                    'university_config', 'teachers_count')
#     list_filter = ('course_type', 'unit_type', 'priority', 'university_config__name')
#     search_fields = ('code', 'name', 'university_config__name')
#     filter_horizontal = ('teachers',)
#     raw_id_fields = ('teachers',)
#     list_select_related = ('university_config',)
    
#     fieldsets = (
#         ('اطلاعات شناسایی', {
#             'fields': ('code', 'name', 'university_config')
#         }),
#         ('مشخصات درس', {
#             'fields': ('course_type', 'unit_type', 'units', 'priority', 'gender')
#         }),
#         ('نیازمندی‌ها', {
#             'fields': ('required_place_type', 'required_place', 'expected_students')
#         }),
#         ('ارتباط‌ها', {
#             'fields': ('teachers', 'prerequisites', 'corequisites'),
#             'classes': ('collapse',)
#         }),
#         ('تنظیمات', {
#             'fields': ('fixed',),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def teachers_count(self, obj):
#         return obj.teachers.count()
#     teachers_count.short_description = 'تعداد اساتید'


# class ScheduleResultInline(admin.StackedInline):
#     """Inline برای نمایش نتیجه در صفحه وظیفه"""
#     model = ScheduleResult
#     can_delete = False
#     verbose_name_plural = 'نتایج زمان‌بندی'
#     fields = (
#         'total_cost', 
#         'teacher_conflicts', 
#         'place_conflicts', 
#         'capacity_issues', 
#         'gender_mismatches', 
#         'total_courses',
#         'created_at'
#     )
#     readonly_fields = ('created_at',)
#     extra = 0


# @admin.register(SchedulingTask)
# class SchedulingTaskAdmin(admin.ModelAdmin):
#     list_display = ('name', 'created_by_info', 'status_badge', 'created_at', 
#                    'execution_time_display', 'is_public')
#     list_filter = ('status', 'created_at', 'is_public')
#     search_fields = ('name', 'description', 'created_by__username', 'created_by__first_name')
#     readonly_fields = ('created_at', 'completed_at', 'execution_time', 'status', 'result_preview', 'algorithm_params_preview')
#     actions = ['mark_as_public', 'mark_as_private', 'retry_failed_tasks']
#     date_hierarchy = 'created_at'
#     ordering = ('-created_at',)
    
#     inlines = [ScheduleResultInline]
    
#     fieldsets = (
#         ('اطلاعات وظیفه', {
#             'fields': ('name', 'created_by', 'description', 'is_public')
#         }),
#         ('فایل و وضعیت', {
#             'fields': ('config_file', 'status', 'result_preview')
#         }),
#         ('پارامترهای الگوریتم', {
#             'fields': ('algorithm_params_preview',),
#             'classes': ('collapse',)
#         }),
#         ('زمان‌بندی', {
#             'fields': ('created_at', 'completed_at', 'execution_time'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def created_by_info(self, obj):
#         if obj.created_by:
#             return obj.created_by.get_full_name()
#         return '-'
#     created_by_info.short_description = 'ایجاد کننده'
    
#     def status_badge(self, obj):
#         colors = {
#             'pending': 'orange',
#             'processing': 'blue', 
#             'completed': 'green',
#             'failed': 'red'
#         }
#         color = colors.get(obj.status, 'gray')
#         return format_html(
#             '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 10px;">{}</span>',
#             color,
#             obj.get_status_display()
#         )
#     status_badge.short_description = 'وضعیت'
#     status_badge.admin_order_field = 'status'
    
#     def execution_time_display(self, obj):
#         if obj.execution_time:
#             return f"{obj.execution_time:.2f} ثانیه"
#         return '-'
#     execution_time_display.short_description = 'زمان اجرا'
    
#     def result_preview(self, obj):
#         if obj.result:
#             return format_html('<pre style="max-height: 200px; overflow: auto;">{}</pre>', 
#                              str(obj.result)[:300] + '...')
#         return '-'
#     result_preview.short_description = 'پیش‌نمایش نتایج'
    
#     def algorithm_params_preview(self, obj):
#         if obj.algorithm_params:
#             return format_html('<pre style="max-height: 200px; overflow: auto;">{}</pre>', 
#                              str(obj.algorithm_params)[:300] + '...')
#         return '-'
#     algorithm_params_preview.short_description = 'پارامترهای الگوریتم'
    
#     def mark_as_public(self, request, queryset):
#         updated = queryset.update(is_public=True)
#         self.message_user(request, f'{updated} وظیفه عمومی شدند.')
#     mark_as_public.short_description = 'علامت‌گذاری به عنوان عمومی'
    
#     def mark_as_private(self, request, queryset):
#         updated = queryset.update(is_public=False)
#         self.message_user(request, f'{updated} وظیفه خصوصی شدند.')
#     mark_as_private.short_description = 'علامت‌گذاری به عنوان خصوصی'
    
#     def retry_failed_tasks(self, request, queryset):
#         failed_tasks = queryset.filter(status='failed')
#         for task in failed_tasks:
#             task.status = 'pending'
#             task.completed_at = None
#             task.execution_time = None
#             task.result = {}
#             task.save()
#         self.message_user(request, f'{failed_tasks.count()} وظیفه برای اجرای مجدد آماده شدند.')
#     retry_failed_tasks.short_description = 'اجرای مجدد وظایف ناموفق'


# @admin.register(ScheduleResult)
# class ScheduleResultAdmin(admin.ModelAdmin):
#     list_display = ('task_info', 'total_cost', 'teacher_conflicts', 'place_conflicts', 
#                    'capacity_issues', 'created_at')
#     list_filter = ('created_at',)
#     search_fields = ('task__name', 'task__created_by__username')
#     readonly_fields = ('task', 'schedule_data_preview', 'created_at')
#     date_hierarchy = 'created_at'
    
#     fieldsets = (
#         ('اطلاعات وظیفه', {
#             'fields': ('task',)
#         }),
#         ('آمار کلی', {
#             'fields': ('total_cost', 'teacher_conflicts', 'place_conflicts', 
#                       'capacity_issues', 'gender_mismatches', 'total_courses')
#         }),
#         ('داده‌های زمان‌بندی', {
#             'fields': ('schedule_data_preview',),
#             'classes': ('collapse',)
#         }),
#         ('تاریخ‌چه', {
#             'fields': ('created_at',),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def task_info(self, obj):
#         return obj.task.name
#     task_info.short_description = 'وظیفه'
#     task_info.admin_order_field = 'task__name'
    
#     def schedule_data_preview(self, obj):
#         if obj.schedule_data:
#             return format_html('<pre style="max-height: 300px; overflow: auto;">{}</pre>', 
#                              str(obj.schedule_data))
#         return '-'
#     schedule_data_preview.short_description = 'داده‌های زمان‌بندی'


# @admin.register(ScheduleConstraint)
# class ScheduleConstraintAdmin(admin.ModelAdmin):
#     list_display = ('constraint_type_display', 'university_config', 'is_active', 'description_preview')
#     list_filter = ('constraint_type', 'is_active', 'university_config__name')
#     search_fields = ('description', 'university_config__name')
#     list_editable = ('is_active',)
#     list_select_related = ('university_config',)
    
#     fieldsets = (
#         ('اطلاعات پایه', {
#             'fields': ('university_config', 'constraint_type', 'is_active')
#         }),
#         ('پارامترها و توضیحات', {
#             'fields': ('parameters', 'description')
#         }),
#     )
    
#     def constraint_type_display(self, obj):
#         return obj.get_constraint_type_display()
#     constraint_type_display.short_description = 'نوع محدودیت'
    
#     def description_preview(self, obj):
#         if obj.description:
#             return (obj.description[:80] + '...') if len(obj.description) > 80 else obj.description
#         return '-'
#     description_preview.short_description = 'توضیحات'






# # در admin.py، کلاس StudentGroupAdmin رو به این صورت تغییر بده:
# @admin.register(StudentGroup)
# class StudentGroupAdmin(admin.ModelAdmin):
#     """
#     پنل ادمین برای گروه‌های دانشجویی (ساده)
#     """
#     list_display = ('name', 'size', 'display_total_courses')
#     list_filter = ('size',)  # فقط size داره
#     search_fields = ('name',)
#     ordering = ('name',)  # بر اساس نام مرتب کن
    
#     fieldsets = (
#         ('اطلاعات اصلی', {
#             'fields': ('name', 'size')
#         }),
#         ('دروس الزامی', {
#             'fields': ('required_courses',),
#             'classes': ('collapse',)
#         }),
#         ('دروس اختیاری', {
#             'fields': ('optional_courses',),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def display_total_courses(self, obj):
#         """نمایش تعداد کل دروس"""
#         total = len(obj.required_courses) + len(obj.optional_courses)
#         return f"📚 {total} درس"
#     display_total_courses.short_description = 'تعداد دروس'

















# from django.contrib import admin
# from django.utils.html import format_html
# from django.utils import timezone
# from .models import (
#     UniversityConfig, Place, Teacher, Course, StudentGroup,
#     SchedulingTask, ScheduleResult, ScheduleConstraint, Schedule
# )


# # اینلاین‌ها (مثل قبل)...

# @admin.register(UniversityConfig)
# class UniversityConfigAdmin(admin.ModelAdmin):
#     list_display = ('name', 'semester', 'created_by_info', 'created_at', 'places_count', 'teachers_count', 'courses_count')
#     list_filter = ('semester', 'created_at')
#     search_fields = ('name', 'semester', 'created_by__username', 'created_by__first_name')
#     raw_id_fields = ('created_by',)
#     readonly_fields = ('created_at', 'updated_at')
#     date_hierarchy = 'created_at'
#     ordering = ('-created_at',)
    
#     inlines = [PlaceInline, TeacherInline, CourseInline, ScheduleConstraintInline]
    
#     fieldsets = (
#         ('اطلاعات دانشگاه', {
#             'fields': ('name', 'semester')
#         }),
#         ('تنظیمات زمان‌بندی', {
#             'fields': ('days_of_week', 'time_slots', 'max_units_per_student', 'max_classes_per_day'),
#             'description': 'تنظیمات اصلی برای الگوریتم زمان‌بندی'
#         }),
#         ('اطلاعات ایجاد کننده', {
#             'fields': ('created_by',),
#             'classes': ('collapse',)
#         }),
#         ('تاریخ‌چه', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def created_by_info(self, obj):
#         if obj.created_by:
#             return obj.created_by.get_full_name()
#         return '-'
#     created_by_info.short_description = 'ایجاد کننده'
    
#     def places_count(self, obj):
#         return obj.places.count()
#     places_count.short_description = 'تعداد مکان‌ها'
    
#     def teachers_count(self, obj):
#         return obj.teachers.count()
#     teachers_count.short_description = 'تعداد اساتید'
    
#     def courses_count(self, obj):
#         return obj.courses.count()
#     courses_count.short_description = 'تعداد دروس'


# @admin.register(Teacher)
# class TeacherAdmin(admin.ModelAdmin):
#     list_display = ('code', 'full_name', 'gender_display', 'degree_display', 'employment_type_display', 
#                    'max_units', 'min_units', 'university_config', 'has_user_account')
#     list_filter = ('gender', 'degree', 'employment_type', 'university_config__name')
#     search_fields = ('code', 'full_name', 'university_config__name', 'user__email', 'user__username')
#     list_select_related = ('university_config', 'user')
    
#     fieldsets = (
#         ('اطلاعات شناسایی', {
#             'fields': ('code', 'full_name', 'university_config', 'user')
#         }),
#         ('مشخصات فردی', {
#             'fields': ('gender', 'degree', 'employment_type', 'position')
#         }),
#         ('ظرفیت تدریس', {
#             'fields': ('max_units', 'min_units')
#         }),
#         ('محدودیت‌های زمانی', {
#             'fields': ('unavailable_times',),
#             'classes': ('collapse',)
#         }),
#     )
    
#     def gender_display(self, obj):
#         return dict(Teacher.GENDER_CHOICES).get(obj.gender, 'نامشخص')
#     gender_display.short_description = 'جنسیت'
    
#     def degree_display(self, obj):
#         return dict(Teacher.DEGREE_CHOICES).get(obj.degree, 'نامشخص')
#     degree_display.short_description = 'مدرک'
    
#     def employment_type_display(self, obj):
#         return dict(Teacher.EMPLOYMENT_CHOICES).get(obj.employment_type, 'نامشخص')
#     employment_type_display.short_description = 'نوع استخدام'
    
#     def has_user_account(self, obj):
#         return bool(obj.user)
#     has_user_account.boolean = True
#     has_user_account.short_description = 'حساب کاربری'


# # بقیه adminها مثل قبل...

# @admin.register(Schedule)
# class ScheduleAdmin(admin.ModelAdmin):
#     """
#     پنل ادمین برای برنامه‌های زمان‌بندی
#     """
#     list_display = ('course', 'teacher', 'classroom', 'day_display', 'time_display', 'semester', 'university_config')
#     list_filter = ('day_of_week', 'semester', 'university_config__name')
#     search_fields = ('course__name', 'teacher__full_name', 'classroom__name', 'university_config__name')
#     list_select_related = ('course', 'teacher', 'classroom', 'student_group', 'university_config')
#     ordering = ('day_of_week', 'start_time')
    
#     fieldsets = (
#         ('اطلاعات دانشگاه', {
#             'fields': ('university_config', 'semester', 'academic_year')
#         }),
#         ('جزئیات کلاس', {
#             'fields': ('course', 'teacher', 'classroom', 'student_group')
#         }),
#         ('زمان‌بندی', {
#             'fields': ('day_of_week', 'start_time', 'end_time', 'time_slot')
#         }),
#         ('تاریخ‌چه', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     readonly_fields = ('created_at', 'updated_at')
    
#     def day_display(self, obj):
#         return obj.get_day_of_week_display()
#     day_display.short_description = 'روز'
    
#     def time_display(self, obj):
#         return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
#     time_display.short_description = 'زمان'












from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum
from .models import (
    UniversityConfig, Place, Teacher, Course, StudentGroup,
    SchedulingTask, ScheduleResult, ScheduleConstraint, Schedule
)


# ============== تعریف Inline‌ها در ابتدا ==============

class PlaceInline(admin.TabularInline):
    """Inline برای نمایش مکان‌ها در صفحه پیکربندی دانشگاه"""
    model = Place
    extra = 0
    fields = ('code', 'name', 'place_type', 'capacity', 'available')
    readonly_fields = ('available',)
    show_change_link = True
    verbose_name = 'مکان'
    verbose_name_plural = 'مکان‌ها'
    classes = ('collapse',)


class TeacherInline(admin.TabularInline):
    """Inline برای نمایش اساتید در صفحه پیکربندی دانشگاه"""
    model = Teacher
    extra = 0
    fields = ('code', 'full_name', 'gender', 'degree', 'max_units')
    show_change_link = True
    verbose_name = 'استاد'
    verbose_name_plural = 'اساتید'
    classes = ('collapse',)
    
    def get_gender_display(self, obj):
        """نمایش جنسیت به صورت متن"""
        gender_dict = dict(Teacher.GENDER_CHOICES)
        return gender_dict.get(obj.gender, 'نامشخص')
    
    def get_degree_display(self, obj):
        """نمایش مدرک به صورت متن"""
        degree_dict = dict(Teacher.DEGREE_CHOICES)
        return degree_dict.get(obj.degree, 'نامشخص')


class CourseInline(admin.TabularInline):
    """Inline برای نمایش دروس در صفحه پیکربندی دانشگاه"""
    model = Course
    extra = 0
    fields = ('code', 'name', 'course_type', 'units', 'priority', 'expected_students')
    filter_horizontal = ('teachers',)
    show_change_link = True
    verbose_name = 'درس'
    verbose_name_plural = 'دروس'
    classes = ('collapse',)


class ScheduleConstraintInline(admin.TabularInline):
    """Inline برای نمایش محدودیت‌ها در صفحه پیکربندی دانشگاه"""
    model = ScheduleConstraint
    extra = 0
    fields = ('constraint_type', 'is_active', 'description')
    show_change_link = True
    verbose_name = 'محدودیت'
    verbose_name_plural = 'محدودیت‌ها'
    classes = ('collapse',)


class ScheduleResultInline(admin.StackedInline):
    """Inline برای نمایش نتیجه در صفحه وظیفه"""
    model = ScheduleResult
    can_delete = False
    verbose_name_plural = 'نتایج زمان‌بندی'
    fields = (
        'total_cost', 
        'teacher_conflicts', 
        'place_conflicts', 
        'capacity_issues', 
        'gender_mismatches', 
        'total_courses',
        'created_at'
    )
    readonly_fields = ('created_at',)
    extra = 0


# ============== تعریف ModelAdmin‌ها ==============

@admin.register(UniversityConfig)
class UniversityConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'semester', 'created_by_info', 'created_at', 'places_count', 'teachers_count', 'courses_count')
    list_filter = ('semester', 'created_at')
    search_fields = ('name', 'semester', 'created_by__username', 'created_by__first_name')
    raw_id_fields = ('created_by',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    inlines = [PlaceInline, TeacherInline, CourseInline, ScheduleConstraintInline]
    
    fieldsets = (
        ('اطلاعات دانشگاه', {
            'fields': ('name', 'semester')
        }),
        ('تنظیمات زمان‌بندی', {
            'fields': ('days_of_week', 'time_slots', 'max_units_per_student', 'max_classes_per_day'),
            'description': 'تنظیمات اصلی برای الگوریتم زمان‌بندی'
        }),
        ('اطلاعات ایجاد کننده', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        }),
        ('تاریخ‌چه', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def created_by_info(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return '-'
    created_by_info.short_description = 'ایجاد کننده'
    
    def places_count(self, obj):
        return obj.places.count()
    places_count.short_description = 'تعداد مکان‌ها'
    
    def teachers_count(self, obj):
        return obj.teachers.count()
    teachers_count.short_description = 'تعداد اساتید'
    
    def courses_count(self, obj):
        return obj.courses.count()
    courses_count.short_description = 'تعداد دروس'


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'place_type', 'capacity', 'gender_display', 'available', 'university_config')
    list_filter = ('place_type', 'gender', 'available', 'university_config__name')
    search_fields = ('code', 'name', 'university_config__name')
    list_editable = ('available',)
    list_select_related = ('university_config',)
    
    fieldsets = (
        ('اطلاعات شناسایی', {
            'fields': ('code', 'name', 'university_config')
        }),
        ('ویژگی‌های مکان', {
            'fields': ('place_type', 'capacity', 'gender', 'facilities')
        }),
        ('وضعیت', {
            'fields': ('available',)
        }),
    )
    
    def gender_display(self, obj):
        return dict(Place.GENDER_CHOICES).get(obj.gender, 'نامشخص')
    gender_display.short_description = 'جنسیت'


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('code', 'full_name', 'gender_display', 'degree_display', 'employment_type_display', 
                   'max_units', 'min_units', 'university_config', 'has_user_account')
    list_filter = ('gender', 'degree', 'employment_type', 'university_config__name')
    search_fields = ('code', 'full_name', 'university_config__name', 'user__email', 'user__username')
    list_select_related = ('university_config', 'user')
    
    fieldsets = (
        ('اطلاعات شناسایی', {
            'fields': ('code', 'full_name', 'university_config', 'user')
        }),
        ('مشخصات فردی', {
            'fields': ('gender', 'degree', 'employment_type', 'position')
        }),
        ('ظرفیت تدریس', {
            'fields': ('max_units', 'min_units')
        }),
        ('محدودیت‌های زمانی', {
            'fields': ('unavailable_times',),
            'classes': ('collapse',)
        }),
    )
    
    def gender_display(self, obj):
        return dict(Teacher.GENDER_CHOICES).get(obj.gender, 'نامشخص')
    gender_display.short_description = 'جنسیت'
    
    def degree_display(self, obj):
        return dict(Teacher.DEGREE_CHOICES).get(obj.degree, 'نامشخص')
    degree_display.short_description = 'مدرک'
    
    def employment_type_display(self, obj):
        return dict(Teacher.EMPLOYMENT_CHOICES).get(obj.employment_type, 'نامشخص')
    employment_type_display.short_description = 'نوع استخدام'
    
    def has_user_account(self, obj):
        return bool(obj.user)
    has_user_account.boolean = True
    has_user_account.short_description = 'حساب کاربری'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'course_type', 'units', 'priority', 'expected_students', 
                   'university_config', 'teachers_count')
    list_filter = ('course_type', 'unit_type', 'priority', 'university_config__name')
    search_fields = ('code', 'name', 'university_config__name')
    filter_horizontal = ('teachers',)
    raw_id_fields = ('teachers',)
    list_select_related = ('university_config',)
    
    fieldsets = (
        ('اطلاعات شناسایی', {
            'fields': ('code', 'name', 'university_config')
        }),
        ('مشخصات درس', {
            'fields': ('course_type', 'unit_type', 'units', 'priority', 'gender')
        }),
        ('نیازمندی‌ها', {
            'fields': ('required_place_type', 'required_place', 'expected_students')
        }),
        ('ارتباط‌ها', {
            'fields': ('teachers', 'prerequisites', 'corequisites'),
            'classes': ('collapse',)
        }),
        ('تنظیمات', {
            'fields': ('fixed',),
            'classes': ('collapse',)
        }),
    )
    
    def teachers_count(self, obj):
        return obj.teachers.count()
    teachers_count.short_description = 'تعداد اساتید'


@admin.register(SchedulingTask)
class SchedulingTaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by_info', 'status_badge', 'created_at', 
                   'execution_time_display', 'is_public', 'university_config')
    list_filter = ('status', 'created_at', 'is_public', 'university_config__name')
    search_fields = ('name', 'description', 'created_by__username', 'created_by__first_name', 'university_config__name')
    readonly_fields = ('created_at', 'completed_at', 'execution_time', 'status', 'result_preview', 'algorithm_params_preview')
    actions = ['mark_as_public', 'mark_as_private', 'retry_failed_tasks']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    inlines = [ScheduleResultInline]
    
    fieldsets = (
        ('اطلاعات وظیفه', {
            'fields': ('name', 'created_by', 'university_config', 'description', 'is_public')
        }),
        ('فایل و وضعیت', {
            'fields': ('config_file', 'status', 'result_preview')
        }),
        ('پارامترهای الگوریتم', {
            'fields': ('algorithm_params_preview',),
            'classes': ('collapse',)
        }),
        ('زمان‌بندی', {
            'fields': ('created_at', 'completed_at', 'execution_time'),
            'classes': ('collapse',)
        }),
    )
    
    def created_by_info(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return '-'
    created_by_info.short_description = 'ایجاد کننده'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'processing': 'blue', 
            'completed': 'green',
            'failed': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 10px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'وضعیت'
    status_badge.admin_order_field = 'status'
    
    def execution_time_display(self, obj):
        if obj.execution_time:
            return f"{obj.execution_time:.2f} ثانیه"
        return '-'
    execution_time_display.short_description = 'زمان اجرا'
    
    def result_preview(self, obj):
        if obj.result:
            return format_html('<pre style="max-height: 200px; overflow: auto;">{}</pre>', 
                             str(obj.result)[:300] + '...')
        return '-'
    result_preview.short_description = 'پیش‌نمایش نتایج'
    
    def algorithm_params_preview(self, obj):
        if obj.algorithm_params:
            return format_html('<pre style="max-height: 200px; overflow: auto;">{}</pre>', 
                             str(obj.algorithm_params)[:300] + '...')
        return '-'
    algorithm_params_preview.short_description = 'پارامترهای الگوریتم'
    
    def mark_as_public(self, request, queryset):
        """اکشن برای عمومی کردن وظایف"""
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} وظیفه عمومی شدند.')
    mark_as_public.short_description = 'علامت‌گذاری به عنوان عمومی'
    
    def mark_as_private(self, request, queryset):
        """اکشن برای خصوصی کردن وظایف"""
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} وظیفه خصوصی شدند.')
    mark_as_private.short_description = 'علامت‌گذاری به عنوان خصوصی'
    
    def retry_failed_tasks(self, request, queryset):
        """اجرای مجدد وظایف ناموفق"""
        failed_tasks = queryset.filter(status='failed')
        for task in failed_tasks:
            task.status = 'pending'
            task.completed_at = None
            task.execution_time = None
            task.result = {}
            task.save()
        self.message_user(request, f'{failed_tasks.count()} وظیفه برای اجرای مجدد آماده شدند.')
    retry_failed_tasks.short_description = 'اجرای مجدد وظایف ناموفق'


@admin.register(ScheduleResult)
class ScheduleResultAdmin(admin.ModelAdmin):
    list_display = ('task_info', 'total_cost', 'teacher_conflicts', 'place_conflicts', 
                   'capacity_issues', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('task__name', 'task__created_by__username', 'task__university_config__name')
    readonly_fields = ('task', 'schedule_data_preview', 'created_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('اطلاعات وظیفه', {
            'fields': ('task',)
        }),
        ('آمار کلی', {
            'fields': ('total_cost', 'teacher_conflicts', 'place_conflicts', 
                      'capacity_issues', 'gender_mismatches', 'total_courses')
        }),
        ('داده‌های زمان‌بندی', {
            'fields': ('schedule_data_preview',),
            'classes': ('collapse',)
        }),
        ('تاریخ‌چه', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def task_info(self, obj):
        return obj.task.name
    task_info.short_description = 'وظیفه'
    task_info.admin_order_field = 'task__name'
    
    def schedule_data_preview(self, obj):
        if obj.schedule_data:
            return format_html('<pre style="max-height: 300px; overflow: auto;">{}</pre>', 
                             str(obj.schedule_data))
        return '-'
    schedule_data_preview.short_description = 'داده‌های زمان‌بندی'


@admin.register(ScheduleConstraint)
class ScheduleConstraintAdmin(admin.ModelAdmin):
    list_display = ('constraint_type_display', 'university_config', 'is_active', 'description_preview')
    list_filter = ('constraint_type', 'is_active', 'university_config__name')
    search_fields = ('description', 'university_config__name')
    list_editable = ('is_active',)
    list_select_related = ('university_config',)
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('university_config', 'constraint_type', 'is_active')
        }),
        ('پارامترها و توضیحات', {
            'fields': ('parameters', 'description')
        }),
    )
    
    def constraint_type_display(self, obj):
        return obj.get_constraint_type_display()
    constraint_type_display.short_description = 'نوع محدودیت'
    
    def description_preview(self, obj):
        if obj.description:
            return (obj.description[:80] + '...') if len(obj.description) > 80 else obj.description
        return '-'
    description_preview.short_description = 'توضیحات'


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    """
    پنل ادمین برای گروه‌های دانشجویی
    """
    list_display = ('name', 'size', 'university_config', 'display_total_courses')
    list_filter = ('size', 'university_config__name')
    search_fields = ('name', 'university_config__name')
    ordering = ('name',)
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'size', 'university_config')
        }),
        ('دروس الزامی', {
            'fields': ('required_courses',),
            'classes': ('collapse',)
        }),
        ('دروس اختیاری', {
            'fields': ('optional_courses',),
            'classes': ('collapse',)
        }),
    )
    
    def display_total_courses(self, obj):
        """نمایش تعداد کل دروس"""
        total = len(obj.required_courses) + len(obj.optional_courses)
        return f"📚 {total} درس"
    display_total_courses.short_description = 'تعداد دروس'


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """
    پنل ادمین برای برنامه‌های زمان‌بندی
    """
    list_display = ('course', 'teacher', 'classroom', 'day_display', 'time_display', 'semester', 'university_config')
    list_filter = ('day_of_week', 'semester', 'university_config__name')
    search_fields = ('course__name', 'teacher__full_name', 'classroom__name', 'university_config__name')
    list_select_related = ('course', 'teacher', 'classroom', 'student_group', 'university_config')
    ordering = ('day_of_week', 'start_time')
    
    fieldsets = (
        ('اطلاعات دانشگاه', {
            'fields': ('university_config', 'semester', 'academic_year')
        }),
        ('جزئیات کلاس', {
            'fields': ('course', 'teacher', 'classroom', 'student_group')
        }),
        ('زمان‌بندی', {
            'fields': ('day_of_week', 'start_time', 'end_time', 'time_slot')
        }),
        ('تاریخ‌چه', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def day_display(self, obj):
        return obj.get_day_of_week_display()
    day_display.short_description = 'روز'
    
    def time_display(self, obj):
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_display.short_description = 'زمان'