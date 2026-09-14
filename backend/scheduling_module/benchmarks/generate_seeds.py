# -*- coding: utf-8 -*-
"""
تولید فایل‌های JSON مجموعه‌های آزمون به‌همراه پاسخ مرجع.

اجرا (از پوشه‌ی backend):
    python -m scheduling_module.benchmarks.generate_seeds

این اسکریپت برای هر seed:
    ۱) با جست‌وجوی کامل (solver.TargetSolver) یک زمان‌بندی بدون هیچ تخلفی می‌سازد
    ۲) آن را با ارزیاب تفکیکی بررسی می‌کند (باید صفر تخلف داشته باشد)
    ۳) هزینه‌ی آن را با تابع هزینه‌ی رسمیِ خودِ الگوریتم می‌سنجد (باید صفر باشد)
    ۴) در صورت موفقیت، فایل seeds/<key>.json را می‌نویسد

اگر هر یک از این بررسی‌ها شکست بخورد، فایل نوشته نمی‌شود و اسکریپت با خطا
خارج می‌شود؛ یعنی هیچ «پاسخ مرجعِ اعتبارسنجی‌نشده‌ای» وارد مخزن نمی‌شود.
"""

import json
import os
import sys

if __package__ in (None, ''):  # اجرای مستقیم فایل
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from scheduling_module.benchmarks import SEEDS_DIR
    from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
    from scheduling_module.benchmarks.definitions import ALL_SEEDS
    from scheduling_module.benchmarks.evaluation import algorithm_cost, evaluate_entries
    from scheduling_module.benchmarks.solver import TargetSolver
else:
    from . import SEEDS_DIR
    from .config_builder import seed_to_algorithm_config
    from .definitions import ALL_SEEDS
    from .evaluation import algorithm_cost, evaluate_entries
    from .solver import TargetSolver


def build_stats(seed, entries):
    settings = seed['settings']
    days = [d for d in settings['days_of_week'] if d.get('enabled', True)]
    slots = [s for s in settings['time_slots'] if s.get('enabled', True)]
    total_units = sum(c['units'] for c in seed['courses'])
    return {
        'teachers': len(seed['teachers']),
        'places': len(seed['places']),
        'courses': len(seed['courses']),
        'student_groups': len(seed['student_groups']),
        'constraints': len(seed.get('constraints') or []),
        'total_units': total_units,
        'sessions': len(entries),
        'days': len(days),
        'slots_per_day': len(slots),
        'timetable_cells': len(days) * len(slots),
        'capacity_cells': len(days) * len(slots) * len(seed['places']),
        'load_factor': round(
            len(entries) / max(1, len(days) * len(slots) * len(seed['places'])), 3
        ),
    }


def generate(seed, verbose=True):
    key = seed['key']
    if verbose:
        print(f"\n=== {key} — {seed['title']} ===")

    solver = TargetSolver(seed)
    if verbose:
        print(f"    جلسات: {len(solver.sessions)} | "
              f"روزها: {len(solver.days)} | بازه‌ها: {len(solver.slots)}")

    assignment = solver.solve()
    if assignment is None:
        raise RuntimeError(f"برای {key} هیچ پاسخ بدون تخلفی پیدا نشد")

    entries = solver.to_entries(assignment)
    config = seed_to_algorithm_config(seed)

    report = evaluate_entries(config, entries)
    if report['total_violations'] != 0:
        broken = {k: n for k, n in report['violations'].items() if n}
        raise RuntimeError(f"پاسخ مرجع {key} تخلف دارد: {broken}")

    cost = algorithm_cost(config, entries)
    if cost is None:
        raise RuntimeError(f"هزینه‌ی پاسخ مرجع {key} قابل محاسبه نبود (عدم تطابق جلسات)")
    if cost > 0:
        raise RuntimeError(f"هزینه‌ی پاسخ مرجع {key} صفر نیست: {cost}")

    prefs = report['time_preferences']
    if prefs['total'] and prefs['satisfied'] < prefs['total']:
        raise RuntimeError(
            f"پاسخ مرجع {key} همه‌ی ترجیح‌های زمانی را رعایت نکرده است "
            f"({prefs['satisfied']} از {prefs['total']})"
        )

    output = dict(seed)
    output['stats'] = build_stats(seed, entries)
    output['target'] = {
        'cost': cost,
        'entries': entries,
        'satisfied_time_preferences': prefs['satisfied'],
        'total_time_preferences': prefs['total'],
        'generated_by': 'scheduling_module.benchmarks.solver.TargetSolver (backtracking)',
        'validated_with': 'HybridBBO_RL_Scheduler._fitness',
    }

    if verbose:
        print(f"    ✓ پاسخ مرجع ساخته شد — هزینه: {cost} | تخلف: ۰ | "
              f"ترجیح‌های رعایت‌شده: {prefs['satisfied']}/{prefs['total']}")
    return output


def main():
    os.makedirs(SEEDS_DIR, exist_ok=True)
    written = []
    for seed in ALL_SEEDS:
        output = generate(seed)
        path = os.path.join(SEEDS_DIR, f"{seed['key']}.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        written.append(path)

    print(f"\n{len(written)} فایل seed نوشته شد در: {SEEDS_DIR}")
    for p in written:
        print(f"  - {os.path.basename(p)}")


if __name__ == '__main__':
    main()
