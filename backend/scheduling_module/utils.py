import pandas as pd
import yaml
import json
import os
import sys
import time
import threading
import tempfile
from datetime import datetime, timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db import transaction

from .models import (
    SchedulingTask, ScheduleResult, UniversityConfig, Place, Teacher, Course, Schedule
)
from panel_module.models import SystemLog


class ExcelToYAMLConverter:
    def __init__(self, excel_file):
        self.excel_file = excel_file
        self.config = {
            'settings': {},
            'places': [],
            'teachers': [],
            'courses': [],
            'constraints': []
        }

    def convert(self):
        """تبدیل فایل اکسل به فرمت YAML"""
        try:
            # خواندن فایل اکسل
            xls = pd.ExcelFile(self.excel_file)

            # تبدیل تنظیمات
            self._convert_settings(xls)

            # تبدیل مکان‌ها
            self._convert_places(xls)

            # تبدیل اساتید
            self._convert_teachers(xls)

            # تبدیل دروس
            self._convert_courses(xls)

            # تبدیل محدودیت‌ها
            self._convert_constraints(xls)

            return yaml.dump(self.config, allow_unicode=True, default_flow_style=False, indent=2)

        except Exception as e:
            raise Exception(f"خطا در تبدیل فایل اکسل: {str(e)}")

    def _convert_settings(self, xls):
        """تبدیل تنظیمات"""
        if 'settings' in xls.sheet_names:
            df = pd.read_excel(xls, 'settings')
            if not df.empty:
                self.config['settings'] = {
                    'university_name': df.iloc[0].get('university_name', 'دانشگاه'),
                    'semester': df.iloc[0].get('semester', 'نیمسال اول'),
                    'days_of_week': df.iloc[0].get('days_of_week', 'شنبه,یکشنبه,دوشنبه,سه‌شنبه,چهارشنبه').split(','),
                    'max_units_per_student': int(df.iloc[0].get('max_units_per_student', 20)),
                    'max_classes_per_day': int(df.iloc[0].get('max_classes_per_day', 3))
                }

        # تبدیل زمان‌بندی‌ها
        if 'time_slots' in xls.sheet_names:
            time_slots_df = pd.read_excel(xls, 'time_slots')
            self.config['settings']['time_slots'] = time_slots_df.to_dict('records')
        else:
            # زمان‌بندی پیش‌فرض
            self.config['settings']['time_slots'] = [
                {'id': 1, 'start': '08:00', 'end': '10:00'},
                {'id': 2, 'start': '10:00', 'end': '12:00'},
                {'id': 3, 'start': '13:30', 'end': '15:30'},
                {'id': 4, 'start': '15:30', 'end': '17:30'},
                {'id': 5, 'start': '17:30', 'end': '19:30'},
            ]

    def _convert_places(self, xls):
        """تبدیل مکان‌ها"""
        if 'places' in xls.sheet_names:
            df = pd.read_excel(xls, 'places')
            self.config['places'] = df.to_dict('records')

    def _convert_teachers(self, xls):
        """تبدیل اساتید"""
        if 'teachers' in xls.sheet_names:
            df = pd.read_excel(xls, 'teachers')

            for _, row in df.iterrows():
                teacher_data = {
                    'code': row.get('code', ''),
                    'full_name': row.get('full_name', ''),
                    'gender': int(row.get('gender', 1)),
                    'degree': int(row.get('degree', 3)),
                    'employment_type': int(row.get('employment_type', 1)),
                    'position': int(row.get('position', 3)),
                    'max_units': int(row.get('max_units', 10)),
                    'min_units': int(row.get('min_units', 6)),
                    'unavailable_times': row.get('unavailable_times', [])
                }

                # تبدیل رشته به لیست اگر لازم باشد
                if isinstance(teacher_data['unavailable_times'], str):
                    teacher_data['unavailable_times'] = teacher_data['unavailable_times'].split(',')

                self.config['teachers'].append(teacher_data)

    def _convert_courses(self, xls):
        """تبدیل دروس"""
        if 'courses' in xls.sheet_names:
            df = pd.read_excel(xls, 'courses')

            for _, row in df.iterrows():
                course_data = {
                    'code': row.get('code', ''),
                    'name': row.get('name', ''),
                    'type': row.get('type', 'تئوری'),
                    'unit_type': row.get('unit_type', 'تخصصی'),
                    'units': int(row.get('units', 3)),
                    'priority': int(row.get('priority', 1)),
                    'gender': int(row.get('gender', 0)),
                    'required_place_type': row.get('required_place_type', 'کلاس تئوری'),
                    'expected_students': int(row.get('expected_students', 30)),
                    'teachers': row.get('teachers', '').split(','),
                    'fixed': bool(row.get('fixed', False))
                }

                # پیش‌نیازها و هم‌نیازها
                course_data['prerequisites'] = row.get('prerequisites', '').split(',') if pd.notna(
                    row.get('prerequisites')) else []
                course_data['corequisites'] = row.get('corequisites', '').split(',') if pd.notna(
                    row.get('corequisites')) else []

                # مکان الزامی
                if pd.notna(row.get('required_place')):
                    course_data['required_place'] = row.get('required_place')

                self.config['courses'].append(course_data)

    def _convert_constraints(self, xls):
        """تبدیل محدودیت‌ها"""
        if 'constraints' in xls.sheet_names:
            df = pd.read_excel(xls, 'constraints')
            self.config['constraints'] = df.to_dict('records')


