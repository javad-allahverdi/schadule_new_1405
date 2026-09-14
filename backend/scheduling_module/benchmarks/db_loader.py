# -*- coding: utf-8 -*-
"""
بارگذاری یک مجموعه‌ی داده‌ی آزمون (seed) در پایگاه‌داده.

نتیجه‌ی بارگذاری یک UniversityConfig (نیمسال) کاملاً معمولی است؛ یعنی بعد از
بارگذاری، همه‌ی صفحه‌های موجود برنامه (اساتید، دروس، مکان‌ها، گروه‌ها، زمان‌بندی)
دقیقاً مثل داده‌ی دستی با آن کار می‌کنند. تنها تفاوت، پر بودن فیلد benchmark_key
است که به سیستم می‌گوید برای این نیمسال «پاسخ مرجع» وجود دارد و خروجی الگوریتم
قابل مقایسه با آن است.
"""

from django.db import transaction

from ..models import (
    Course, Place, ScheduleConstraint, StudentGroup, Teacher, UniversityConfig,
)
from . import get_seed


class SeedLoadError(Exception):
    """خطای بارگذاری داده‌ی آزمون"""


def _unique_config_name(base_name, university_id):
    """
    نام یکتا برای نیمسال جدید. اگر کاربر یک seed را چند بار بارگذاری کند،
    نیمسال‌ها با پسوند عددی از هم تفکیک می‌شوند تا با هم اشتباه نشوند.
    """
    qs = UniversityConfig.objects.filter(university_id=university_id)
    if not qs.filter(name=base_name).exists():
        return base_name
    counter = 2
    while qs.filter(name=f"{base_name} ({counter})").exists():
        counter += 1
    return f"{base_name} ({counter})"


@transaction.atomic
def load_seed_into_db(seed_key, user, university=None, config_name=None):
    """
    ساخت یک نیمسال کامل از روی seed.

    seed_key   : کلید مجموعه (مثلاً 'seed_02_computer_engineering')
    user       : کاربر ایجادکننده (created_by)
    university : دانشگاه (مستأجر)؛ پیش‌فرض دانشگاه خود کاربر
    config_name: نام دلخواه برای نیمسال؛ پیش‌فرض نام تعریف‌شده در seed

    خروجی: (university_config, counts)
    """
    seed = get_seed(seed_key)
    if not seed:
        raise SeedLoadError(f'مجموعه‌ی داده‌ی آزمون «{seed_key}» یافت نشد')

    university = university or getattr(user, 'university', None)
    if university is None:
        raise SeedLoadError(
            'برای بارگذاری داده‌ی آزمون باید کاربر به یک دانشگاه متصل باشد'
        )

    settings = seed['settings']
    name = _unique_config_name(config_name or settings['name'], university.id)

    config = UniversityConfig.objects.create(
        university=university,
        name=name,
        semester=settings['semester'],
        days_of_week=settings['days_of_week'],
        time_slots=settings['time_slots'],
        max_units_per_student=settings.get('max_units_per_student', 20),
        max_classes_per_day=settings.get('max_classes_per_day', 3),
        benchmark_key=seed['key'],
        created_by=user,
    )

    for p in seed['places']:
        Place.objects.create(
            code=p['code'], name=p['name'], capacity=p['capacity'],
            place_type=p['place_type'], gender=p['gender'],
            facilities=p.get('facilities') or [], available=p.get('available', True),
            university_config=config,
        )

    teacher_by_code = {}
    for t in seed['teachers']:
        teacher = Teacher.objects.create(
            code=t['code'], full_name=t['full_name'], gender=t['gender'],
            degree=t['degree'], employment_type=t['employment_type'],
            position=t['position'], max_units=t['max_units'], min_units=t['min_units'],
            unavailable_times=t.get('unavailable_times') or [],
            university_config=config,
        )
        teacher_by_code[t['code']] = teacher

    for c in seed['courses']:
        course = Course.objects.create(
            code=c['code'], name=c['name'], course_type=c['course_type'],
            unit_type=c['unit_type'], units=c['units'], priority=c['priority'],
            gender=c['gender'], required_place_type=c['required_place_type'],
            required_place=c.get('required_place'),
            prerequisites=c.get('prerequisites') or [],
            corequisites=c.get('corequisites') or [],
            expected_students=c['expected_students'], fixed=c.get('fixed', False),
            university_config=config,
        )
        for code in c.get('teachers') or []:
            teacher = teacher_by_code.get(code)
            if teacher:
                course.teachers.add(teacher)

    for g in seed.get('student_groups') or []:
        StudentGroup.objects.create(
            name=g['name'], size=g['size'], entry_year=g.get('entry_year'),
            field_of_study=g.get('field_of_study', ''),
            degree_level=g.get('degree_level', 'bachelor'),
            gender=g.get('gender', 0),
            required_courses=g.get('required_courses') or [],
            optional_courses=g.get('optional_courses') or [],
            university_config=config,
        )

    for cst in seed.get('constraints') or []:
        ScheduleConstraint.objects.create(
            university_config=config,
            constraint_type=cst['type'],
            parameters=cst['parameters'],
            description=cst.get('description', ''),
            is_active=True,
        )

    counts = {
        'places': config.places.count(),
        'teachers': config.teachers.count(),
        'courses': config.courses.count(),
        'student_groups': config.student_groups.count(),
        'constraints': config.constraints.count(),
    }
    return config, counts
