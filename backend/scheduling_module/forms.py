from django import forms
from .models import SchedulingTask
import pandas as pd
import yaml


class ExcelUploadForm(forms.Form):
    config_name = forms.CharField(
        max_length=255,
        label='نام پیکربندی',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'نامی برای این پیکربندی انتخاب کنید'
        })
    )

    excel_file = forms.FileField(
        label='فایل اکسل',
        help_text='فایل اکسل حاوی اطلاعات زمان‌بندی (فرمت xlsx یا xls)',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': '.xlsx,.xls'
        })
    )

    def clean_excel_file(self):
        excel_file = self.cleaned_data.get('excel_file')
        if excel_file:
            # بررسی پسوند فایل
            if not excel_file.name.endswith(('.xlsx', '.xls')):
                raise forms.ValidationError('فایل باید در فرمت اکسل (xlsx یا xls) باشد.')

            # بررسی سایز فایل (حداکثر 10MB)
            if excel_file.size > 10 * 1024 * 1024:
                raise forms.ValidationError('حجم فایل نباید بیشتر از 10 مگابایت باشد.')

            # بررسی ساختار فایل
            try:
                excel_data = pd.ExcelFile(excel_file)
                required_sheets = ['settings', 'places', 'teachers', 'courses']
                missing_sheets = [sheet for sheet in required_sheets if sheet not in excel_data.sheet_names]

                if missing_sheets:
                    raise forms.ValidationError(
                        f'فایل اکسل باید شامل sheetهای زیر باشد: {", ".join(missing_sheets)}'
                    )

            except Exception as e:
                raise forms.ValidationError(f'خطا در خواندن فایل اکسل: {str(e)}')

        return excel_file


class SchedulingConfigForm(forms.Form):
    name = forms.CharField(
        max_length=255,
        label='نام زمان‌بندی',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    description = forms.CharField(
        label='توضیحات',
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': 'توضیحات اختیاری درباره این زمان‌بندی'
        })
    )

    # پارامترهای الگوریتم
    popsize = forms.IntegerField(
        label='اندازه جمعیت',
        initial=10,
        min_value=5,
        max_value=50,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    maxgen = forms.IntegerField(
        label='تعداد نسل‌ها',
        initial=10,
        min_value=5,
        max_value=100,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    teacher_conflict_cost = forms.IntegerField(
        label='هزینه تداخل استاد',
        initial=500,
        min_value=100,
        max_value=1000,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    place_conflict_cost = forms.IntegerField(
        label='هزینه تداخل مکان',
        initial=500,
        min_value=100,
        max_value=1000,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    capacity_cost = forms.IntegerField(
        label='هزینه ظرفیت',
        initial=30,
        min_value=10,
        max_value=100,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    gender_mismatch_cost = forms.IntegerField(
        label='هزینه عدم تطابق جنسیت',
        initial=80,
        min_value=10,
        max_value=200,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )


class ManualCourseForm(forms.Form):
    code = forms.CharField(
        max_length=20,
        label='کد درس',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    name = forms.CharField(
        max_length=255,
        label='نام درس',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    course_type = forms.ChoiceField(
        choices=[
            ('تئوری', 'تئوری'),
            ('عملی', 'عملی'),
            ('تئوری_عملی', 'تئوری_عملی'),
        ],
        label='نوع درس',
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    units = forms.IntegerField(
        label='تعداد واحد',
        min_value=1,
        max_value=4,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    expected_students = forms.IntegerField(
        label='تعداد دانشجو',
        min_value=1,
        max_value=100,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    required_place_type = forms.ChoiceField(
        choices=[
            ('کلاس تئوری', 'کلاس تئوری'),
            ('آزمایشگاه', 'آزمایشگاه'),
            ('کارگاه', 'کارگاه'),
        ],
        label='نوع مکان مورد نیاز',
        widget=forms.Select(attrs={'class': 'form-control'})
    )


class ManualTeacherForm(forms.Form):
    code = forms.CharField(
        max_length=20,
        label='کد استاد',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    full_name = forms.CharField(
        max_length=255,
        label='نام کامل',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    gender = forms.ChoiceField(
        choices=[
            (1, 'مرد'),
            (2, 'زن'),
        ],
        label='جنسیت',
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    max_units = forms.IntegerField(
        label='حداکثر واحد',
        min_value=1,
        max_value=20,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    min_units = forms.IntegerField(
        label='حداقل واحد',
        min_value=1,
        max_value=10,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )


class ScheduleFilterForm(forms.Form):
    STATUS_CHOICES = [
        ('', 'همه'),
        ('pending', 'در انتظار'),
        ('processing', 'در حال پردازش'),
        ('completed', 'تکمیل شده'),
        ('failed', 'ناموفق'),
    ]

    status = forms.ChoiceField(
        choices=STATUS_CHOICES,
        required=False,
        label='وضعیت',
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    date_from = forms.DateField(
        required=False,
        label='از تاریخ',
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'placeholder': 'از تاریخ'
        })
    )

    date_to = forms.DateField(
        required=False,
        label='تا تاریخ',
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date',
            'placeholder': 'تا تاریخ'
        })
    )

    search = forms.CharField(
        required=False,
        label='جستجو',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'جستجو در نام زمان‌بندی...'
        })
    )