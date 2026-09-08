# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from .models import Customuser, UserProfile
# from django.utils.translation import gettext_lazy as _


# class UserProfileInline(admin.StackedInline):
#     model = UserProfile
#     can_delete = False
#     verbose_name_plural = 'اطلاعات تکمیلی پروفایل'
#     fk_name = 'user'
#     fields = ('bio', 'address', 'birth_date', 'educational_background', 'expertise')
#     extra = 0


# @admin.register(Customuser)
# class CustomuserAdmin(UserAdmin):
#     list_display = ('username', 'email', 'get_full_name', 'role', 'national_code', 'is_active', 'is_staff')
#     list_filter = ('role', 'gender', 'is_active', 'is_staff', 'is_superuser', 'is_verified')
#     search_fields = ('username', 'email', 'first_name', 'last_name', 'national_code', 'phone_number')
#     ordering = ('-date_joined',)
    
#     fieldsets = (
#         (None, {'fields': ('username', 'password')}),
#         (_('اطلاعات شخصی'), {
#             'fields': (
#                 'first_name', 'last_name', 'email', 
#                 'national_code', 'phone_number', 'gender',
#                 'profile_image', 'department'
#             )
#         }),
#         (_('نقش و دسترسی‌ها'), {
#             'fields': (
#                 'role', 'is_verified',
#                 'is_active', 'is_staff', 'is_superuser',
#                 'groups', 'user_permissions'
#             )
#         }),
#         (_('تاریخ‌های مهم'), {
#             'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': (
#                 'username', 'email', 'password1', 'password2',
#                 'first_name', 'last_name', 'role', 'national_code'
#             ),
#         }),
#     )
    
#     readonly_fields = ('last_login', 'date_joined', 'created_at', 'updated_at')
#     filter_horizontal = ('groups', 'user_permissions',)
    
#     inlines = (UserProfileInline,)
    
#     def get_full_name(self, obj):
#         return obj.get_full_name()
#     get_full_name.short_description = 'نام کامل'
    
#     def get_inline_instances(self, request, obj=None):
#         if not obj:
#             return []
#         return super().get_inline_instances(request, obj)


# @admin.register(UserProfile)
# class UserProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'truncated_bio', 'birth_date')
#     list_select_related = ('user',)
#     search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__national_code', 'bio')
#     list_filter = ('user__role', 'user__gender')
    
#     fieldsets = (
#         (_('اطلاعات کاربر'), {
#             'fields': ('user',)
#         }),
#         (_('اطلاعات تکمیلی'), {
#             'fields': ('bio', 'address', 'birth_date')
#         }),
#         (_('سوابق آموزشی و تخصص'), {
#             'fields': ('educational_background', 'expertise'),
#             'classes': ('collapse',)
#         }),
#     )
    
#     readonly_fields = ('user',)
    
#     def truncated_bio(self, obj):
#         if obj.bio:
#             return (obj.bio[:50] + '...') if len(obj.bio) > 50 else obj.bio
#         return '-'
#     truncated_bio.short_description = 'بیوگرافی (خلاصه)'
    
#     def has_add_permission(self, request):
#         # فقط از طریق Customuser می‌توان پروفایل ایجاد کرد
#         return False
















from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django import forms
from .models import CustomUser, UserProfile


class CustomUserChangeForm(UserChangeForm):
    """فرم تغییر کاربر در ادمین"""
    class Meta:
        model = CustomUser
        fields = '__all__'


class CustomUserCreationForm(UserCreationForm):
    """فرم ایجاد کاربر در ادمین"""
    class Meta:
        model = CustomUser
        fields = ('username', 'email')


class UserProfileInline(admin.StackedInline):
    """اینلاین پروفایل کاربر"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'اطلاعات تکمیلی پروفایل'
    fk_name = 'user'
    fields = ('bio', 'address', 'birth_date', 'educational_background', 
             'expertise', 'emergency_contact', 'emergency_phone',
             'email_notifications', 'sms_notifications')
    extra = 0


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """ادمین کاربران"""
    
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    list_display = (
        'username', 'email', 'get_full_name', 'role', 
        'national_code', 'is_active', 'is_staff', 'is_verified'
    )
    
    list_filter = (
        'role', 'gender', 'is_active', 'is_staff', 
        'is_superuser', 'is_verified', 'email_verified'
    )
    
    search_fields = (
        'username', 'email', 'first_name', 'last_name', 
        'national_code', 'phone_number'
    )
    
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        
        (_('اطلاعات شخصی'), {
            'fields': (
                'first_name', 'last_name', 'email', 
                'national_code', 'phone_number', 'gender',
                'profile_image', 'department'
            )
        }),
        
        (_('نقش و دسترسی‌ها'), {
            'fields': (
                'role', 'is_verified', 'email_verified', 'phone_verified',
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        
        (_('امنیت'), {
            'fields': (
                'failed_login_attempts', 'lockout_until',
                'last_password_change'
            ),
            'classes': ('collapse',)
        }),
        
        (_('تاریخ‌های مهم'), {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'role', 'national_code',
                'phone_number', 'gender', 'department'
            ),
        }),
    )
    
    readonly_fields = (
        'last_login', 'date_joined', 'created_at', 'updated_at',
        'failed_login_attempts', 'last_password_change'
    )
    
    filter_horizontal = ('groups', 'user_permissions',)
    
    inlines = (UserProfileInline,)
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'نام کامل'
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)
    
    def unlock_user(self, request, queryset):
        """اکشن برای باز کردن قفل کاربران"""
        updated = queryset.update(failed_login_attempts=0, lockout_until=None)
        self.message_user(request, f'{updated} کاربر باز شد.')
    unlock_user.short_description = "باز کردن قفل کاربران انتخاب شده"
    
    actions = ['unlock_user']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """ادمین پروفایل کاربران"""
    
    list_display = ('user', 'truncated_bio', 'birth_date', 'emergency_contact')
    list_select_related = ('user',)
    
    search_fields = (
        'user__username', 'user__first_name', 'user__last_name', 
        'user__national_code', 'bio', 'emergency_contact'
    )
    
    list_filter = ('user__role', 'user__gender', 'email_notifications', 'sms_notifications')
    
    fieldsets = (
        (_('اطلاعات کاربر'), {
            'fields': ('user',)
        }),
        
        (_('اطلاعات شخصی'), {
            'fields': ('bio', 'address', 'birth_date')
        }),
        
        (_('اطلاعات تماس اضطراری'), {
            'fields': ('emergency_contact', 'emergency_phone'),
            'classes': ('collapse',)
        }),
        
        (_('سوابق آموزشی و تخصص'), {
            'fields': ('educational_background', 'expertise'),
            'classes': ('collapse',)
        }),
        
        (_('تنظیمات'), {
            'fields': ('email_notifications', 'sms_notifications'),
            'classes': ('collapse',)
        }),
        
        (_('تاریخ‌ها'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('user', 'created_at', 'updated_at')
    
    def truncated_bio(self, obj):
        if obj.bio:
            return (obj.bio[:50] + '...') if len(obj.bio) > 50 else obj.bio
        return '-'
    truncated_bio.short_description = 'بیوگرافی (خلاصه)'
    
    def has_add_permission(self, request):
        # فقط از طریق CustomUser می‌توان پروفایل ایجاد کرد
        return False
    
    def get_age(self, obj):
        return obj.get_age()
    get_age.short_description = 'سن'