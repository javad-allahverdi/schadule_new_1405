import json

from django.test import TestCase

from scheduling_module.benchmarks import get_seed, load_all_seeds
from scheduling_module.benchmarks.comparison import compare_with_target
from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
from scheduling_module.benchmarks.evaluation import algorithm_cost, evaluate_entries


class BenchmarkSeedIntegrityTests(TestCase):
    """
    این تست‌ها تضمین می‌کنند «پاسخ مرجع» هر مجموعه واقعاً معتبر است.

    اگر روزی تابع هزینه‌ی الگوریتم یا ساختار داده‌ها تغییر کند، این تست‌ها
    شکست می‌خورند و جلوی مقایسه با یک مرجعِ دیگر بی‌اعتبار را می‌گیرند؛
    در آن صورت باید seedها با generate_seeds.py دوباره ساخته شوند.
    """

    def test_all_seeds_are_loadable(self):
        seeds = load_all_seeds()
        self.assertEqual(len(seeds), 5, 'باید دقیقاً پنج مجموعه‌ی داده‌ی آزمون وجود داشته باشد')
        for seed in seeds:
            for key in ('key', 'title', 'description', 'settings', 'places',
                        'teachers', 'courses', 'student_groups', 'target', 'stats'):
                self.assertIn(key, seed, f"کلید «{key}» در {seed.get('key')} نیست")

    def test_target_has_no_violations(self):
        for seed in load_all_seeds():
            with self.subTest(seed=seed['key']):
                config = seed_to_algorithm_config(seed)
                report = evaluate_entries(config, seed['target']['entries'])
                self.assertEqual(
                    report['total_violations'], 0,
                    f"پاسخ مرجع {seed['key']} تخلف دارد: "
                    f"{ {k: v for k, v in report['violations'].items() if v} }"
                )

    def test_target_cost_is_zero_under_algorithm_fitness(self):
        for seed in load_all_seeds():
            with self.subTest(seed=seed['key']):
                config = seed_to_algorithm_config(seed)
                cost = algorithm_cost(config, seed['target']['entries'])
                self.assertIsNotNone(cost, 'هزینه‌ی پاسخ مرجع قابل محاسبه نیست')
                self.assertEqual(cost, 0, f"هزینه‌ی پاسخ مرجع {seed['key']} صفر نیست: {cost}")

    def test_target_satisfies_all_time_preferences(self):
        for seed in load_all_seeds():
            with self.subTest(seed=seed['key']):
                config = seed_to_algorithm_config(seed)
                prefs = evaluate_entries(config, seed['target']['entries'])['time_preferences']
                self.assertEqual(prefs['satisfied'], prefs['total'])

    def test_session_count_matches_total_units(self):
        """
        الگوریتم برای هر واحدِ درس یک جلسه می‌سازد؛ پاسخ مرجع باید دقیقاً
        همان تعداد جلسه داشته باشد وگرنه مقایسه قابل انجام نیست.
        """
        for seed in load_all_seeds():
            with self.subTest(seed=seed['key']):
                total_units = sum(c['units'] for c in seed['courses'])
                self.assertEqual(len(seed['target']['entries']), total_units)


