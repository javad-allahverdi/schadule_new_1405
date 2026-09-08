# -*- coding: utf-8 -*-
"""
hybrid_bbo_rl.py
=================
الگوریتم هیبرید بهینه‌سازی مبتنی بر زیست‌جغرافیا (Biogeography-Based
Optimization / BBO) و گرگ خاکستری (Grey Wolf Optimizer / GWO) برای حل مسئله
زمان‌بندی دروس دانشگاهی (University Course Timetabling Problem - UCTP).

ورودی: مسیر یک فایل YAML شامل چهار بخش settings / places / teachers /
       courses / constraints (خروجی ExcelToYAMLConverter در
       scheduling_module/utils.py)

خروجی: دیکشنری شامل کلید 'cost' (هزینه‌ی کل جواب نهایی، هرچه کمتر بهتر) و
       'courses' (لیست جلسات زمان‌بندی‌شده)

--------------------------------------------------------------------------
ایده‌ی کلی الگوریتم
--------------------------------------------------------------------------
هر جواب (Individual/Habitat/Wolf) یک لیست از "ژن" است؛ هر ژن نشان‌دهنده‌ی
تخصیص یک جلسه‌ی درسی به (روز، بازه‌ی زمانی، مکان، استاد) است.

در هر نسل، الگوریتم به‌صورت متناوب یکی از دو عملگر زیر را روی جمعیت اعمال
می‌کند:

  ۱) عملگر مهاجرت BBO: جواب‌های ضعیف‌تر (HSI پایین) با احتمال بیشتری از
     جواب‌های قوی‌تر «مهاجرت ژن» می‌گیرند (Migration) و سپس با نرخ کمی
     جهش (Mutation) می‌کنند تا از افتادن در بهینه‌ی محلی جلوگیری شود.

  ۲) عملگر گرگ خاکستری (GWO): سه جواب برتر جمعیت به‌عنوان رهبران گله
     (آلفا/بتا/دلتا) در نظر گرفته می‌شوند و بقیه‌ی گرگ‌ها (جواب‌ها) با
     احتمالی که به ضریب هم‌گرایی a (که از ۲ به ۰ در طول اجرا کاهش می‌یابد)
     وابسته است، به‌سمت رهبران حرکت می‌کنند یا به کاوش تصادفی می‌پردازند.

این دو عملگر مکمل هم عمل می‌کنند: BBO تنوع جمعیت (exploration) را حفظ
می‌کند و GWO هم‌گرایی سریع به سمت جواب‌های خوب (exploitation) را تضمین
می‌کند. بهترین جواب هر نسل با نخبه‌گرایی (Elitism) در جمعیت نگه داشته
می‌شود تا هرگز از دست نرود.
"""

import copy
import random

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None


DEFAULT_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه']
DEFAULT_TIME_SLOTS = [
    {'id': 1, 'start': '08:00', 'end': '10:00'},
    {'id': 2, 'start': '10:00', 'end': '12:00'},
    {'id': 3, 'start': '13:30', 'end': '15:30'},
    {'id': 4, 'start': '15:30', 'end': '17:30'},
]