class SchedulingAlgorithmRunner:
    """
    اجرای الگوریتم زمان‌بندی (BBO + گرگ خاکستری) روی داده‌های یک UniversityConfig
    که مستقیماً از پایگاه‌داده خوانده می‌شود (نیازی به آپلود فایل YAML نیست؛
    اگر task.config_file هم موجود باشد اولویت با آن است).
    """

    DAY_NAME_TO_INDEX = {
        'شنبه': 0, 'یکشنبه': 1, 'دوشنبه': 2,
        'سه‌شنبه': 3, 'سه شنبه': 3, 'چهارشنبه': 4, 'پنجشنبه': 5,
    }

    def __init__(self, task_id):
        self.task_id = task_id
        self.task = None

    def run(self):
        """اجرای الگوریتم زمان‌بندی"""
        start_time = time.time()
        try:
            self.task = SchedulingTask.objects.get(id=self.task_id)
            self.task.status = 'processing'
            self.task.save(update_fields=['status'])

            SystemLog.objects.create(
                user=self.task.created_by,
                university=self.task.created_by.university,
                action='schedule',
                description=f'شروع الگوریتم زمان‌بندی برای "{self.task.name}"',
                ip_address='127.0.0.1',
                user_agent='Scheduling Algorithm'
            )

            config = self._load_config()

            algorithm_path = os.path.join(settings.BASE_DIR, 'scheduling', 'algorithm')
            if algorithm_path not in sys.path:
                sys.path.append(algorithm_path)

            try:
                from hybrid_bbo_rl import HybridBBO_RL_Scheduler
            except ImportError as e:
                raise Exception(f"خطا در ایمپورت الگوریتم: {str(e)}")

            scheduler = HybridBBO_RL_Scheduler(config=config)

            if self.task.algorithm_params:
                for key, value in self.task.algorithm_params.items():
                    if hasattr(scheduler, key) and value is not None:
                        setattr(scheduler, key, value)

            best_schedule = scheduler.optimize_with_hybrid_approach()

            execution_time = time.time() - start_time
            self._save_results(best_schedule, execution_time)

            SystemLog.objects.create(
                user=self.task.created_by,
                university=self.task.created_by.university,
                action='schedule',
                description=f'الگوریتم زمان‌بندی "{self.task.name}" با موفقیت تکمیل شد',
                ip_address='127.0.0.1',
                user_agent='Scheduling Algorithm'
            )

        except SchedulingTask.DoesNotExist:
            pass
        except Exception as e:
            self._handle_error(str(e))

    def _load_config(self):
        """اولویت با فایل YAML آپلودشده؛ در غیر این صورت از دیتابیس ساخته می‌شود."""
        if self.task.config_file and self.task.config_file.name:
            config_path = os.path.join(settings.MEDIA_ROOT, self.task.config_file.name)
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f) or {}

        return self._build_config_from_db()

    def _build_config_from_db(self):
        """ساخت پیکربندی الگوریتم مستقیماً از مدل‌های UniversityConfig/Place/Teacher/Course"""
        uc = self.task.university_config

        settings_data = {
            'university_name': uc.name,
            'semester': uc.semester,
            'days_of_week': uc.days_of_week or [
                {'id': 0, 'name': 'شنبه', 'enabled': True},
                {'id': 1, 'name': 'یکشنبه', 'enabled': True},
                {'id': 2, 'name': 'دوشنبه', 'enabled': True},
                {'id': 3, 'name': 'سه‌شنبه', 'enabled': True},
                {'id': 4, 'name': 'چهارشنبه', 'enabled': True},
            ],
            'time_slots': uc.time_slots or [
                {'id': 1, 'start': '08:00', 'end': '10:00', 'enabled': True},
                {'id': 2, 'start': '10:00', 'end': '12:00', 'enabled': True},
                {'id': 3, 'start': '13:30', 'end': '15:30', 'enabled': True},
                {'id': 4, 'start': '15:30', 'end': '17:30', 'enabled': True},
            ],
            'max_units_per_student': uc.max_units_per_student,
            'max_classes_per_day': uc.max_classes_per_day,
        }

        places = [
            {
                'code': p.code, 'name': p.name, 'capacity': p.capacity,
                'place_type': p.place_type, 'gender': p.gender,
            }
            for p in uc.places.filter(available=True)
        ]

        teachers = [
            {
                'code': t.code, 'full_name': t.full_name, 'gender': t.gender,
                'degree': t.degree, 'employment_type': t.employment_type,
                'position': t.position, 'max_units': t.max_units, 'min_units': t.min_units,
                'unavailable_times': t.unavailable_times or [],
            }
            for t in uc.teachers.all()
        ]

        courses = [
            {
                'code': c.code, 'name': c.name, 'type': c.course_type, 'unit_type': c.unit_type,
                'units': c.units, 'priority': c.priority, 'gender': c.gender,
                'required_place_type': c.required_place_type,
                'required_place': c.required_place,
                'expected_students': c.expected_students,
                'teachers': list(c.teachers.values_list('code', flat=True)),
                'fixed': c.fixed,
                'prerequisites': c.prerequisites or [],
                'corequisites': c.corequisites or [],
            }
            for c in uc.courses.all()
        ]

        constraints = [
            {'type': cst.constraint_type, 'parameters': cst.parameters}
            for cst in uc.constraints.filter(is_active=True)
        ]

        student_groups = [
            {
                'name': g.name, 'size': g.size,
                'required_courses': g.required_courses or [],
                'optional_courses': g.optional_courses or [],
            }
            for g in uc.student_groups.all()
        ]

        return {
            'settings': settings_data,
            'places': places,
            'teachers': teachers,
            'courses': courses,
            'constraints': constraints,
            'student_groups': student_groups,
        }

    def _save_results(self, best_schedule, execution_time):
        """ذخیره نتایج الگوریتم: هم به‌صورت JSON خام و هم به‌صورت رکوردهای Schedule واقعی"""
        uc = self.task.university_config

        with transaction.atomic():
            schedule_result, _created = ScheduleResult.objects.update_or_create(
                task=self.task,
                defaults=dict(
                    schedule_data=best_schedule,
                    total_cost=best_schedule.get('cost', 0),
                    teacher_conflicts=self._count_conflicts(best_schedule, 'teacher'),
                    place_conflicts=self._count_conflicts(best_schedule, 'place'),
                    capacity_issues=self._count_capacity_issues(best_schedule),
                    gender_mismatches=self._count_gender_mismatches(best_schedule),
                    total_courses=len(best_schedule.get('courses', [])),
                    approval_status='pending_review',
                    approved_by=None,
                    approved_at=None,
                    rejection_note='',
                )
            )

            # پاک کردن جلسات قبلی مربوط به این نتیجه (در صورت اجرای مجدد) و ساخت جلسات جدید
            Schedule.objects.filter(schedule_result=schedule_result).delete()

            course_by_code = {c.code: c for c in uc.courses.all()}
            teacher_by_code = {t.code: t for t in uc.teachers.all()}
            place_by_code = {p.code: p for p in uc.places.all()}

            new_rows = []
            for entry in best_schedule.get('courses', []):
                course = course_by_code.get(entry.get('course_code'))
                teacher = teacher_by_code.get(entry.get('teacher_code'))
                place = place_by_code.get(entry.get('place_code'))
                if not course or not place:
                    continue

                day_value = entry.get('day')
                day_index = self.DAY_NAME_TO_INDEX.get(day_value, day_value if isinstance(day_value, int) else 0)

                start_str = entry.get('start') or '08:00'
                end_str = entry.get('end') or '10:00'

                new_rows.append(Schedule(
                    university_config=uc,
                    schedule_result=schedule_result,
                    teacher=teacher,
                    course=course,
                    classroom=place,
                    day_of_week=day_index,
                    start_time=start_str,
                    end_time=end_str,
                    time_slot=f"{start_str}-{end_str}",
                    semester=uc.semester,
                    academic_year=str(timezone.now().year),
                ))

            Schedule.objects.bulk_create(new_rows)

            self.task.status = 'completed'
            self.task.completed_at = timezone.now()
            self.task.execution_time = execution_time
            self.task.result = {
                'total_cost': schedule_result.total_cost,
                'teacher_conflicts': schedule_result.teacher_conflicts,
                'place_conflicts': schedule_result.place_conflicts,
                'total_courses': schedule_result.total_courses,
                'execution_time': execution_time,
                'generations_run': best_schedule.get('generations_run'),
            }
            self.task.save()

    def _count_conflicts(self, schedule, conflict_type):
        """شمارش تداخل‌ها"""
        conflicts = 0
        slots = {}

        for course in schedule.get('courses', []):
            key = (course['day'], course['slot_id'])
            entity = course.get('teacher_code') if conflict_type == 'teacher' else course.get('place_code')
            if not entity:
                continue

            if key not in slots:
                slots[key] = set()

            if entity in slots[key]:
                conflicts += 1
            else:
                slots[key].add(entity)

        return conflicts

    def _count_capacity_issues(self, schedule):
        """شمارش کلاس‌هایی که ظرفیت مکان کمتر از تعداد دانشجوی مورد انتظار درس است"""
        if not self.task or not self.task.university_config_id:
            return 0

        uc = self.task.university_config
        course_students = {c.code: c.expected_students for c in uc.courses.all()}
        place_capacity = {p.code: p.capacity for p in uc.places.all()}

        issues = 0
        for entry in schedule.get('courses', []):
            expected = course_students.get(entry.get('course_code'), 0)
            capacity = place_capacity.get(entry.get('place_code'), 0)
            if capacity < expected:
                issues += 1
        return issues

    def _count_gender_mismatches(self, schedule):
        """شمارش عدم تطابق جنسیت بین درس و مکان تخصیص‌یافته"""
        if not self.task or not self.task.university_config_id:
            return 0

        uc = self.task.university_config
        course_gender = {c.code: c.gender for c in uc.courses.all()}
        place_gender = {p.code: p.gender for p in uc.places.all()}

        mismatches = 0
        for entry in schedule.get('courses', []):
            c_gender = course_gender.get(entry.get('course_code'), 0)
            p_gender = place_gender.get(entry.get('place_code'), 0)
            if c_gender and p_gender and c_gender != p_gender:
                mismatches += 1
        return mismatches

    def _handle_error(self, error_message):
        """مدیریت خطاها"""
        if self.task:
            self.task.status = 'failed'
            self.task.result = {'error': error_message}
            self.task.save()

            SystemLog.objects.create(
                user=self.task.created_by,
                university=self.task.created_by.university,
                action='schedule',
                description=f'خطا در الگوریتم زمان‌بندی "{self.task.name}": {error_message}',
                ip_address='127.0.0.1',
                user_agent='Scheduling Algorithm'
            )


