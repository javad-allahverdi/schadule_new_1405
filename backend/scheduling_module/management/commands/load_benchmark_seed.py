# -*- coding: utf-8 -*-
"""
بارگذاری مجموعه‌های داده‌ی آزمون از خط فرمان — برای آماده‌سازی سریع محیط ارائه.

نمونه‌ها:
    python manage.py load_benchmark_seed --list
    python manage.py load_benchmark_seed seed_02_computer_engineering --user admin
    python manage.py load_benchmark_seed --all --user admin
"""

from django.core.management.base import BaseCommand, CommandError

from account_module.models import CustomUser
from scheduling_module.benchmarks import load_all_seeds, get_seed
from scheduling_module.benchmarks.db_loader import SeedLoadError, load_seed_into_db


class Command(BaseCommand):
    help = 'بارگذاری یک (یا همه‌ی) مجموعه‌های داده‌ی آزمون به‌صورت یک نیمسال جدید'

    def add_arguments(self, parser):
        parser.add_argument('seed_key', nargs='?', help='کلید مجموعه‌ی آزمون')
        parser.add_argument('--user', help='نام کاربری ایجادکننده (created_by)')
        parser.add_argument('--all', action='store_true', help='بارگذاری همه‌ی مجموعه‌ها')
        parser.add_argument('--list', action='store_true', help='فقط نمایش فهرست مجموعه‌ها')

    def handle(self, *args, **options):
        seeds = load_all_seeds()

        if options['list']:
            for seed in seeds:
                stats = seed.get('stats', {})
                self.stdout.write(
                    f"{seed['key']:34} {seed['difficulty_label']:12} "
                    f"استاد {stats.get('teachers', 0):>3} | درس {stats.get('courses', 0):>3} | "
                    f"جلسه {stats.get('sessions', 0):>3}  — {seed['title']}"
                )
            return

        if not options['user']:
            raise CommandError('پارامتر --user الزامی است (نام کاربری ایجادکننده)')

        try:
            user = CustomUser.objects.get(username=options['user'])
        except CustomUser.DoesNotExist:
            raise CommandError(f"کاربر «{options['user']}» یافت نشد")

        if options['all']:
            targets = seeds
        else:
            if not options['seed_key']:
                raise CommandError('یا کلید یک مجموعه را بدهید یا از --all استفاده کنید')
            seed = get_seed(options['seed_key'])
            if not seed:
                raise CommandError(f"مجموعه‌ی «{options['seed_key']}» یافت نشد")
            targets = [seed]

        for seed in targets:
            try:
                config, counts = load_seed_into_db(seed['key'], user=user)
            except SeedLoadError as exc:
                raise CommandError(str(exc))
            self.stdout.write(self.style.SUCCESS(
                f"✓ {seed['key']} → نیمسال «{config.name}» (شناسه {config.id}) — "
                f"اساتید {counts['teachers']}، دروس {counts['courses']}، "
                f"مکان‌ها {counts['places']}، گروه‌ها {counts['student_groups']}، "
                f"محدودیت‌ها {counts['constraints']}"
            ))
