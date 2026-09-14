# -*- coding: utf-8 -*-
"""
حل‌کننده‌ی دقیق (backtracking) برای ساخت «پاسخ مرجع» (ground truth) هر seed.

این ماژول عمداً هیچ ارتباطی با الگوریتم فراابتکاری (BBO/GWO) ندارد: یک جست‌وجوی
کامل با پس‌گرد است که یک زمان‌بندی «بدون هیچ نقض محدودیتی» پیدا می‌کند. سپس در
generate_seeds.py همان جواب با تابع هزینه‌ی خودِ الگوریتم اعتبارسنجی می‌شود تا
مطمئن شویم هزینه‌ی آن صفر است. بنابراین پاسخ مرجع یک «کف قابل دستیابی» است و
مقایسه‌ی خروجی الگوریتم با آن معنادار است.
"""

import random

from .config_builder import seed_to_algorithm_config


class TargetSolver:
    """جست‌وجوی پس‌گرد برای یافتن یک زمان‌بندی کاملاً بدون تخلف."""

    def __init__(self, seed, rng_seed=1404):
        self.seed = seed
        self.config = seed_to_algorithm_config(seed)

        self.days = [d['name'] for d in self.config['settings']['days_of_week']
                     if d.get('enabled', True)]
        self.slots = [s for s in self.config['settings']['time_slots']
                      if s.get('enabled', True)]
        self.slot_by_id = {s['id']: s for s in self.slots}
        self.max_classes_per_day = int(self.config['settings']['max_classes_per_day'])

        self.places = self.config['places']
        self.teachers = self.config['teachers']
        self.courses = self.config['courses']
        self.teacher_by_code = {t['code']: t for t in self.teachers}
        self.place_by_code = {p['code']: p for p in self.places}

        self.rng = random.Random(rng_seed)

        self._build_sessions()
        self._build_conflict_pairs()
        self._build_constraint_tables()
        self._build_domains()

    # ------------------------------------------------------------------
    # آماده‌سازی
    # ------------------------------------------------------------------
    def _build_sessions(self):
        """
        تولید جلسات دقیقاً با همان ترتیبی که HybridBBO_RL_Scheduler._build_sessions
        تولید می‌کند (برای هر واحدِ درس، یک جلسه).
        """
        self.sessions = []
        max_possible = max(1, len(self.days) * len(self.slots))
        for c_idx, course in enumerate(self.courses):
            n_sessions = min(max(1, int(course.get('units', 1) or 1)), max_possible)
            for s_idx in range(n_sessions):
                self.sessions.append({
                    'course_idx': c_idx,
                    'session_index': s_idx,
                    'course_code': course['code'],
                    'allowed_teachers': [str(t) for t in (course.get('teachers') or [])],
                })

    def _build_conflict_pairs(self):
        """جفت دروسی که به‌خاطر دروس الزامیِ یک گروه دانشجویی نباید هم‌زمان شوند."""
        self.conflict_partners = {}
        for group in self.config['student_groups']:
            required = [c for c in (group.get('required_courses') or []) if c]
            for a in required:
                for b in required:
                    if a != b:
                        self.conflict_partners.setdefault(a, set()).add(b)

    def _build_constraint_tables(self):
        self.place_unavailable = set()   # (place_code, day, slot_id|None)
        self.time_preferences = []       # (teacher_code, day, slot_id)
        for c in self.config['constraints']:
            params = c.get('parameters') or {}
            if c.get('type') == 'place_unavailable':
                self.place_unavailable.add(
                    (params.get('place_code'), params.get('day'), params.get('slot_id'))
                )
            elif c.get('type') == 'time_preference':
                self.time_preferences.append(
                    (params.get('teacher_code'), params.get('day'), params.get('slot_id'))
                )

    def _teacher_blocked(self, teacher_code, day, slot_id):
        """
        همان منطق تابع هزینه‌ی الگوریتم:
        unavailable_times با یکی از حالت‌های «روز»، «روز-بازه» یا «روز_بازه» مطابقت می‌کند.
        """
        teacher = self.teacher_by_code.get(teacher_code)
        if not teacher:
            return True
        unavailable = set(map(str, teacher.get('unavailable_times') or []))
        if not unavailable:
            return False
        variants = {f"{day}-{slot_id}", f"{day}_{slot_id}", str(day)}
        return bool(unavailable & variants)

    def _place_blocked(self, place_code, day, slot_id):
        for (pc, pday, pslot) in self.place_unavailable:
            if place_code == pc and day == pday and (pslot is None or slot_id == pslot):
                return True
        return False

    def _candidate_places(self, course):
        """همان منطق _candidate_places الگوریتم، به‌علاوه‌ی فیلتر ظرفیت و جنسیت."""
        required_place = course.get('required_place')
        if required_place and str(required_place) in self.place_by_code:
            base = [self.place_by_code[str(required_place)]]
        else:
            required_type = course.get('required_place_type')
            base = [p for p in self.places
                    if not required_type or p.get('place_type') == required_type]
            base = base or list(self.places)

        c_gender = int(course.get('gender', 0) or 0)
        expected = int(course.get('expected_students', 0) or 0)

        ok = []
        for p in base:
            if int(p.get('capacity', 0) or 0) < expected:
                continue
            p_gender = int(p.get('gender', 0) or 0)
            if p_gender and c_gender and p_gender != c_gender:
                continue
            ok.append(p)
        return ok

    def _build_domains(self):
        """
        دامنه‌ی هر جلسه: فهرست (day, slot_id, place_code, teacher_code) هایی که
        هیچ محدودیت «ایستا» (مستقل از بقیه‌ی جلسات) را نقض نمی‌کنند.
        """
        self.domains = []
        for session in self.sessions:
            course = self.courses[session['course_idx']]
            places = self._candidate_places(course)
            teachers = session['allowed_teachers'] or list(self.teacher_by_code.keys())

            values = []
            for day in self.days:
                for slot in self.slots:
                    sid = slot['id']
                    for teacher_code in teachers:
                        if self._teacher_blocked(teacher_code, day, sid):
                            continue
                        for place in places:
                            if self._place_blocked(place['code'], day, sid):
                                continue
                            values.append((day, sid, place['code'], teacher_code))

            if not values:
                raise ValueError(
                    f"درس {course['code']} ({course['name']}) هیچ گزینه‌ی معتبری ندارد؛ "
                    f"داده‌های seed «{self.seed['key']}» ناسازگار است."
                )
            self.domains.append(values)

    # ------------------------------------------------------------------
    # جست‌وجو
    # ------------------------------------------------------------------
    def solve(self, restarts=40, steps_per_try=60_000):
        """
        پیدا کردن یک تخصیص کامل و بدون تخلف.

        از پس‌گردِ «محدودترین متغیر اول» (MRV پویا) با شروع مجددِ تصادفی استفاده
        می‌کند: هر تلاش بودجه‌ی گام محدودی دارد و در صورت شکست با ترتیب تصادفیِ
        متفاوتی دوباره شروع می‌شود. این کار از گیر کردن در یک شاخه‌ی بد جلوگیری
        می‌کند و برای مسائل در این اندازه در عمل چند صد میلی‌ثانیه طول می‌کشد.

        خروجی: لیستی هم‌طول با self.sessions از تاپل (day, slot_id, place, teacher)
        یا None اگر پیدا نشد.
        """
        # پیش‌تخصیص برای رعایت «ترجیح زمانی»: برای هر ترجیح، یک جلسه‌ی مناسب را
        # به همان روز/بازه/استاد قفل می‌کنیم تا پاداش آن حتماً در پاسخ مرجع باشد.
        static_order = sorted(
            range(len(self.sessions)),
            key=lambda i: (
                len(self.domains[i]),
                -len(self.conflict_partners.get(self.sessions[i]['course_code'], ())),
            ),
        )
        pinned = self._pin_time_preferences(static_order)

        for attempt in range(restarts):
            assignment = [None] * len(self.sessions)
            state = {
                'teacher_slot': set(),   # (teacher, day, slot)
                'place_slot': set(),     # (place, day, slot)
                'course_slot': set(),    # (course_code, day, slot)
                'teacher_day': {},       # (teacher, day) -> count
                'slot_load': {},         # (day, slot) -> count
                'unassigned': set(range(len(self.sessions))),
                'steps': 0,
                'max_steps': steps_per_try,
            }
            try:
                if self._backtrack(assignment, state, pinned):
                    self.attempts_used = attempt + 1
                    return assignment
            except TimeoutError:
                # بودجه‌ی این تلاش تمام شد؛ با ترتیب تصادفی دیگری دوباره تلاش می‌کنیم
                continue

        return None

    def _pin_time_preferences(self, order):
        """انتخاب یک جلسه برای هر ترجیح زمانی و محدود کردن دامنه‌ی آن."""
        pinned = {}
        used_sessions = set()
        for (teacher_code, day, slot_id) in self.time_preferences:
            for idx in order:
                if idx in used_sessions:
                    continue
                if teacher_code not in (self.sessions[idx]['allowed_teachers'] or []):
                    continue
                values = [
                    v for v in self.domains[idx]
                    if v[0] == day and (slot_id is None or v[1] == slot_id)
                    and v[3] == teacher_code
                ]
                if values:
                    pinned[idx] = values
                    used_sessions.add(idx)
                    break
        return pinned

    def _is_consistent(self, idx, value, state):
        """آیا این مقدار با تخصیص‌های فعلی سازگار است؟"""
        day, slot_id, place_code, teacher_code = value
        course_code = self.sessions[idx]['course_code']

        if (teacher_code, day, slot_id) in state['teacher_slot']:
            return False
        if (place_code, day, slot_id) in state['place_slot']:
            return False
        if (course_code, day, slot_id) in state['course_slot']:
            return False
        if state['teacher_day'].get((teacher_code, day), 0) >= self.max_classes_per_day:
            return False
        for partner in self.conflict_partners.get(course_code, ()):
            if (partner, day, slot_id) in state['course_slot']:
                return False
        return True

    def _consistent_values(self, idx, state, pinned):
        """
        مقادیر سازگار، با ترتیب هوشمند: اول روز/بازه‌هایی که کمتر استفاده شده‌اند،
        تا جدول نهایی روی هفته پخش شود و شبیه یک برنامه‌ی واقعی به‌نظر برسد.
        """
        values = [v for v in (pinned.get(idx) or self.domains[idx])
                  if self._is_consistent(idx, v, state)]
        load = state['slot_load']
        self.rng.shuffle(values)
        values.sort(key=lambda v: load.get((v[0], v[1]), 0))
        return values

    def _select_variable(self, state, pinned):
        """
        MRV پویا: جلسه‌ای که هم‌اکنون کمترین تعداد مقدار سازگار را دارد.
        شمارش با سقف کوتاه انجام می‌شود چون فقط ترتیب اهمیت دارد، نه عدد دقیق.
        """
        best_idx, best_count = None, None
        for idx in state['unassigned']:
            count = 0
            for value in (pinned.get(idx) or self.domains[idx]):
                if self._is_consistent(idx, value, state):
                    count += 1
                    if best_count is not None and count >= best_count:
                        break
            if count == 0:
                return idx  # بن‌بست؛ فوراً همین را برمی‌گردانیم تا پس‌گرد شود
            if best_count is None or count < best_count:
                best_idx, best_count = idx, count
        return best_idx

    def _backtrack(self, assignment, state, pinned):
        if not state['unassigned']:
            return True

        state['steps'] += 1
        if state['steps'] > state['max_steps']:
            raise TimeoutError('جست‌وجوی پاسخ مرجع بیش از حد طول کشید')

        idx = self._select_variable(state, pinned)
        session = self.sessions[idx]
        course_code = session['course_code']

        state['unassigned'].discard(idx)
        for (day, slot_id, place_code, teacher_code) in self._consistent_values(idx, state, pinned):
            assignment[idx] = (day, slot_id, place_code, teacher_code)
            state['teacher_slot'].add((teacher_code, day, slot_id))
            state['place_slot'].add((place_code, day, slot_id))
            state['course_slot'].add((course_code, day, slot_id))
            state['teacher_day'][(teacher_code, day)] = \
                state['teacher_day'].get((teacher_code, day), 0) + 1
            state['slot_load'][(day, slot_id)] = state['slot_load'].get((day, slot_id), 0) + 1

            if self._backtrack(assignment, state, pinned):
                return True

            assignment[idx] = None
            state['teacher_slot'].discard((teacher_code, day, slot_id))
            state['place_slot'].discard((place_code, day, slot_id))
            state['course_slot'].discard((course_code, day, slot_id))
            state['teacher_day'][(teacher_code, day)] -= 1
            state['slot_load'][(day, slot_id)] -= 1

        state['unassigned'].add(idx)
        return False

    # ------------------------------------------------------------------
    # خروجی
    # ------------------------------------------------------------------
    def to_entries(self, assignment):
        """تبدیل تخصیص به همان قالبی که الگوریتم برمی‌گرداند (result['courses'])."""
        entries = []
        for session, value in zip(self.sessions, assignment):
            day, slot_id, place_code, teacher_code = value
            slot = self.slot_by_id[slot_id]
            course = self.courses[session['course_idx']]
            entries.append({
                'course_code': course['code'],
                'course_name': course['name'],
                'session_index': session['session_index'],
                'day': day,
                'slot_id': slot_id,
                'start': slot['start'],
                'end': slot['end'],
                'teacher_code': teacher_code,
                'place_code': place_code,
            })
        return entries