class HybridBBO_RL_Scheduler:
    """
    الگوریتم هیبرید BBO + GWO برای زمان‌بندی خودکار دروس دانشگاهی.

    استفاده:
        scheduler = HybridBBO_RL_Scheduler('/path/to/config.yaml')
        scheduler.popsize = 50          # قابل تنظیم از بیرون
        scheduler.maxgen = 100
        result = scheduler.optimize_with_hybrid_approach()
        # result = {'cost': 0, 'courses': [...], 'generations_run': 42, 'convergence': [...]}
    """

    # ------------------------------------------------------------------
    # مقداردهی اولیه
    # ------------------------------------------------------------------
    def __init__(self, config_path=None, config=None, seed=None):
        if config is not None:
            self.config = config
        else:
            if yaml is None:
                raise ImportError('پکیج PyYAML نصب نیست.')
            with open(config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f) or {}

        settings = self.config.get('settings') or {}

        self.days = self._normalize_days(settings.get('days_of_week'))
        self.time_slots = self._normalize_time_slots(settings.get('time_slots'))
        self.max_classes_per_day = int(settings.get('max_classes_per_day', 3) or 3)

        self.places = self.config.get('places') or []
        self.teachers = self.config.get('teachers') or []
        self.courses = self.config.get('courses') or []
        self.constraints = self.config.get('constraints') or []
        self.student_groups = self.config.get('student_groups') or []

        self.teacher_by_code = {str(t.get('code')): t for t in self.teachers if t.get('code')}
        self.place_by_code = {str(p.get('code')): p for p in self.places if p.get('code')}

        self.sessions = self._build_sessions()

        # نگاشت کد درس -> اندیس‌های جلسات آن، برای اعمال سریع محدودیت‌های گروه دانشجویی
        self._course_code_to_session_idxs = {}
        for idx, session in enumerate(self.sessions):
            code = self.courses[session['course_idx']].get('code')
            self._course_code_to_session_idxs.setdefault(code, []).append(idx)

        # جفت‌ دروسی که طبق «دروس الزامی» یک گروه دانشجویی، نباید هم‌زمان برگزار شوند
        self._conflicting_course_pairs = self._build_group_conflict_pairs()

        # محدودیت‌های خاصِ کاربر (place_unavailable / time_preference و...)
        self._place_unavailable = []   # [(place_code, day, slot_id)]
        self._time_preferences = []    # [(teacher_code, day, slot_id, weight)]
        for c in self.constraints:
            ctype = c.get('type')
            params = c.get('parameters') or {}
            if ctype == 'place_unavailable':
                self._place_unavailable.append((
                    params.get('place_code'), params.get('day'), params.get('slot_id')
                ))
            elif ctype == 'time_preference':
                self._time_preferences.append((
                    params.get('teacher_code'), params.get('day'), params.get('slot_id'),
                    float(params.get('weight', 1))
                ))

        # ------------------ ابرپارامترهای الگوریتم (قابل تنظیم) ------------------
        self.popsize = 40
        self.maxgen = 80
        self.elite_count = 2
        self.mutation_rate = 0.12

        # وزن‌های تابع هزینه (این نام‌ها دقیقاً باید با algorithm_params در
        # SchedulingTask مطابقت داشته باشند تا از Django قابل بازنویسی باشند)
        self.teacher_conflict_cost = 100
        self.place_conflict_cost = 100
        self.capacity_cost = 50
        self.gender_mismatch_cost = 40
        self.unavailable_cost = 80
        self.max_classes_per_day_cost = 15
        self.same_course_same_slot_cost = 10
        self.min_units_cost = 20
        self.group_conflict_cost = 60
        self.place_unavailable_cost = 90
        self.time_preference_bonus = 15

        self._rng = random.Random(seed)

    # ------------------------------------------------------------------
    # نرمال‌سازی ورودی‌ها
    # ------------------------------------------------------------------
    @staticmethod
    def _normalize_days(raw_days):
        if not raw_days:
            return list(DEFAULT_DAYS)
        normalized = []
        for d in raw_days:
            if isinstance(d, dict):
                if d.get('enabled', True):
                    normalized.append(d.get('name') or d.get('id'))
            else:
                normalized.append(d)
        return normalized or list(DEFAULT_DAYS)

    @staticmethod
    def _normalize_time_slots(raw_slots):
        if not raw_slots:
            return [dict(s) for s in DEFAULT_TIME_SLOTS]
        normalized = []
        for i, s in enumerate(raw_slots):
            if isinstance(s, dict):
                if s.get('enabled', True):
                    normalized.append({
                        'id': s.get('id', i),
                        'start': s.get('start'),
                        'end': s.get('end'),
                    })
        return normalized or [dict(s) for s in DEFAULT_TIME_SLOTS]

    def _build_sessions(self):
        """هر واحد درسی معادل یک جلسه‌ی هفتگی است (قابل بازنویسی با کلید 'sessions')."""
        sessions = []
        for c_idx, course in enumerate(self.courses):
            n_sessions = course.get('sessions')
            if not n_sessions:
                n_sessions = max(1, int(course.get('units', 1) or 1))

            max_possible = max(1, len(self.days) * len(self.time_slots))
            n_sessions = min(int(n_sessions), max_possible)

            raw_teachers = course.get('teachers') or []
            allowed_teachers = [str(t).strip() for t in raw_teachers if str(t).strip()]

            for s_idx in range(n_sessions):
                sessions.append({
                    'course_idx': c_idx,
                    'session_index': s_idx,
                    'allowed_teachers': allowed_teachers,
                })
        return sessions

    def _candidate_places(self, course):
        required_place = course.get('required_place')
        required_type = course.get('required_place_type')

        if required_place and str(required_place) in self.place_by_code:
            return [self.place_by_code[str(required_place)]]

        candidates = [
            p for p in self.places
            if not required_type or p.get('place_type') == required_type
        ]
        return candidates or list(self.places)

    def _build_group_conflict_pairs(self):
        """
        هر گروه دانشجویی که چند «درس الزامی» دارد، یعنی آن دروس نباید هم‌زمان
        برگزار شوند (چون یک دانشجو باید بتواند در هر دوی آن‌ها شرکت کند).
        این تابع همه‌ی این جفت‌کدهای درس را از پیش محاسبه می‌کند.
        """
        pairs = set()
        for group in self.student_groups:
            required = [c for c in (group.get('required_courses') or []) if c]
            for i in range(len(required)):
                for j in range(i + 1, len(required)):
                    a, b = required[i], required[j]
                    if a != b:
                        pairs.add(tuple(sorted((a, b))))
        return pairs

    # ------------------------------------------------------------------
    # ساخت ژن‌ها / جمعیت اولیه
    # ------------------------------------------------------------------
    def _random_gene(self, session):
        course = self.courses[session['course_idx']]

        day = self._rng.choice(self.days)
        slot = self._rng.choice(self.time_slots)

        candidate_places = self._candidate_places(course)
        place = self._rng.choice(candidate_places) if candidate_places else None

        allowed_teachers = session['allowed_teachers'] or list(self.teacher_by_code.keys())
        teacher = self._rng.choice(allowed_teachers) if allowed_teachers else None

        return {
            'day': day,
            'slot_id': slot.get('id'),
            'start': slot.get('start'),
            'end': slot.get('end'),
            'place_code': place.get('code') if place else None,
            'teacher_code': teacher,
        }

    def _init_individual(self):
        return [self._random_gene(s) for s in self.sessions]

    def _init_population(self):
        return [self._init_individual() for _ in range(max(self.popsize, 4))]

    # ------------------------------------------------------------------
    # تابع هزینه (Fitness) - هرچه کمتر بهتر
    # ------------------------------------------------------------------
    def _fitness(self, individual):
        cost = 0.0

        teacher_slot_count = {}
        place_slot_count = {}
        teacher_day_count = {}
        course_day_slot_count = {}
        course_slot_map = {}  # (day, slot) -> set(course_code) برای بررسی تداخل گروه دانشجویی

        for gene, session in zip(individual, self.sessions):
            course = self.courses[session['course_idx']]
            day, slot = gene['day'], gene['slot_id']
            teacher_code, place_code = gene['teacher_code'], gene['place_code']

            # --- تداخل زمانی دروس الزامیِ یک گروه دانشجویی ---
            key_ds = (day, slot)
            course_code = course.get('code')
            existing_courses = course_slot_map.setdefault(key_ds, set())
            for other_code in existing_courses:
                pair = tuple(sorted((course_code, other_code)))
                if pair in self._conflicting_course_pairs:
                    cost += self.group_conflict_cost
            existing_courses.add(course_code)

            # --- مکان غیرقابل‌دسترس (مثلاً تعطیلی سالن ورزشی در روز خاص) ---
            for (pc, pday, pslot) in self._place_unavailable:
                if place_code == pc and day == pday and (pslot is None or slot == pslot):
                    cost += self.place_unavailable_cost

            # --- ترجیح زمانی استاد (پاداش، یعنی کاهش هزینه) ---
            for (tc, tday, tslot, weight) in self._time_preferences:
                if teacher_code == tc and day == tday and (tslot is None or slot == tslot):
                    cost -= self.time_preference_bonus * weight

            # --- تداخل استاد ---
            if teacher_code:
                tk = (teacher_code, day, slot)
                teacher_slot_count[tk] = teacher_slot_count.get(tk, 0) + 1
                if teacher_slot_count[tk] > 1:
                    cost += self.teacher_conflict_cost

                teacher = self.teacher_by_code.get(teacher_code)
                if teacher:
                    unavailable = teacher.get('unavailable_times') or []
                    tag_variants = {f"{day}-{slot}", f"{day}_{slot}", str(day)}
                    if unavailable and (set(map(str, unavailable)) & tag_variants):
                        cost += self.unavailable_cost

                dk = (teacher_code, day)
                teacher_day_count[dk] = teacher_day_count.get(dk, 0) + 1

            # --- تداخل مکان ---
            if place_code:
                pk = (place_code, day, slot)
                place_slot_count[pk] = place_slot_count.get(pk, 0) + 1
                if place_slot_count[pk] > 1:
                    cost += self.place_conflict_cost

                place = self.place_by_code.get(place_code)
                if place:
                    if int(place.get('capacity', 0) or 0) < int(course.get('expected_students', 0) or 0):
                        cost += self.capacity_cost

                    p_gender = int(place.get('gender', 0) or 0)
                    c_gender = int(course.get('gender', 0) or 0)
                    if p_gender and c_gender and p_gender != c_gender:
                        cost += self.gender_mismatch_cost
            else:
                cost += self.place_conflict_cost  # مکان تخصیص داده نشده

            if not teacher_code:
                cost += self.teacher_conflict_cost  # استاد تخصیص داده نشده

            # --- پخش جلسات یک درس در روزها/بازه‌های مختلف ---
            csk = (session['course_idx'], day, slot)
            course_day_slot_count[csk] = course_day_slot_count.get(csk, 0) + 1
            if course_day_slot_count[csk] > 1:
                cost += self.same_course_same_slot_cost

        # --- سقف تعداد کلاس روزانه‌ی هر استاد ---
        for (_teacher, _day), count in teacher_day_count.items():
            if count > self.max_classes_per_day:
                cost += (count - self.max_classes_per_day) * self.max_classes_per_day_cost

        return max(cost, 0.0)

    # ------------------------------------------------------------------
    # عملگر مهاجرت BBO
    # ------------------------------------------------------------------
    def _roulette_select(self, weights):
        total = sum(weights)
        if total <= 0:
            return self._rng.randrange(len(weights))
        r = self._rng.uniform(0, total)
        upto = 0.0
        for i, w in enumerate(weights):
            upto += w
            if upto >= r:
                return i
        return len(weights) - 1

    def _bbo_migration(self, population, fitnesses):
        n = len(population)
        order = sorted(range(n), key=lambda i: fitnesses[i])  # کم‌هزینه‌تر = بهتر
        rank_of = {idx: rank for rank, idx in enumerate(order)}

        # نرخ مهاجرت: جواب‌های خوب نرخ مهاجرت (emigration) بالا، نرخ ورود
        # (immigration) پایین دارند و بالعکس
        mu = [1 - (rank_of[i] / max(n - 1, 1)) for i in range(n)]
        lam = [1 - m for m in mu]

        elite_idxs = set(order[:self.elite_count])
        new_population = [copy.deepcopy(ind) for ind in population]

        for i in range(n):
            if i in elite_idxs:
                continue
            individual = new_population[i]
            for gene_idx in range(len(individual)):
                if self._rng.random() < lam[i]:
                    source_idx = self._roulette_select(mu)
                    individual[gene_idx] = copy.deepcopy(population[source_idx][gene_idx])
                if self._rng.random() < self.mutation_rate:
                    individual[gene_idx] = self._random_gene(self.sessions[gene_idx])

        return new_population

    # ------------------------------------------------------------------
    # عملگر گرگ خاکستری (GWO) - نسخه‌ی گسسته‌شده برای فضای ترکیبیاتی
    # ------------------------------------------------------------------
    def _gwo_update(self, population, fitnesses, generation):
        n = len(population)
        order = sorted(range(n), key=lambda i: fitnesses[i])
        alpha = order[0]
        beta = order[1] if n > 1 else order[0]
        delta = order[2] if n > 2 else order[0]

        a = 2.0 - generation * (2.0 / max(self.maxgen, 1))
        new_population = [copy.deepcopy(ind) for ind in population]

        for i in range(n):
            if i == alpha:
                continue
            individual = new_population[i]
            for gene_idx in range(len(individual)):
                A = 2 * a * self._rng.random() - a
                if abs(A) < 1:
                    # exploitation: حرکت به سمت یکی از سه رهبر گله
                    leader = self._rng.choices([alpha, beta, delta], weights=[3, 2, 1])[0]
                    individual[gene_idx] = copy.deepcopy(population[leader][gene_idx])
                elif self._rng.random() < 0.3:
                    # exploration: کاوش تصادفی برای جلوگیری از بهینه‌ی محلی
                    individual[gene_idx] = self._random_gene(self.sessions[gene_idx])

        return new_population

    # ------------------------------------------------------------------
    # حلقه‌ی اصلی بهینه‌سازی
    # ------------------------------------------------------------------
    def optimize_with_hybrid_approach(self, progress_callback=None):
        if not self.sessions:
            return {'cost': 0, 'courses': [], 'generations_run': 0, 'convergence': [0]}

        population = self._init_population()
        fitnesses = [self._fitness(ind) for ind in population]

        best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
        best_individual = copy.deepcopy(population[best_idx])
        best_cost = fitnesses[best_idx]
        convergence = [best_cost]

        generations_run = 0
        for generation in range(self.maxgen):
            generations_run = generation + 1

            if generation % 2 == 0:
                population = self._bbo_migration(population, fitnesses)
            else:
                population = self._gwo_update(population, fitnesses, generation)

            fitnesses = [self._fitness(ind) for ind in population]

            gen_best_idx = min(range(len(population)), key=lambda i: fitnesses[i])
            if fitnesses[gen_best_idx] < best_cost:
                best_cost = fitnesses[gen_best_idx]
                best_individual = copy.deepcopy(population[gen_best_idx])

            # نخبه‌گرایی: بهترین جواب تاریخی همیشه در جمعیت باقی می‌ماند
            worst_idx = max(range(len(population)), key=lambda i: fitnesses[i])
            population[worst_idx] = copy.deepcopy(best_individual)
            fitnesses[worst_idx] = best_cost

            convergence.append(best_cost)

            if progress_callback:
                try:
                    progress_callback(generation + 1, self.maxgen, best_cost)
                except Exception:
                    pass

            if best_cost <= 0:
                break

        return self._build_result(best_individual, best_cost, convergence, generations_run)

    # ------------------------------------------------------------------
    # ساخت خروجی نهایی
    # ------------------------------------------------------------------
    def _build_result(self, individual, cost, convergence, generations_run):
        courses_out = []
        for gene, session in zip(individual, self.sessions):
            course = self.courses[session['course_idx']]
            courses_out.append({
                'course_code': course.get('code'),
                'course_name': course.get('name'),
                'session_index': session['session_index'],
                'day': gene['day'],
                'slot_id': gene['slot_id'],
                'start': gene['start'],
                'end': gene['end'],
                'teacher_code': gene['teacher_code'],
                'place_code': gene['place_code'],
            })

        return {
            'cost': cost,
            'courses': courses_out,
            'generations_run': generations_run,
            'convergence': convergence,
            'population_size': self.popsize,
        }