def run_scheduling_algorithm(task_id):
    """تابع برای اجرای الگوریتم در thread جداگانه"""
    runner = SchedulingAlgorithmRunner(task_id)
    runner.run()


def export_university_config_to_excel(university_config):
    """
    صدور همه‌ی اطلاعات ورودی یک نیمسال (اساتید، دروس، مکان‌ها، گروه‌های
    دانشجویی) به یک فایل اکسل چندشیت، برای پشتیبان‌گیری یا اشتراک‌گذاری.
    این با ScheduleExporter فرق دارد: آن خروجیِ الگوریتم را صادر می‌کند،
    این تابع داده‌های ورودیِ ثبت‌شده توسط کاربر را صادر می‌کند.
    """
    import io
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill
    from openpyxl.utils import get_column_letter

    uc = university_config
    wb = Workbook()
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")

    def make_sheet(title, headers, rows):
        ws = wb.create_sheet(title)
        ws.sheet_view.rightToLeft = True
        ws.append(headers)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center')
        for row in rows:
            ws.append(row)
        for col_idx in range(1, len(headers) + 1):
            ws.column_dimensions[get_column_letter(col_idx)].width = 20
        return ws

    # حذف شیت پیش‌فرض خالی که openpyxl به‌صورت خودکار می‌سازد
    default_sheet = wb.active

    degree_labels = {1: 'کارشناسی', 2: 'کارشناسی ارشد', 3: 'دکتری'}
    employment_labels = {1: 'تمام وقت', 2: 'نیمه وقت', 3: 'حق‌التدریس'}
    gender_labels = {0: 'مختلط', 1: 'مرد', 2: 'زن'}
    degree_level_labels = {'associate': 'کاردانی', 'bachelor': 'کارشناسی', 'master': 'کارشناسی ارشد', 'phd': 'دکتری'}

    teachers_rows = [
        [
            t.code, t.full_name, gender_labels.get(t.gender, ''), degree_labels.get(t.degree, ''),
            employment_labels.get(t.employment_type, ''), t.min_units, t.max_units,
            'دارد' if t.user_id else 'ندارد',
        ]
        for t in uc.teachers.all()
    ]
    make_sheet('اساتید', ['کد', 'نام کامل', 'جنسیت', 'مدرک', 'نوع استخدام', 'حداقل واحد', 'حداکثر واحد', 'حساب کاربری'], teachers_rows)

    courses_rows = [
        [
            c.code, c.name, c.course_type, c.unit_type, c.units, c.expected_students,
            c.required_place_type, gender_labels.get(c.gender, ''),
            ', '.join(t.full_name for t in c.teachers.all()),
        ]
        for c in uc.courses.all()
    ]
    make_sheet('دروس', ['کد', 'نام', 'نوع درس', 'نوع واحد', 'تعداد واحد', 'ظرفیت دانشجو', 'نوع مکان مورد نیاز', 'جنسیت', 'اساتید مجاز'], courses_rows)

    places_rows = [
        [p.code, p.name, p.place_type, p.capacity, gender_labels.get(p.gender, ''), 'فعال' if p.available else 'غیرفعال']
        for p in uc.places.all()
    ]
    make_sheet('مکان‌ها', ['کد', 'نام', 'نوع مکان', 'ظرفیت', 'جنسیت', 'وضعیت'], places_rows)

    groups_rows = [
        [
            g.name, g.entry_year or '', g.field_of_study, degree_level_labels.get(g.degree_level, ''),
            g.size, len(g.required_courses or []), len(g.optional_courses or []),
        ]
        for g in uc.student_groups.all()
    ]
    make_sheet('گروه‌های دانشجویی', ['نام گروه', 'سال ورود', 'رشته تحصیلی', 'مقطع', 'ظرفیت', 'تعداد دروس الزامی', 'تعداد دروس اختیاری'], groups_rows)

    if default_sheet.title == 'Sheet' and default_sheet in wb.worksheets:
        wb.remove(default_sheet)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


