# -*- coding: utf-8 -*-
"""
مجموعه‌های داده‌ی آزمون (Benchmark Seeds) و پاسخ‌های مرجع (Ground Truth).

کاربرد: برای ارائه و ارزیابی الگوریتم زمان‌بندی، به‌جای ورود دستیِ داده،
یکی از پنج مجموعه‌ی آماده در این پوشه در برنامه بارگذاری می‌شود؛ سپس الگوریتم
روی همان داده اجرا و خروجی آن با پاسخ مرجعِ همان مجموعه مقایسه می‌شود.

هر فایل JSON در seeds/ شامل:
    - داده‌های ورودی (اساتید، دروس، مکان‌ها، گروه‌ها، محدودیت‌ها)
    - target: یک زمان‌بندی کاملاً بدون تخلف که با جست‌وجوی کامل ساخته و با
      تابع هزینه‌ی خودِ الگوریتم اعتبارسنجی شده است (هزینه = صفر)

این ماژول عمداً به Django وابسته نیست تا در تست و اسکریپت هم قابل استفاده باشد؛
بارگذاری در پایگاه‌داده در db_loader.py انجام می‌شود.
"""

import json
import os

SEEDS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seeds')

_CACHE = {}


def _seed_files():
    if not os.path.isdir(SEEDS_DIR):
        return []
    return sorted(f for f in os.listdir(SEEDS_DIR) if f.endswith('.json'))


def load_all_seeds(refresh=False):
    """خواندن همه‌ی seedها از دیسک (با کش، چون فایل‌ها ثابت‌اند)."""
    if _CACHE and not refresh:
        return list(_CACHE.values())

    _CACHE.clear()
    for filename in _seed_files():
        path = os.path.join(SEEDS_DIR, filename)
        with open(path, 'r', encoding='utf-8') as f:
            seed = json.load(f)
        _CACHE[seed['key']] = seed
    return list(_CACHE.values())


def get_seed(key):
    """دریافت یک seed با کلید آن؛ None اگر وجود نداشته باشد."""
    load_all_seeds()
    return _CACHE.get(key)


def seed_summary(seed):
    """خلاصه‌ی سبک یک seed برای نمایش در فهرست (بدون داده‌های حجیم)."""
    return {
        'key': seed['key'],
        'title': seed['title'],
        'description': seed['description'],
        'difficulty': seed['difficulty'],
        'difficulty_label': seed['difficulty_label'],
        'semester': seed['settings']['semester'],
        'config_name': seed['settings']['name'],
        'stats': seed.get('stats', {}),
    }


__all__ = ['load_all_seeds', 'get_seed', 'seed_summary', 'SEEDS_DIR']
