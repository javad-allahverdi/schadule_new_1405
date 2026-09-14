# -*- coding: utf-8 -*-
"""
ارزیابی یک زمان‌بندی (چه خروجی الگوریتم، چه پاسخ مرجع) با همان قواعدی که تابع
هزینه‌ی الگوریتم استفاده می‌کند — اما به‌صورت «تفکیک‌شده».

چرا جدا از خودِ الگوریتم؟ چون تابع هزینه‌ی الگوریتم فقط یک عدد برمی‌گرداند و
برای گزارشِ مقایسه‌ای لازم است بدانیم آن عدد از کجا آمده است (چند تداخل استاد،
چند مشکل ظرفیت و ...). علاوه بر این، تابع algorithm_cost در همین فایل همان
هزینه‌ی رسمی الگوریتم را هم محاسبه می‌کند تا دو عدد قابل راستی‌آزمایی باشند.
"""

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


def build_scheduler(config):
    """ساخت یک نمونه از الگوریتم فقط برای استفاده از تابع هزینه و لیست جلسات آن."""
    scheduler_cls = _load_scheduler_class()
    return scheduler_cls(config=config)


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
    """هزینه‌ی این زمان‌بندی طبق تابع هزینه‌ی رسمی الگوریتم (None اگر قابل محاسبه نباشد)."""
    scheduler = build_scheduler(config)
    individual = entries_to_individual(scheduler, entries)
    if individual is None:
        return None
    return scheduler._fitness(individual)


# --------------------------------------------------------------------------
# تفکیک تخلف‌ها
# --------------------------------------------------------------------------
VIOLATION_LABELS = {
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
    'max_classes_per_day': 'عبور از سقف کلاس روزانه‌ی استاد',
}


def evaluate_entries(config, entries):
    """
    شمارش تفکیکی تخلف‌ها + وضعیت ترجیح‌های زمانی.

    خروجی: {'violations': {...}, 'total_violations': n,
             'time_preferences': {'satisfied': a, 'total': b}}
    """
    settings = config.get('settings') or {}
    max_classes_per_day = int(settings.get('max_classes_per_day', 3) or 3)

    teacher_by_code = {t['code']: t for t in config.get('teachers') or []}
    place_by_code = {p['code']: p for p in config.get('places') or []}
    course_by_code = {c['code']: c for c in config.get('courses') or []}

    conflict_partners = {}
    for group in config.get('student_groups') or []:
        required = [c for c in (group.get('required_courses') or []) if c]
        for a in required:
            for b in required:
                if a != b:
                    conflict_partners.setdefault(a, set()).add(b)

    place_unavailable = []
    time_preferences = []
    for c in config.get('constraints') or []:
        params = c.get('parameters') or {}
        if c.get('type') == 'place_unavailable':
            place_unavailable.append(
                (params.get('place_code'), params.get('day'), params.get('slot_id'))
            )
        elif c.get('type') == 'time_preference':
            time_preferences.append(
                (params.get('teacher_code'), params.get('day'), params.get('slot_id'))
            )

    v = {key: 0 for key in VIOLATION_LABELS}

    teacher_slot = {}
    place_slot = {}
    course_slot = {}
    teacher_day = {}
    slot_courses = {}
    satisfied_prefs = set()

    for entry in entries:
        day = entry.get('day')
        slot_id = entry.get('slot_id')
        teacher_code = entry.get('teacher_code')
        place_code = entry.get('place_code')
        course_code = entry.get('course_code')
        course = course_by_code.get(course_code, {})

        # --- تداخل دروس الزامی گروه دانشجویی ---
        partners = conflict_partners.get(course_code, set())
        for other in slot_courses.get((day, slot_id), ()):
            if other in partners:
                v['group_conflicts'] += 1
        slot_courses.setdefault((day, slot_id), set()).add(course_code)

        # --- استاد ---
        if not teacher_code:
            v['missing_teacher'] += 1
        else:
            key = (teacher_code, day, slot_id)
            teacher_slot[key] = teacher_slot.get(key, 0) + 1
            if teacher_slot[key] > 1:
                v['teacher_conflicts'] += 1

            teacher = teacher_by_code.get(teacher_code)
            if teacher:
                unavailable = set(map(str, teacher.get('unavailable_times') or []))
                variants = {f"{day}-{slot_id}", f"{day}_{slot_id}", str(day)}
                if unavailable & variants:
                    v['teacher_unavailable'] += 1

            teacher_day[(teacher_code, day)] = teacher_day.get((teacher_code, day), 0) + 1

            for (pref_teacher, pref_day, pref_slot) in time_preferences:
                if (teacher_code == pref_teacher and day == pref_day
                        and (pref_slot is None or slot_id == pref_slot)):
                    satisfied_prefs.add((pref_teacher, pref_day, pref_slot))

        # --- مکان ---
        if not place_code:
            v['missing_place'] += 1
        else:
            key = (place_code, day, slot_id)
            place_slot[key] = place_slot.get(key, 0) + 1
            if place_slot[key] > 1:
                v['place_conflicts'] += 1

            place = place_by_code.get(place_code)
            if place:
                if int(place.get('capacity', 0) or 0) < int(course.get('expected_students', 0) or 0):
                    v['capacity_issues'] += 1

                p_gender = int(place.get('gender', 0) or 0)
                c_gender = int(course.get('gender', 0) or 0)
                if p_gender and c_gender and p_gender != c_gender:
                    v['gender_mismatches'] += 1

                required_place = course.get('required_place')
                required_type = course.get('required_place_type')
                if required_place:
                    if str(place_code) != str(required_place):
                        v['wrong_place_type'] += 1
                elif required_type and place.get('place_type') != required_type:
                    v['wrong_place_type'] += 1

            for (pc, pday, pslot) in place_unavailable:
                if place_code == pc and day == pday and (pslot is None or slot_id == pslot):
                    v['place_unavailable'] += 1

        # --- دو جلسه‌ی یک درس در یک بازه ---
        ck = (course_code, day, slot_id)
        course_slot[ck] = course_slot.get(ck, 0) + 1
        if course_slot[ck] > 1:
            v['same_course_same_slot'] += 1

    for (_teacher, _day), count in teacher_day.items():
        if count > max_classes_per_day:
            v['max_classes_per_day'] += count - max_classes_per_day

    return {
        'violations': v,
        'violation_labels': VIOLATION_LABELS,
        'total_violations': sum(v.values()),
        'time_preferences': {
            'satisfied': len(satisfied_prefs),
            'total': len(time_preferences),
        },
    }
