# account_module/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils.text import slugify
import re


class CustomUserManager(BaseUserManager):
    """منیجر سفارشی برای کاربر با اعتبارسنجی‌های امنیتی"""
    
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValidationError('ایمیل الزامی است')
        if not username:
            raise ValidationError('نام کاربری الزامی است')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'supervisor')
        
        return self.create_user(username, email, password, **extra_fields)


SUBDOMAIN_RE = re.compile(r'^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
RESERVED_SUBDOMAINS = {'www', 'api', 'admin', 'static', 'media', 'app', 'mail', 'ftp'}


class University(models.Model):
    """
    دانشگاه/دانشکده به عنوان یک مستأجر (Tenant) مستقل.
    هر دانشگاه از طریق زیردامنه‌ی اختصاصی خودش در دسترس است،
    مثلاً: eng.example.com یا medicine.example.com
    و دارای مدت اعتبار (expiry) مشخص است.
    """

    name = models.CharField(max_length=255, verbose_name='نام دانشگاه/دانشکده')

    subdomain = models.SlugField(
        max_length=63,
        unique=True,
        verbose_name='زیردامنه',
        help_text='فقط حروف کوچک انگلیسی، اعداد و خط تیره (مثلاً: eng برای eng.example.com)'
    )

    logo = models.ImageField(upload_to='university_logos/', null=True, blank=True, verbose_name='لوگو')

    contact_email = models.EmailField(blank=True, verbose_name='ایمیل تماس')
    contact_phone = models.CharField(max_length=15, blank=True, verbose_name='تلفن تماس')
    address = models.TextField(blank=True, verbose_name='آدرس')

    is_active = models.BooleanField(default=True, verbose_name='فعال')

    valid_from = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ شروع اعتبار')
    valid_until = models.DateTimeField(
        null=True, blank=True,
        verbose_name='تاریخ پایان اعتبار',
        help_text='اگر خالی باشد، اعتبار نامحدود است'
    )

    created_by = models.ForeignKey(
        'account_module.CustomUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_universities',
        verbose_name='ایجاد شده توسط (سوپروایزر)'
    )

    max_users = models.IntegerField(default=50, verbose_name='حداکثر تعداد کاربران')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')

    class Meta:
        verbose_name = 'دانشگاه'
        verbose_name_plural = 'دانشگاه‌ها'
        ordering = ['name']
        indexes = [
            models.Index(fields=['subdomain']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    def clean(self):
        super().clean()
        if self.subdomain:
            self.subdomain = self.subdomain.lower().strip()
            if not SUBDOMAIN_RE.match(self.subdomain):
                raise ValidationError({
                    'subdomain': 'زیردامنه فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد.'
                })
            if self.subdomain in RESERVED_SUBDOMAINS:
                raise ValidationError({'subdomain': 'این زیردامنه رزرو شده است و قابل استفاده نیست.'})

    def save(self, *args, **kwargs):
        if self.subdomain:
            self.subdomain = self.subdomain.lower().strip()
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        if not self.valid_until:
            return False
        from django.utils import timezone
        return timezone.now() > self.valid_until

    @property
    def is_accessible(self):
        """دسترسی دانشگاه فقط زمانی فعال است که غیرمنقضی و فعال باشد"""
        return self.is_active and not self.is_expired

    def days_remaining(self):
        if not self.valid_until:
            return None
        from django.utils import timezone
        delta = self.valid_until - timezone.now()
        return max(delta.days, 0)


class CustomUser(AbstractUser):
    """مدل کاربر سفارشی با امنیت بالا"""
    
    ROLE_CHOICES = [
        ('supervisor', 'سوپروایزر کل'),
        ('admin', 'مدیر دانشگاه'),
        ('education_officer', 'مسئول آموزش'),
        ('teacher', 'استاد'),
    ]

    GENDER_CHOICES = [
        ('male', 'مرد'),
        ('female', 'زن'),
    ]

    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='teacher',
        verbose_name='نقش'
    )

    university = models.ForeignKey(
        University,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='members',
        verbose_name='دانشگاه',
        help_text='برای سوپروایزر خالی است (دسترسی سراسری دارد)'
    )
    
    national_code = models.CharField(
        max_length=10, 
        unique=True, 
        null=True, 
        blank=True,
        verbose_name='کد ملی'
    )
    
    phone_number = models.CharField(
        max_length=15, 
        null=True, 
        blank=True,
        verbose_name='شماره تلفن'
    )
    
    gender = models.CharField(
        max_length=10, 
        choices=GENDER_CHOICES, 
        null=True, 
        blank=True,
        verbose_name='جنسیت'
    )
    
    profile_image = models.ImageField(
        upload_to='profiles/%Y/%m/%d/', 
        null=True, 
        blank=True,
        verbose_name='تصویر پروفایل'
    )
    
    department = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        verbose_name='دانشکده'
    )
    
    is_verified = models.BooleanField(
        default=False,
        verbose_name='تایید شده'
    )
    
    email_verified = models.BooleanField(
        default=False,
        verbose_name='ایمیل تایید شده'
    )
    
    phone_verified = models.BooleanField(
        default=False,
        verbose_name='تلفن تایید شده'
    )
    
    failed_login_attempts = models.IntegerField(
        default=0,
        verbose_name='تعداد تلاش ناموفق'
    )
    
    lockout_until = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='قفل شده تا'
    )
    
    last_password_change = models.DateTimeField(
        auto_now_add=True,
        verbose_name='آخرین تغییر رمز'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')
    
    objects = CustomUserManager()

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['national_code']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]
        permissions = [
            ('can_manage_universities', 'می‌تواند همه دانشگاه‌ها را مدیریت کند (سوپروایزر)'),
            ('can_manage_university', 'می‌تواند دانشگاه را مدیریت کند'),
            ('can_manage_courses', 'می‌تواند دروس را مدیریت کند'),
            ('can_manage_teachers', 'می‌تواند اساتید را مدیریت کند'),
            ('can_view_schedule', 'می‌تواند برنامه را مشاهده کند'),
        ]

    def __str__(self):
        return f"{self.get_full_name()} - {self.get_role_display()}"
    
    def clean(self):
        super().clean()
        
        if self.national_code:
            if not re.match(r'^\d{10}$', self.national_code):
                raise ValidationError({'national_code': 'کد ملی باید ۱۰ رقم باشد'})
            
            if not self.validate_national_code(self.national_code):
                raise ValidationError({'national_code': 'کد ملی معتبر نیست'})
        
        if self.phone_number:
            if not re.match(r'^09\d{9}$', self.phone_number):
                raise ValidationError({'phone_number': 'شماره تلفن معتبر نیست (با ۰۹ شروع شود)'})

        if self.role == 'supervisor' and self.university_id:
            raise ValidationError({'university': 'سوپروایزر کل نباید به یک دانشگاه خاص محدود شود.'})

        if self.role != 'supervisor' and not self.university_id:
            raise ValidationError({'university': 'برای این نقش انتخاب دانشگاه الزامی است.'})
    
    @staticmethod
    def validate_national_code(code):
        if len(code) != 10:
            return False
        
        try:
            check = int(code[9])
            s = sum(int(code[i]) * (10 - i) for i in range(9))
            r = s % 11
            return (r < 2 and check == r) or (r >= 2 and check == 11 - r)
        except:
            return False
    
    def is_locked_out(self):
        from django.utils import timezone
        if self.lockout_until:
            return timezone.now() < self.lockout_until
        return False
    
    def reset_failed_logins(self):
        self.failed_login_attempts = 0
        self.lockout_until = None
        self.save(update_fields=['failed_login_attempts', 'lockout_until'])
    
    def increment_failed_login(self):
        from django.utils import timezone
        from datetime import timedelta
        
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= 5:
            self.lockout_until = timezone.now() + timedelta(minutes=15)
        
        self.save(update_fields=['failed_login_attempts', 'lockout_until'])
    
    def get_permissions(self):
        permissions = []

        if self.role == 'supervisor':
            permissions = [
                'can_manage_universities',
                'can_manage_university',
                'can_manage_courses',
                'can_manage_teachers',
                'can_view_schedule',
            ]
        elif self.role == 'admin':
            permissions = [
                'can_manage_university',
                'can_manage_courses', 
                'can_manage_teachers',
                'can_view_schedule',
            ]
        elif self.role == 'education_officer':
            permissions = [
                'can_manage_courses',
                'can_manage_teachers',
                'can_view_schedule',
            ]
        elif self.role == 'teacher':
            permissions = [
                'can_view_schedule',
            ]
        
        return permissions


