# from django import forms
# from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
# from .models import Customuser, UserProfile

# class CustomUserCreationForm(UserCreationForm):
#     class Meta:
#         model = Customuser
#         fields = ('username', 'email', 'first_name', 'last_name', 'role',
#                  'national_code', 'phone_number', 'gender', 'department')
#         labels = {
#             'username': 'نام کاربری',
#             'email': 'ایمیل',
#             'first_name': 'نام',
#             'last_name': 'نام خانوادگی',
#             'role': 'نقش',
#             'national_code': 'کد ملی',
#             'phone_number': 'شماره تلفن',
#             'gender': 'جنسیت',
#             'department': 'دانشکده',
#         }

# class CustomAuthenticationForm(AuthenticationForm):
#     username = forms.CharField(
#         label='نام کاربری یا ایمیل',
#         widget=forms.TextInput(attrs={'class': 'form-control'})
#     )
#     password = forms.CharField(
#         label='رمز عبور',
#         widget=forms.PasswordInput(attrs={'class': 'form-control'})
#     )

# class UserProfileForm(forms.ModelForm):
#     class Meta:
#         model = UserProfile
#         fields = ('bio', 'address', 'birth_date', 'educational_background', 'expertise')
#         labels = {
#             'bio': 'بیوگرافی',
#             'address': 'آدرس',
#             'birth_date': 'تاریخ تولد',
#             'educational_background': 'سوابق تحصیلی',
#             'expertise': 'تخصص‌ها',
#         }
#         widgets = {
#             'birth_date': forms.DateInput(attrs={'type': 'date'}),
#         }

















from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import CustomUser, UserProfile
import re


class CustomUserCreationForm(UserCreationForm):
    """فرم ایجاد کاربر با اعتبارسنجی امنیتی"""
    
    password1 = forms.CharField(
        label='رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور قوی وارد کنید',
            'autocomplete': 'new-password'
        }),
        help_text='رمز عبور باید حداقل ۸ کاراکتر داشته و شامل حروف و اعداد باشد.'
    )
    
    password2 = forms.CharField(
        label='تکرار رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور را تکرار کنید',
            'autocomplete': 'new-password'
        })
    )
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'role',
                 'national_code', 'phone_number', 'gender', 'department')
        
        labels = {
            'username': 'نام کاربری',
            'email': 'ایمیل',
            'first_name': 'نام',
            'last_name': 'نام خانوادگی',
            'role': 'نقش',
            'national_code': 'کد ملی',
            'phone_number': 'شماره تلفن',
            'gender': 'جنسیت',
            'department': 'دانشکده',
        }
        
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام کاربری منحصر به فرد',
                'autocomplete': 'username'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'example@domain.com',
                'autocomplete': 'email'
            }),
            'first_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام',
                'autocomplete': 'given-name'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام خانوادگی',
                'autocomplete': 'family-name'
            }),
            'role': forms.Select(attrs={
                'class': 'form-control',
            }),
            'national_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '۰۹۱۲۳۴۵۶۷۸',
                'maxlength': '10'
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '۰۹۱۲۳۴۵۶۷۸۹',
                'maxlength': '11'
            }),
            'gender': forms.Select(attrs={
                'class': 'form-control',
            }),
            'department': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'دانشکده مهندسی',
            }),
        }
    
    def clean_password1(self):
        """اعتبارسنجی قوی رمز عبور"""
        password1 = self.cleaned_data.get('password1')
        
        # اعتبارسنجی Django
        try:
            validate_password(password1, self.instance)
        except ValidationError as e:
            raise forms.ValidationError(e.messages)
        
        # اعتبارسنجی سفارشی
        if len(password1) < 8:
            raise forms.ValidationError('رمز عبور باید حداقل ۸ کاراکتر باشد.')
        
        if not re.search(r'[A-Za-z]', password1):
            raise forms.ValidationError('رمز عبور باید شامل حروف باشد.')
        
        if not re.search(r'\d', password1):
            raise forms.ValidationError('رمز عبور باید شامل اعداد باشد.')
        
        return password1
    
    def clean_email(self):
        """اعتبارسنجی یکتایی ایمیل"""
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError('این ایمیل قبلاً ثبت شده است.')
        return email
    
    def clean_national_code(self):
        """اعتبارسنجی کد ملی"""
        national_code = self.cleaned_data.get('national_code')
        if national_code:
            if CustomUser.objects.filter(national_code=national_code).exists():
                raise forms.ValidationError('این کد ملی قبلاً ثبت شده است.')
            
            if not re.match(r'^\d{10}$', national_code):
                raise forms.ValidationError('کد ملی باید ۱۰ رقم باشد.')
            
            # الگوریتم اعتبارسنجی کد ملی
            if not CustomUser.validate_national_code(national_code):
                raise forms.ValidationError('کد ملی معتبر نیست.')
        
        return national_code
    
    def clean_phone_number(self):
        """اعتبارسنجی شماره تلفن"""
        phone_number = self.cleaned_data.get('phone_number')
        if phone_number:
            if CustomUser.objects.filter(phone_number=phone_number).exists():
                raise forms.ValidationError('این شماره تلفن قبلاً ثبت شده است.')
            
            if not re.match(r'^09\d{9}$', phone_number):
                raise forms.ValidationError('شماره تلفن معتبر نیست (با ۰۹ شروع شود).')
        
        return phone_number


