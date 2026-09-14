# -*- coding: utf-8 -*-
"""
تبدیل یک Seed به «پیکربندی الگوریتم».

خروجی این ماژول باید دقیقاً هم‌شکلِ خروجیِ
scheduling_module.utils.SchedulingAlgorithmRunner._build_config_from_db باشد،
چون همان ساختار به HybridBBO_RL_Scheduler داده می‌شود. اگر این دو از هم فاصله
بگیرند، «پاسخ مرجع» با شرایطی متفاوت از آن‌چه الگوریتم واقعاً می‌بیند ساخته
می‌شود و مقایسه بی‌معنا خواهد شد؛ به همین دلیل این تبدیل در یک جای واحد
متمرکز شده است.
"""


def seed_to_algorithm_config(seed):
    """ساخت دیکشنری پیکربندی الگوریتم از روی داده‌های خام یک seed."""
    s = seed['settings']

    settings_data = {
        'university_name': s['name'],
        'semester': s['semester'],
        'days_of_week': s['days_of_week'],
        'time_slots': s['time_slots'],
        'max_units_per_student': s.get('max_units_per_student', 20),
        'max_classes_per_day': s.get('max_classes_per_day', 3),
    }

    places = [
        {
            'code': p['code'], 'name': p['name'], 'capacity': p['capacity'],
            'place_type': p['place_type'], 'gender': p['gender'],
        }
        for p in seed['places'] if p.get('available', True)
    ]

    teachers = [
        {
            'code': t['code'], 'full_name': t['full_name'], 'gender': t['gender'],
            'degree': t['degree'], 'employment_type': t['employment_type'],
            'position': t['position'], 'max_units': t['max_units'],
            'min_units': t['min_units'],
            'unavailable_times': t.get('unavailable_times') or [],
        }
        for t in seed['teachers']
    ]

    courses = [
        {
            'code': c['code'], 'name': c['name'], 'type': c['course_type'],
            'unit_type': c['unit_type'], 'units': c['units'], 'priority': c['priority'],
            'gender': c['gender'], 'required_place_type': c['required_place_type'],
            'required_place': c.get('required_place'),
            'expected_students': c['expected_students'],
            'teachers': list(c['teachers']),
            'fixed': c.get('fixed', False),
            'prerequisites': c.get('prerequisites') or [],
            'corequisites': c.get('corequisites') or [],
        }
        for c in seed['courses']
    ]

    constraints = [
        {'type': cst['type'], 'parameters': cst['parameters']}
        for cst in seed.get('constraints') or []
    ]

    student_groups = [
        {
            'name': g['name'], 'size': g['size'],
            'required_courses': g.get('required_courses') or [],
            'optional_courses': g.get('optional_courses') or [],
        }
        for g in seed.get('student_groups') or []
    ]

    return {
        'settings': settings_data,
        'places': places,
        'teachers': teachers,
        'courses': courses,
        'constraints': constraints,
        'student_groups': student_groups,
    }
