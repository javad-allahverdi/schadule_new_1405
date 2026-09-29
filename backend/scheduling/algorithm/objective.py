"""COOP0's hard-first objective, shared by search and result reporting.

H counts hard violations; S counts excess daily classes and unmet preference
weights. Tuples (H, S) are compared lexicographically, without bonus subtraction.
"""

from collections import Counter, defaultdict, deque
try:
    from .weekly_loads import WeeklyLoads, weekly_loads_enabled
except ImportError:
    from weekly_loads import WeeklyLoads, weekly_loads_enabled


class TimetableObjective:
    def __init__(self, scheduler):
        self.scheduler = scheduler
        self.slot_ids = {slot['id'] for slot in scheduler.time_slots}
        self.weekly = WeeklyLoads(scheduler) if weekly_loads_enabled(scheduler.config) else None
        self.unavailable = {
            code: set(map(str, teacher.get('unavailable_times') or []))
            for code, teacher in scheduler.teacher_by_code.items()
        }

    def evaluate_entries(self, entries):
        """Align exchangeable sessions by course; count missing/extra sessions."""
        pool = defaultdict(deque)
        for entry in entries:
            pool[entry.get('course_code')].append(entry)
        individual = []
        for session in self.scheduler.sessions:
            code = self.scheduler.courses[session['course_idx']].get('code')
            individual.append(pool[code].popleft() if pool[code] else None)
        extra = sum(len(bucket) for bucket in pool.values())
        return self.evaluate(individual, extra_sessions=extra)

    def evaluate(self, individual, extra_sessions=0):
        s = self.scheduler
        violations = Counter()
        extra_sessions += max(0, len(individual) - len(s.sessions))
        if extra_sessions:
            violations['extra_session'] = extra_sessions
        teacher_slots, place_slots, course_slots, teacher_days = (Counter() for _ in range(4))
        slot_courses = defaultdict(list)
        satisfied = set()

        for index, session in enumerate(s.sessions):
            gene = individual[index] if index < len(individual) else None
            if gene is None:
                violations['missing_session'] += 1
                continue
            course = s.courses[session['course_idx']]
            day, slot = gene.get('day'), gene.get('slot_id')
            tc, pc = gene.get('teacher_code'), gene.get('place_code')
            teacher = s.teacher_by_code.get(str(tc))
            place = s.place_by_code.get(str(pc))
            if day not in s.days or slot not in self.slot_ids:
                violations['domain'] += 1
            if not teacher or (session['allowed_teachers'] and str(tc) not in session['allowed_teachers']):
                violations['teacher_eligibility'] += 1
            if teacher and self.unavailable[str(tc)] & {str(day), f'{day}-{slot}', f'{day}_{slot}'}:
                violations['teacher_unavailable'] += 1
            if not place:
                violations['missing_place'] += 1
            else:
                if int(place.get('capacity', 0)) < int(course.get('expected_students', 0)):
                    violations['capacity'] += 1
                pg, cg = int(place.get('gender', 0)), int(course.get('gender', 0))
                if pg and cg and pg != cg:
                    violations['gender'] += 1
                if course.get('required_place'):
                    if str(place['code']) != str(course['required_place']):
                        violations['required_place'] += 1
                elif course.get('required_place_type') and place.get('place_type') != course['required_place_type']:
                    violations['place_type'] += 1
            for room, blocked_day, blocked_slot in s._place_unavailable:
                if pc == room and day == blocked_day and (blocked_slot is None or slot == blocked_slot):
                    violations['place_unavailable'] += 1

            teacher_slots[(tc, day, slot)] += 1
            place_slots[(pc, day, slot)] += 1
            course_slots[(session['course_idx'], day, slot)] += 1
            teacher_days[(tc, day)] += 1
            slot_courses[(day, slot)].append(course.get('code'))
            for k, (pt, pd, ps, _) in enumerate(s._time_preferences):
                if tc == pt and day == pd and (ps is None or slot == ps):
                    satisfied.add(k)

        for groups, key in ((teacher_slots, 'teacher_conflict'), (place_slots, 'place_conflict'),
                            (course_slots, 'same_course')):
            count = sum(n - 1 for n in groups.values() if n > 1)
            if count:
                violations[key] += count
        for codes in slot_courses.values():
            for i, first in enumerate(codes):
                for second in codes[i + 1:]:
                    if tuple(sorted((first, second))) in s._conflicting_course_pairs:
                        violations['group_conflict'] += 1

        weekly_counts = self.weekly.loads(individual) if self.weekly else None
        if self.weekly:
            minimum, maximum = self.weekly.violations(weekly_counts)
            if minimum:
                violations['weekly_minimum_units'] = minimum
            if maximum:
                violations['weekly_maximum_units'] = maximum
        daily = sum(max(0, n - s.max_classes_per_day) for n in teacher_days.values())
        missed = sum(max(0, weight) for k, (_, _, _, weight) in enumerate(s._time_preferences)
                     if k not in satisfied)
        hard = sum(violations.values())
        result = {
            'objective': (hard, daily + missed),
            'hard_violations': hard,
            'soft_penalty': daily + missed,
            'feasible': hard == 0,
            'violations': dict(violations),
            'daily_excess': daily,
            'unmet_preference_weight': missed,
            'time_preferences': {'satisfied': len(satisfied), 'total': len(s._time_preferences)},
        }
        if self.weekly:
            result['constraint_model'] = 'weekly-loads-v1'
            result['weekly_teacher_loads'] = {tc:weekly_counts[tc]/self.weekly.scale for tc in self.weekly.bounds}
        return result