class ComparisonTests(TestCase):
    """رفتار موتور مقایسه در حالت‌های مرزی."""

    def setUp(self):
        self.seed = get_seed('seed_01_basic_sciences')

    def test_comparing_target_with_itself_is_identical(self):
        result = compare_with_target(self.seed, self.seed['target']['entries'])
        self.assertEqual(result['verdict']['code'], 'identical')
        self.assertEqual(result['agreement']['exact']['percent'], 100.0)
        self.assertEqual(result['produced']['total_violations'], 0)

    def test_sessions_of_same_course_are_order_independent(self):
        """
        جابه‌جا کردن ترتیب جلسات یک درس نباید انطباق را کم کند، چون جلسات یک
        درس با هم قابل تعویض‌اند. این دقیقاً همان جایی است که مقایسه‌ی ساده‌ی
        سطر به سطر نتیجه‌ی غلط می‌داد.
        """
        entries = [dict(e) for e in self.seed['target']['entries']]
        reversed_entries = list(reversed(entries))
        result = compare_with_target(self.seed, reversed_entries)
        self.assertEqual(result['agreement']['exact']['percent'], 100.0)
        self.assertEqual(result['verdict']['code'], 'identical')

    def test_broken_schedule_is_reported_as_suboptimal(self):
        """اگر همه‌ی جلسات را در یک بازه بگذاریم، باید انبوهی تخلف گزارش شود."""
        entries = [dict(e) for e in self.seed['target']['entries']]
        for entry in entries:
            entry['day'] = self.seed['settings']['days_of_week'][0]['name']
            entry['slot_id'] = self.seed['settings']['time_slots'][0]['id']

        result = compare_with_target(self.seed, entries)
        self.assertGreater(result['produced']['total_violations'], 0)
        self.assertIn(result['verdict']['code'], ('near_optimal', 'suboptimal'))
        self.assertGreater(result['produced']['violations']['place_conflicts'], 0)

    def test_missing_sessions_are_reported_as_incomplete(self):
        entries = [dict(e) for e in self.seed['target']['entries']][:-2]
        result = compare_with_target(self.seed, entries)
        self.assertEqual(result['verdict']['code'], 'incomplete')

    def test_payload_contains_everything_the_ui_needs(self):
        result = compare_with_target(self.seed, self.seed['target']['entries'])
        for key in ('seed', 'settings', 'entries', 'agreement', 'target',
                    'produced', 'structure', 'courses', 'lookup', 'verdict'):
            self.assertIn(key, result)
        self.assertTrue(result['settings']['days'])
        self.assertTrue(result['settings']['slots'])


