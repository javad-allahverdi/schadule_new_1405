from django.db import models
from account_module.models import CustomUser, University


class Department(models.Model):
    """گروه/دپارتمان داخلی یک دانشگاه (زیرمجموعه‌ی University، نه یک مستأجر مستقل)"""
    name = models.CharField(max_length=100, verbose_name='نام گروه')
    code = models.CharField(max_length=10, verbose_name='کد گروه')
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, related_name='departments',
        verbose_name='دانشگاه', null=True, blank=True
    )
    head = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='headed_departments', verbose_name='مدیر گروه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'گروه آموزشی'
        verbose_name_plural = 'گروه‌های آموزشی'
        unique_together = ['code', 'university']
        indexes = [models.Index(fields=['university'])]

    def __str__(self):
        return self.name


class SystemLog(models.Model):
    ACTION_CHOICES = [
        ('login', 'ورود'),
        ('logout', 'خروج'),
        ('create', 'ایجاد'),
        ('update', 'ویرایش'),
        ('delete', 'حذف'),
        ('schedule', 'زمان‌بندی'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='system_logs')
    university = models.ForeignKey(
        University, on_delete=models.CASCADE, null=True, blank=True,
        related_name='system_logs', verbose_name='دانشگاه'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'لاگ سیستم'
        verbose_name_plural = 'لاگ‌های سیستم'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['university']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
        ]