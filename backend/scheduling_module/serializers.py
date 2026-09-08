# scheduling_module/serializers.py
"""
این فایل قبلاً یک کپیِ مستقل و ناهماهنگ از سریالایزرها را نگه می‌داشت که باعث
چند باگ واقعی شد (مثلاً پیکربندی نیمسالِ سوپروایزر همیشه با university=None
ذخیره می‌شد، چون این نسخه‌ی قدیمی هرگز برای معماری چندمستأجری به‌روزرسانی
نشده بود، در حالی که panel_module/serializers.py به‌روز بود اما استفاده
نمی‌شد).

برای جلوگیری از این دسته باگ‌ها در آینده، اینجا فقط از نسخه‌ی واحد و
به‌روز در panel_module.serializers بازصادر می‌شود؛ دو تعریف مستقل دیگر
وجود ندارد.
"""
from panel_module.serializers import (
    UniversityConfigSerializer,
    PlaceSerializer,
    TeacherSerializer,
    TeacherCreateSerializer,
    CourseSerializer,
    StudentGroupSerializer,
    SchedulingTaskSerializer,
    ScheduleResultSerializer,
    ScheduleConstraintSerializer,
    ScheduleSerializer,
    TeacherScheduleSerializer,
    UniversityStatsSerializer,
)

__all__ = [
    'UniversityConfigSerializer',
    'PlaceSerializer',
    'TeacherSerializer',
    'TeacherCreateSerializer',
    'CourseSerializer',
    'StudentGroupSerializer',
    'SchedulingTaskSerializer',
    'ScheduleResultSerializer',
    'ScheduleConstraintSerializer',
    'ScheduleSerializer',
    'TeacherScheduleSerializer',
    'UniversityStatsSerializer',
]
