from rest_framework import permissions
from rest_framework.permissions import BasePermission
from .models import UniversityConfig


class IsUniversityMember(BasePermission):
    """
    بررسی می‌کند که آیا کاربر عضو دانشگاه مورد نظر است
    """
    
    def has_permission(self, request, view):
        # مدیر سیستم دسترسی کامل دارد
        if request.user.role == 'supervisor':
            return True
        
        # کاربر باید احراز هویت شده باشد
        if not request.user.is_authenticated:
            return False
        
        # گرفتن university_id از view یا request
        university_id = None
        
        # روش ۱: از query params
        university_id = request.query_params.get('university_id')
        
        # روش ۲: از داده‌های POST/PUT
        if not university_id and request.data:
            university_id = request.data.get('university_config')
            if not university_id:
                university_id = request.data.get('university_config_id')
        
        # روش ۳: از view kwargs
        if not university_id and hasattr(view, 'kwargs'):
            university_id = view.kwargs.get('university_id')
        
        # اگر university_id مشخص نشده، بررسی عمومی
        if not university_id:
            return self._check_general_permission(request.user)
        
        # بررسی دسترسی به دانشگاه خاص
        return self._check_university_access(request.user, university_id)
    
    def has_object_permission(self, request, view, obj):
        # مدیر سیستم دسترسی کامل دارد
        if request.user.role == 'supervisor':
            return True
        
        # کاربر باید احراز هویت شده باشد
        if not request.user.is_authenticated:
            return False
        
        # بررسی بر اساس نوع object
        if hasattr(obj, 'university_config'):
            return self._check_university_access(request.user, obj.university_config.id)
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False
    
    def _check_general_permission(self, user):
        """بررسی دسترسی عمومی"""
        # مدیر دانشگاه و مسئول آموزش دسترسی دارند
        if user.role in ['admin', 'education_officer']:
            return True
        return False
    
    def _check_university_access(self, user, university_id):
        """بررسی دسترسی کاربر به دانشگاه (پیکربندی نیمسال) خاص"""
        try:
            university_config = UniversityConfig.objects.get(id=university_id)

            # سوپروایزر همیشه true برمی‌گردد (چک شده در has_permission)، اما برای احتیاط:
            if user.role == 'supervisor':
                return True

            # مدیر دانشگاه و مسئول آموزش: فقط اگر همان دانشگاه (تننت) کاربر باشد
            if user.role in ('admin', 'education_officer'):
                return (
                    university_config.university_id is not None
                    and university_config.university_id == user.university_id
                )

            # استاد: اگر استاد در این پیکربندی تدریس می‌کند
            if user.role == 'teacher':
                if hasattr(user, 'teacher_profile'):
                    return user.teacher_profile.university_config_id == university_config.id
                return False

            return False

        except UniversityConfig.DoesNotExist:
            return False


class IsAdminOrEducationOfficer(BasePermission):
    """فقط مدیر دانشگاه یا مسئول آموزش"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['admin', 'education_officer']


class IsTeacherOnly(BasePermission):
    """فقط اساتید"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'teacher'


class IsAdminOnly(BasePermission):
    """فقط مدیر دانشگاه"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role == 'admin'


class CanViewSchedule(BasePermission):
    """دسترسی مشاهده برنامه زمان‌بندی"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # همه نقش‌ها می‌توانند برنامه را ببینند
        return request.user.role in ['admin', 'education_officer', 'teacher']


class CanManageTeachers(BasePermission):
    """مشاهده برای همه اعضای دانشگاه (استاد هم می‌تواند لیست همکاران را ببیند)؛
    ایجاد/ویرایش/حذف فقط برای مدیر، مسئول آموزش یا سوپروایزر"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ['admin', 'education_officer', 'supervisor']


class CanManageCourses(BasePermission):
    """مشاهده برای همه اعضای دانشگاه؛ ایجاد/ویرایش/حذف فقط برای مدیر و مسئول آموزش"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ['admin', 'education_officer', 'supervisor']


class CanManagePlaces(BasePermission):
    """مشاهده برای همه اعضای دانشگاه؛ ایجاد/ویرایش/حذف فقط برای مدیر و مسئول آموزش"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ['admin', 'education_officer', 'supervisor']


class CanRunScheduling(BasePermission):
    """دسترسی اجرای زمان‌بندی"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['admin', 'education_officer', 'supervisor']