class CustomAuthenticationForm(AuthenticationForm):
    """فرم احراز هویت با امنیت بالا"""
    
    username = forms.CharField(
        label='نام کاربری یا ایمیل',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نام کاربری یا ایمیل',
            'autocomplete': 'username'
        })
    )
    
    password = forms.CharField(
        label='رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور',
            'autocomplete': 'current-password'
        })
    )
    
    def clean(self):
        """اعتبارسنجی با چک قفل شدن کاربر"""
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')
        
        if username and password:
            # پیدا کردن کاربر
            try:
                user = CustomUser.objects.get(
                    models.Q(username=username) | 
                    models.Q(email=username)
                )
                
                # بررسی قفل بودن کاربر
                if user.is_locked_out():
                    raise forms.ValidationError(
                        'حساب شما به دلیل تلاش‌های ناموفق قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.'
                    )
                
            except CustomUser.DoesNotExist:
                # کاربر وجود ندارد
                pass
        
        return super().clean()


class UserProfileForm(forms.ModelForm):
    """فرم پروفایل کاربر"""
    
    class Meta:
        model = UserProfile
        fields = ('bio', 'address', 'birth_date', 'educational_background', 
                 'expertise', 'emergency_contact', 'emergency_phone',
                 'email_notifications', 'sms_notifications')
        
        labels = {
            'bio': 'بیوگرافی',
            'address': 'آدرس',
            'birth_date': 'تاریخ تولد',
            'educational_background': 'سوابق تحصیلی',
            'expertise': 'تخصص‌ها',
            'emergency_contact': 'تماس اضطراری',
            'emergency_phone': 'تلفن اضطراری',
            'email_notifications': 'اعلان‌های ایمیلی',
            'sms_notifications': 'اعلان‌های پیامکی',
        }
        
        widgets = {
            'bio': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'درباره خودتان بنویسید...',
                'maxlength': '500'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'آدرس کامل',
                'maxlength': '300'
            }),
            'birth_date': forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-control'
            }),
            'educational_background': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'سوابق تحصیلی خود را وارد کنید...',
                'maxlength': '1000'
            }),
            'expertise': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'تخصص‌های خود را وارد کنید...',
                'maxlength': '500'
            }),
            'emergency_contact': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام و نام خانوادگی',
                'maxlength': '100'
            }),
            'emergency_phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '۰۹۱۲۳۴۵۶۷۸۹',
                'maxlength': '11'
            }),
            'email_notifications': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'sms_notifications': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
    
    def clean_emergency_phone(self):
        """اعتبارسنجی تلفن اضطراری"""
        emergency_phone = self.cleaned_data.get('emergency_phone')
        if emergency_phone and not re.match(r'^09\d{9}$', emergency_phone):
            raise forms.ValidationError('شماره تلفن اضطراری معتبر نیست (با ۰۹ شروع شود).')
        return emergency_phone


class PasswordChangeForm(forms.Form):
    """فرم تغییر رمز عبور با امنیت بالا"""
    
    current_password = forms.CharField(
        label='رمز عبور فعلی',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور فعلی',
            'autocomplete': 'current-password'
        })
    )
    
    new_password1 = forms.CharField(
        label='رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور جدید',
            'autocomplete': 'new-password'
        }),
        help_text='رمز عبور باید حداقل ۸ کاراکتر داشته و شامل حروف و اعداد باشد.'
    )
    
    new_password2 = forms.CharField(
        label='تکرار رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'تکرار رمز عبور جدید',
            'autocomplete': 'new-password'
        })
    )
    
    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
    
    def clean_current_password(self):
        """بررسی صحت رمز عبور فعلی"""
        current_password = self.cleaned_data.get('current_password')
        if not self.user.check_password(current_password):
            raise forms.ValidationError('رمز عبور فعلی نادرست است.')
        return current_password
    
    def clean_new_password1(self):
        """اعتبارسنجی رمز عبور جدید"""
        new_password1 = self.cleaned_data.get('new_password1')
        
        try:
            validate_password(new_password1, self.user)
        except ValidationError as e:
            raise forms.ValidationError(e.messages)
        
        # عدم استفاده مجدد از رمز عبور قبلی
        if self.user.check_password(new_password1):
            raise forms.ValidationError('رمز عبور جدید نباید مشابه رمز عبور قبلی باشد.')
        
        return new_password1
    
    def clean(self):
        """بررسی تطابق رمزهای عبور جدید"""
        cleaned_data = super().clean()
        new_password1 = cleaned_data.get('new_password1')
        new_password2 = cleaned_data.get('new_password2')
        
        if new_password1 and new_password2 and new_password1 != new_password2:
            raise forms.ValidationError('رمزهای عبور جدید با هم مطابقت ندارند.')
        
        return cleaned_data