from django.contrib import admin
from .models import Department, SystemLog
from account_module.models import CustomUser


class DepartmentInline(admin.TabularInline):
    """Inline برای نمایش دانشکده‌های تحت مدیریت در صفحه کاربر"""
    model = Department
    extra = 0
    fields = ('name', 'code', 'created_at')
    readonly_fields = ('created_at',)
    can_delete = False
    show_change_link = True
    verbose_name = 'دانشکده تحت مدیریت'
    verbose_name_plural = 'دانشکده‌های تحت مدیریت'


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'head_info', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'code', 'head__username', 'head__first_name', 'head__last_name')
    raw_id_fields = ('head',)
    autocomplete_fields = ('head',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fieldsets = (
        ('اطلاعات پایه دانشکده', {
            'fields': ('name', 'code', 'description')
        }),
        ('مدیریت', {
            'fields': ('head',),
            'description': 'انتخاب مدیر دانشکده از بین کاربران سیستم'
        }),
    )
    
    readonly_fields = ('created_at',)
    
    def head_info(self, obj):
        if obj.head:
            return f"{obj.head.get_full_name()} ({obj.head.username})"
        return "بدون مدیر"
    head_info.short_description = 'مدیر دانشکده'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(head=request.user)


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('user_info', 'action_display', 'truncated_description', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at', 'user__role')
    search_fields = (
        'user__username', 
        'user__first_name', 
        'user__last_name', 
        'description', 
        'ip_address'
    )
    readonly_fields = (
        'user', 
        'action', 
        'description', 
        'ip_address', 
        'user_agent', 
        'created_at'
    )
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fieldsets = (
        ('اطلاعات کاربر', {
            'fields': ('user', 'action_display')
        }),
        ('جزئیات عملیات', {
            'fields': ('description', 'ip_address', 'user_agent')
        }),
        ('تاریخ‌چه', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_info(self, obj):
        return f"{obj.user.get_full_name()} ({obj.user.username})"
    user_info.short_description = 'کاربر'
    
    def action_display(self, obj):
        return obj.get_action_display()
    action_display.short_description = 'نوع عملیات'
    
    def truncated_description(self, obj):
        if obj.description:
            return (obj.description[:60] + '...') if len(obj.description) > 60 else obj.description
        return '-'
    truncated_description.short_description = 'توضیحات (خلاصه)'
    
    def has_add_permission(self, request):
        """لاگ‌ها فقط توسط سیستم ایجاد می‌شوند"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """لاگ‌ها غیرقابل ویرایش هستند"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """فقط سوپریوزر می‌تواند لاگ‌ها را حذف کند"""
        return request.user.is_superuser