class UserProfile(models.Model):
    """پروفایل تکمیلی کاربر با امنیت بالا"""
    
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='کاربر'
    )
    
    bio = models.TextField(
        blank=True,
        verbose_name='بیوگرافی',
        max_length=500
    )
    
    address = models.TextField(
        blank=True,
        verbose_name='آدرس',
        max_length=300
    )
    
    birth_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name='تاریخ تولد'
    )
    
    educational_background = models.TextField(
        blank=True,
        verbose_name='سوابق تحصیلی',
        max_length=1000
    )
    
    expertise = models.TextField(
        blank=True,
        verbose_name='تخصص‌ها',
        max_length=500
    )
    
    emergency_contact = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='تماس اضطراری'
    )
    
    emergency_phone = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='تلفن اضطراری'
    )
    
    email_notifications = models.BooleanField(
        default=True,
        verbose_name='اعلان‌های ایمیلی'
    )
    
    sms_notifications = models.BooleanField(
        default=True,
        verbose_name='اعلان‌های پیامکی'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')

    class Meta:
        verbose_name = 'پروفایل کاربر'
        verbose_name_plural = 'پروفایل‌های کاربران'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"پروفایل {self.user.get_full_name()}"
    
    def clean(self):
        super().clean()
        
        if self.emergency_phone:
            if not re.match(r'^09\d{9}$', self.emergency_phone):
                raise ValidationError({'emergency_phone': 'شماره تلفن اضطراری معتبر نیست'})
    
    def get_age(self):
        from datetime import date
        if self.birth_date:
            today = date.today()
            return today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        return None