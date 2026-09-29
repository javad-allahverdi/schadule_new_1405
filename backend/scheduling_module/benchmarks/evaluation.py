# -*- coding: utf-8 -*-
"""COOP0 quality reports and legacy weighted cost for existing consumers."""

import os
import sys


def _load_scheduler_class():
    """ایمپورت کلاس الگوریتم؛ اول به‌صورت پکیج، در غیر این‌صورت با افزودن مسیر."""
    try:
        from scheduling.algorithm.hybrid_bbo_rl import HybridBBO_RL_Scheduler
        return HybridBBO_RL_Scheduler
    except ImportError:
        here = os.path.dirname(os.path.abspath(__file__))
        algorithm_path = os.path.normpath(
            os.path.join(here, '..', '..', 'scheduling', 'algorithm')
        )
        if algorithm_path not in sys.path:
            sys.path.append(algorithm_path)
        from hybrid_bbo_rl import HybridBBO_RL_Scheduler  # noqa: E402
        return HybridBBO_RL_Scheduler


def build_scheduler(config, seed=None):
    """ساخت یک نمونه از الگوریتم فقط برای استفاده از تابع هزینه و لیست جلسات آن."""
    scheduler_cls = _load_scheduler_class()
    return scheduler_cls(config=config, seed=seed)


def entries_to_individual(scheduler, entries):
    """
    تبدیل لیست جلسات (خروجی الگوریتم یا پاسخ مرجع) به «فرد» (individual) با
    همان ترتیب scheduler.sessions، تا بتوان تابع هزینه‌ی رسمی را روی آن اجرا کرد.

    جلسات یک درس با هم قابل جابه‌جایی‌اند، بنابراین صرفاً به ترتیب ورود پر می‌شوند.
    اگر تعداد جلسات یک درس با تعداد موردانتظار نخواند، None برمی‌گردد چون
    محاسبه‌ی هزینه‌ی رسمی دیگر معنا ندارد.
    """
    pool = {}
    for entry in entries:
        pool.setdefault(entry.get('course_code'), []).append(entry)

    individual = []
    for session in scheduler.sessions:
        course_code = scheduler.courses[session['course_idx']].get('code')
        bucket = pool.get(course_code)
        if not bucket:
            return None
        entry = bucket.pop(0)
        individual.append({
            'day': entry.get('day'),
            'slot_id': entry.get('slot_id'),
            'start': entry.get('start'),
            'end': entry.get('end'),
            'place_code': entry.get('place_code'),
            'teacher_code': entry.get('teacher_code'),
        })

    if any(bucket for bucket in pool.values()):
        return None
    return individual


def algorithm_cost(config, entries):
    """هزینه‌ی وزنی قدیمی؛ معیار تصمیم COOP0 نیست (None برای برنامه ناقص)."""
    scheduler = build_scheduler(config)
    individual = entries_to_individual(scheduler, entries)
    if individual is None:
        return None
    return scheduler._fitness(individual)


# --------------------------------------------------------------------------
# تفکیک تخلف‌ها
# --------------------------------------------------------------------------
VIOLATION_LABELS = {
    'weekly_minimum_units': 'کسری حداقل واحد هفتگی استاد (قید سخت)',
    'weekly_maximum_units': 'مازاد حداکثر واحد هفتگی استاد (قید سخت)',
    'domain': 'روز یا بازه نامعتبر',
    'missing_session': 'جلسه مفقود',
    'extra_session': 'جلسه اضافی یا درس ناشناخته',
    'teacher_eligibility': 'استاد نامعتبر یا غیرمجاز برای درس',
    'required_place': 'عدم رعایت مکان الزامی',
    'teacher_conflicts': 'تداخل استاد (یک استاد، دو کلاس هم‌زمان)',
    'place_conflicts': 'تداخل مکان (یک کلاس، دو درس هم‌زمان)',
    'missing_teacher': 'جلسه بدون استاد',
    'missing_place': 'جلسه بدون مکان',
    'teacher_unavailable': 'کلاس در زمان عدم دسترسی استاد',
    'capacity_issues': 'ظرفیت مکان کمتر از تعداد دانشجو',
    'gender_mismatches': 'عدم تطابق جنسیت درس و مکان',
    'wrong_place_type': 'نوع مکان با نیاز درس نمی‌خواند',
    'group_conflicts': 'تداخل دروس الزامی یک گروه دانشجویی',
    'place_unavailable': 'استفاده از مکان در زمان غیرقابل دسترس',
    'same_course_same_slot': 'دو جلسه‌ی یک درس در یک روز و بازه',
    'max_classes_per_day': 'عبور از سقف کلاس روزانه‌ی استاد (قید نرم)',
}


def evaluate_entries(config, entries):
    """Report the same H/S as COOP0, including structurally incomplete schedules."""
    from scheduling.algorithm.objective import TimetableObjective
    details = TimetableObjective(build_scheduler(config)).evaluate_entries(entries)
    names = {
        'teacher_conflict': 'teacher_conflicts', 'place_conflict': 'place_conflicts',
        'capacity': 'capacity_issues', 'gender': 'gender_mismatches',
        'place_type': 'wrong_place_type', 'group_conflict': 'group_conflicts',
        'same_course': 'same_course_same_slot',
    }
    violations = dict.fromkeys(VIOLATION_LABELS, 0)
    for key, count in details['violations'].items():
        violations[names.get(key, key)] += count
    # Preserve the old aggregate for existing consumers; H excludes this soft term.
    violations['max_classes_per_day'] = details['daily_excess']
    return {
        **details, 'violations': violations, 'violation_labels': VIOLATION_LABELS,
        'total_violations': details['hard_violations'] + details['daily_excess'],
    }