class ScheduleExporter:
    def __init__(self, schedule_result):
        self.schedule_result = schedule_result

    def export_to_text(self):
        """صدور زمان‌بندی به فرمت متنی"""
        schedule_data = self.schedule_result.schedule_data
        output = []

        output.append("زمان‌بندی بهینه کلاس‌ها")
        output.append("=" * 80)
        output.append("")

        # گروه‌بندی بر اساس روز
        days = {}
        for course in schedule_data.get('courses', []):
            day = course.get('day')
            if day not in days:
                days[day] = []
            days[day].append(course)

        for day, courses in days.items():
            output.append(f"روز: {day}")
            output.append("-" * 40)

            # مرتب‌سازی بر اساس زمان
            courses.sort(key=lambda x: x.get('slot_id', 0))

            for course in courses:
                output.append(f"  زمان: {course.get('slot_id')}")
                output.append(f"  درس: {course.get('course_code')}")
                output.append(f"  استاد: {course.get('teacher_code')}")
                output.append(f"  مکان: {course.get('place_code')}")
                output.append("")

        output.append(f"هزینه کل: {self.schedule_result.total_cost}")
        output.append(f"تداخل اساتید: {self.schedule_result.teacher_conflicts}")
        output.append(f"تداخل مکان‌ها: {self.schedule_result.place_conflicts}")

        return "\n".join(output)

    def export_to_excel(self):
        """صدور زمان‌بندی به فرمت اکسل"""
        import io
        from openpyxl import Workbook
        from openpyxl.styles import Font, Alignment, PatternFill
        from openpyxl.utils import get_column_letter

        wb = Workbook()
        ws = wb.active
        ws.sheet_view.rightToLeft = True
        ws.title = "زمان‌بندی"

        headers = ['روز', 'ساعت شروع', 'ساعت پایان', 'درس', 'استاد', 'مکان']
        ws.append(headers)
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        for col_idx, _ in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center')

        entries = list(self.schedule_result.schedule_data.get('courses', []))
        entries.sort(key=lambda x: (str(x.get('day', '')), x.get('slot_id', 0)))

        for entry in entries:
            ws.append([
                entry.get('day'),
                entry.get('start'),
                entry.get('end'),
                f"{entry.get('course_name') or entry.get('course_code')} ({entry.get('course_code')})",
                entry.get('teacher_code'),
                entry.get('place_code'),
            ])

        for col_idx in range(1, len(headers) + 1):
            ws.column_dimensions[get_column_letter(col_idx)].width = 22

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()

    def export_to_json(self):
        """صدور زمان‌بندی به فرمت JSON"""
        return json.dumps(self.schedule_result.schedule_data, ensure_ascii=False, indent=2)

    def export_to_pdf(self):
        """صدور زمان‌بندی به فرمت PDF (با پشتیبانی از متن فارسی راست‌به‌چپ)"""
        import io
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import arabic_reshaper
        from bidi.algorithm import get_display

        def rtl(text):
            if text is None:
                return ''
            text = str(text)
            try:
                reshaped = arabic_reshaper.reshape(text)
                return get_display(reshaped)
            except Exception:
                return text

        # فونت فارسی (Vazirmatn) که همراه پروژه در scheduling_module/fonts/ عرضه می‌شود،
        # مستقل از سیستم‌عامل و بدون نیاز به فونت نصب‌شده روی سرور/کامپیوتر کاربر
        font_name = 'Helvetica'
        font_bold_name = 'Helvetica-Bold'
        fonts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scheduling_module', 'fonts')
        regular_path = os.path.join(fonts_dir, 'Vazirmatn-Regular.ttf')
        bold_path = os.path.join(fonts_dir, 'Vazirmatn-Bold.ttf')

        if os.path.exists(regular_path):
            try:
                pdfmetrics.registerFont(TTFont('Vazirmatn', regular_path))
                font_name = 'Vazirmatn'
                if os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont('Vazirmatn-Bold', bold_path))
                    font_bold_name = 'Vazirmatn-Bold'
                else:
                    font_bold_name = 'Vazirmatn'
            except Exception:
                font_name = 'Helvetica'
                font_bold_name = 'Helvetica-Bold'

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=landscape(A4),
            topMargin=15 * mm, bottomMargin=15 * mm,
            leftMargin=12 * mm, rightMargin=12 * mm,
        )

        title_style = ParagraphStyle(
            'TitleFa', fontName=font_bold_name, fontSize=16, alignment=1, spaceAfter=10
        )

        task = self.schedule_result.task
        elements = [
            Paragraph(rtl(f"برنامه زمان‌بندی: {task.name}"), title_style),
            Paragraph(rtl(f"دانشگاه: {task.university_config.name} | نیمسال: {task.university_config.semester}"),
                      ParagraphStyle('SubFa', fontName=font_name, fontSize=10, alignment=1)),
            Spacer(1, 8),
        ]

        entries = list(self.schedule_result.schedule_data.get('courses', []))
        entries.sort(key=lambda x: (str(x.get('day', '')), x.get('slot_id', 0)))

        header = [rtl(h) for h in ['روز', 'ساعت', 'درس', 'استاد', 'مکان']]
        table_data = [header]
        for e in entries:
            table_data.append([
                rtl(e.get('day')),
                rtl(f"{e.get('start')}-{e.get('end')}"),
                rtl(f"{e.get('course_name') or ''} ({e.get('course_code')})"),
                rtl(e.get('teacher_code')),
                rtl(e.get('place_code')),
            ])

        table = Table(table_data, repeatRows=1, colWidths=[70 * mm, 40 * mm, 90 * mm, 45 * mm, 40 * mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTNAME', (0, 0), (-1, 0), font_bold_name),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)

        elements.append(Spacer(1, 10))
        summary_style = ParagraphStyle('SummaryFa', fontName=font_name, fontSize=9, alignment=1)
        elements.append(Paragraph(
            rtl(f"هزینه کل: {self.schedule_result.total_cost} | "
                f"تداخل اساتید: {self.schedule_result.teacher_conflicts} | "
                f"تداخل مکان‌ها: {self.schedule_result.place_conflicts} | "
                f"وضعیت: {self.schedule_result.get_approval_status_display()}"),
            summary_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()