class SeedDatabaseLoaderTests(TestCase):
    """
    بارگذاری واقعی یک seed در پایگاه‌داده.

    این تست تنها جایی است که مسیر seed → رکوردهای واقعی Django را می‌سنجد؛
    بقیه‌ی تست‌ها روی داده‌ی خام کار می‌کنند و به دیتابیس دست نمی‌زنند.
    """

    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University

        cls.university = University.objects.create(
            name='دانشگاه آزمون', subdomain='benchmark-test'
        )
        cls.user = CustomUser.objects.create_user(
            username='benchmark_tester',
            email='benchmark@example.test',
            password='not-a-real-password',
            role='admin',
            university=cls.university,
        )

    def test_load_seed_creates_a_complete_semester(self):
        from scheduling_module.benchmarks.db_loader import load_seed_into_db

        seed = get_seed('seed_03_lab_constrained')
        config, counts = load_seed_into_db(seed['key'], user=self.user)

        self.assertEqual(config.benchmark_key, seed['key'])
        self.assertEqual(config.university_id, self.university.id)
        self.assertEqual(config.semester, seed['settings']['semester'])

        for key, model_name in (('teachers', 'teachers'), ('places', 'places'),
                                ('courses', 'courses'), ('student_groups', 'student_groups'),
                                ('constraints', 'constraints')):
            expected = len(seed[key]) if key != 'constraints' else len(seed['constraints'])
            self.assertEqual(counts[key], expected, f'تعداد {model_name} نمی‌خواند')

    def test_courses_keep_their_allowed_teachers(self):
        """
        رابطه‌ی چند‌به‌چندِ درس-استاد باید حفظ شود؛ اگر خالی بماند الگوریتم هر
        استادی را به هر درسی می‌دهد و مقایسه با پاسخ مرجع بی‌معنا می‌شود.
        """
        from scheduling_module.benchmarks.db_loader import load_seed_into_db

        seed = get_seed('seed_01_basic_sciences')
        config, _counts = load_seed_into_db(seed['key'], user=self.user)

        by_code = {c['code']: c for c in seed['courses']}
        for course in config.courses.all():
            expected = sorted(by_code[course.code]['teachers'])
            actual = sorted(course.teachers.values_list('code', flat=True))
            self.assertEqual(actual, expected, f'اساتید مجاز درس {course.code} نمی‌خواند')

    def test_config_built_from_db_matches_the_seed_config(self):
        """
        مهم‌ترین تست این فایل: پیکربندی‌ای که برنامه از دیتابیس می‌سازد باید با
        پیکربندی‌ای که پاسخ مرجع با آن ساخته شده یکسان باشد. اگر این دو از هم
        فاصله بگیرند، الگوریتم مسئله‌ی دیگری را حل می‌کند و مقایسه اعتبار ندارد.
        """
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        from scheduling_module.utils import SchedulingAlgorithmRunner
        from scheduling_module.models import SchedulingTask

        for key in ('seed_01_basic_sciences', 'seed_04_gender_segregated'):
            with self.subTest(seed=key):
                seed = get_seed(key)
                config, _ = load_seed_into_db(seed['key'], user=self.user)
                task = SchedulingTask.objects.create(
                    created_by=self.user, name=f'تست {key}', university_config=config
                )

                runner = SchedulingAlgorithmRunner(task.id)
                runner.task = task
                from_db = runner._build_config_from_db()
                from_seed = seed_to_algorithm_config(seed)

                self.assertEqual(
                    from_db['settings']['days_of_week'], from_seed['settings']['days_of_week']
                )
                self.assertEqual(
                    from_db['settings']['time_slots'], from_seed['settings']['time_slots']
                )
                self.assertEqual(
                    from_db['settings']['max_classes_per_day'],
                    from_seed['settings']['max_classes_per_day'],
                )

                # کلید مرتب‌سازی باید ساختارهای تودرتو را هم نرمال کند: Postgres
                # ترتیب کلیدهای jsonb را حفظ نمی‌کند، پس مقایسه‌ی رشته‌ایِ سطحی
                # دو دیکشنریِ برابر را «متفاوت» نشان می‌دهد.
                def canonical(d):
                    return json.dumps(d, sort_keys=True, ensure_ascii=False)

                for section in ('places', 'teachers', 'courses', 'student_groups', 'constraints'):
                    db_sorted = sorted(from_db[section], key=canonical)
                    seed_sorted = sorted(from_seed[section], key=canonical)
                    self.assertEqual(
                        [canonical(d) for d in db_sorted],
                        [canonical(d) for d in seed_sorted],
                        f'بخش «{section}» در {key} یکسان نیست',
                    )

    def test_target_is_still_zero_cost_against_the_db_built_config(self):
        """پاسخ مرجع باید روی پیکربندیِ ساخته‌شده از دیتابیس هم هزینه‌ی صفر بدهد."""
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        from scheduling_module.utils import SchedulingAlgorithmRunner
        from scheduling_module.models import SchedulingTask

        seed = get_seed('seed_02_computer_engineering')
        config, _ = load_seed_into_db(seed['key'], user=self.user)
        task = SchedulingTask.objects.create(
            created_by=self.user, name='تست هزینه', university_config=config
        )
        runner = SchedulingAlgorithmRunner(task.id)
        runner.task = task

        cost = algorithm_cost(runner._build_config_from_db(), seed['target']['entries'])
        self.assertEqual(cost, 0)

    def test_loading_same_seed_twice_makes_distinct_semesters(self):
        from scheduling_module.benchmarks.db_loader import load_seed_into_db

        first, _ = load_seed_into_db('seed_01_basic_sciences', user=self.user)
        second, _ = load_seed_into_db('seed_01_basic_sciences', user=self.user)

        self.assertNotEqual(first.id, second.id)
        self.assertNotEqual(first.name, second.name)
        self.assertEqual(first.courses.count(), second.courses.count())


