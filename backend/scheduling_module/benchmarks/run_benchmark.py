# -*- coding: utf-8 -*-
"""
اجرای الگوریتم روی مجموعه‌های آزمون و گزارش مقایسه با پاسخ مرجع — بدون Django.

اجرا (از پوشه‌ی backend):
    python -m scheduling_module.benchmarks.run_benchmark
    python -m scheduling_module.benchmarks.run_benchmark seed_03_lab_constrained --popsize 60 --maxgen 200

این ابزار برای تنظیم ابرپارامترها و گرفتن عدد برای ارائه/گزارش مفید است؛
مسیر رابط کاربری (بارگذاری seed → اجرا → مقایسه) جداگانه و از طریق API است.
"""

import argparse
import os
import statistics
import sys
import time

if __package__ in (None, ''):
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from scheduling_module.benchmarks import get_seed, load_all_seeds
    from scheduling_module.benchmarks.comparison import compare_with_target
    from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
    from scheduling_module.benchmarks.evaluation import build_scheduler
else:
    from . import get_seed, load_all_seeds
    from .comparison import compare_with_target
    from .config_builder import seed_to_algorithm_config
    from .evaluation import build_scheduler


def run_once(seed, popsize, maxgen, rng_seed=None):
    """یک بار اجرای الگوریتم روی seed و برگرداندن (نتیجه، زمان اجرا)."""
    config = seed_to_algorithm_config(seed)
    scheduler = build_scheduler(config, seed=rng_seed)
    scheduler.popsize = popsize
    scheduler.maxgen = maxgen

    started = time.time()
    result = scheduler.optimize_with_hybrid_approach()
    return result, time.time() - started


def report(seed, popsize, maxgen, repeats):
    print(f"\n{'=' * 78}")
    print(f"{seed['title']}  [{seed['key']}]  — سطح: {seed['difficulty_label']}")
    stats = seed['stats']
    print(f"اساتید {stats['teachers']} | مکان {stats['places']} | درس {stats['courses']} | "
          f"گروه {stats['student_groups']} | جلسه {stats['sessions']} | "
          f"خانه‌های جدول {stats['timetable_cells']}")
    print(f"پارامترها: popsize={popsize}  maxgen={maxgen}  تکرار={repeats}")
    print('-' * 78)

    costs, times, exacts, violations = [], [], [], []
    for i in range(repeats):
        result, elapsed = run_once(seed, popsize, maxgen, rng_seed=1000 + i)
        cmp_result = compare_with_target(seed, result['courses'])
        costs.append(result['cost'])
        times.append(elapsed)
        exacts.append(cmp_result['agreement']['exact']['percent'])
        violations.append(result['hard_violations'])

        print(f"  اجرا {i + 1}: COOP0 H={result['hard_violations']} S={result['soft_penalty']} | "
              f"انطباق با مرجع={exacts[-1]:>5.1f}٪ | ارزیابی={result['evaluations']:>4} | بذر={result['seed']} | "
              f"{elapsed:.2f} ثانیه | {cmp_result['verdict']['label']}")

    print('-' * 78)
    print(f"  میانگین هزینه وزنی قدیمی: {statistics.mean(costs):.1f}   "
          f"بهترین: {min(costs):.1f}   بدترین: {max(costs):.1f}")
    print(f"  میانگین تخلف: {statistics.mean(violations):.1f}   "
          f"میانگین انطباق با مرجع: {statistics.mean(exacts):.1f}٪   "
          f"میانگین زمان: {statistics.mean(times):.2f} ثانیه")
    print(f"  هزینه‌ی پاسخ مرجع: {seed['target']['cost']} (صفر تخلف)")


def main():
    parser = argparse.ArgumentParser(description='اجرای الگوریتم روی مجموعه‌های آزمون')
    parser.add_argument('seed_key', nargs='?', help='کلید seed؛ خالی یعنی همه')
    parser.add_argument('--popsize', type=int, default=40)
    parser.add_argument('--maxgen', type=int, default=80)
    parser.add_argument('--repeats', type=int, default=3)
    args = parser.parse_args()

    seeds = [get_seed(args.seed_key)] if args.seed_key else load_all_seeds()
    if not seeds or seeds[0] is None:
        print(f"seed پیدا نشد: {args.seed_key}")
        return 1

    for seed in seeds:
        report(seed, args.popsize, args.maxgen, args.repeats)
    return 0


if __name__ == '__main__':
    sys.exit(main())