class BenchmarkAPITests(TestCase):
    """
    آزمون endpointهای واقعی از طریق APIClient.

    احراز هویت با force_authenticate انجام می‌شود (بدون رمز عبور)، بنابراین
    همان مسیری که رابط کاربری طی می‌کند — فهرست → بارگذاری → مقایسه — بدون
    نیاز به ساخت حساب واقعی سنجیده می‌شود.
    """

    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University

        cls.university = University.objects.create(
            name='دانشگاه آزمون API', subdomain='benchmark-api'
        )
        cls.admin = CustomUser.objects.create_user(
            username='benchmark_api_admin',
            email='api@example.test',
            password='not-a-real-password',
            role='admin',
            university=cls.university,
        )
        cls.teacher = CustomUser.objects.create_user(
            username='benchmark_api_teacher',
            email='teacher@example.test',
            password='not-a-real-password',
            role='teacher',
            university=cls.university,
        )

    def _client(self, user):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_seed_list_returns_all_five(self):
        response = self._client(self.admin).get('/scheduling/api/benchmarks/seeds/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 5)
        first = response.data['results'][0]
        for key in ('key', 'title', 'difficulty_label', 'stats', 'target_cost', 'loaded_config'):
            self.assertIn(key, first)

    def test_seed_detail_includes_the_target(self):
        response = self._client(self.admin).get(
            '/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/'
        )
        self.assertEqual(response.status_code, 200)
        seed = response.data['seed']
        self.assertEqual(seed['target']['cost'], 0)
        self.assertEqual(len(seed['target']['entries']), 13)

    def test_unknown_seed_returns_404(self):
        response = self._client(self.admin).get('/scheduling/api/benchmarks/seeds/does-not-exist/')
        self.assertEqual(response.status_code, 404)

    def test_teacher_cannot_load_a_seed(self):
        """بارگذاری داده دسترسی مدیر/مسئول آموزش می‌خواهد."""
        response = self._client(self.teacher).post(
            '/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/load/'
        )
        self.assertEqual(response.status_code, 403)

    def test_load_endpoint_creates_semester_and_task(self):
        response = self._client(self.admin).post(
            '/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/load/'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertIsNotNone(response.data['task_id'])
        self.assertEqual(response.data['counts']['courses'], 6)

        from scheduling_module.models import UniversityConfig
        config = UniversityConfig.objects.get(id=response.data['university_config_id'])
        self.assertEqual(config.benchmark_key, 'seed_01_basic_sciences')

        # پس از بارگذاری، فهرست باید همان نیمسال را به‌عنوان «بارگذاری‌شده» نشان دهد
        listing = self._client(self.admin).get('/scheduling/api/benchmarks/seeds/')
        loaded = {r['key']: r['loaded_config'] for r in listing.data['results']}
        self.assertIsNotNone(loaded['seed_01_basic_sciences'])

    def test_compare_endpoint_scores_a_perfect_result_as_identical(self):
        from scheduling_module.models import ScheduleResult, SchedulingTask

        load = self._client(self.admin).post(
            '/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/load/'
        )
        task = SchedulingTask.objects.get(id=load.data['task_id'])
        seed = get_seed('seed_01_basic_sciences')

        # نتیجه‌ای می‌سازیم که دقیقاً همان پاسخ مرجع است
        ScheduleResult.objects.create(
            task=task,
            schedule_data={'courses': seed['target']['entries'], 'generations_run': 1},
            total_cost=0,
        )
        task.status = 'completed'
        task.save()

        response = self._client(self.admin).get(
            f'/scheduling/api/scheduling-tasks/{task.id}/compare/'
        )
        self.assertEqual(response.status_code, 200)
        comparison = response.data['comparison']
        self.assertEqual(comparison['verdict']['code'], 'identical')
        self.assertEqual(comparison['agreement']['exact']['percent'], 100.0)
        self.assertEqual(comparison['produced']['total_violations'], 0)

    def test_compare_without_a_result_is_rejected(self):
        from scheduling_module.models import SchedulingTask

        load = self._client(self.admin).post(
            '/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/load/'
        )
        task = SchedulingTask.objects.get(id=load.data['task_id'])

        response = self._client(self.admin).get(
            f'/scheduling/api/scheduling-tasks/{task.id}/compare/'
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])

    def test_compare_on_a_non_benchmark_semester_is_rejected(self):
        """نیمسال دستی پاسخ مرجع ندارد و باید پیام روشن بدهد، نه خطای ۵۰۰."""
        from scheduling_module.models import SchedulingTask, UniversityConfig

        config = UniversityConfig.objects.create(
            university=self.university, name='نیمسال دستی', semester='۱۴۰۴-۱',
            created_by=self.admin,
        )
        task = SchedulingTask.objects.create(
            created_by=self.admin, name='اجرای دستی', university_config=config
        )
        response = self._client(self.admin).get(
            f'/scheduling/api/scheduling-tasks/{task.id}/compare/'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('پاسخ مرجع', response.data['message'])
