"""Exact hard constraints and soft preferences for university timetabling."""

from collections import defaultdict
from fractions import Fraction
from math import lcm

from .coop1 import COOP1Scheduler, StaticDomains
from .objective import TimetableObjective
from .weekly_loads import WeeklyLoads, weekly_loads_enabled


class CPSATScheduler(COOP1Scheduler):
    def __init__(self, config, *, seed=None):
        super().__init__(config=config, seed=seed, method='COOP1')
        self.time_limit_seconds = 60

    def optimize_with_hybrid_approach(self, progress_callback=None):
        from ortools.sat.python import cp_model

        domains = StaticDomains(self)
        model = cp_model.CpModel()
        choices = []
        teacher_slots, place_slots, course_slots = (defaultdict(list) for _ in range(3))
        teacher_days = defaultdict(list)
        slot_courses = defaultdict(lambda: defaultdict(list))
        teacher_loads = defaultdict(list)
        preference_choices = defaultdict(list)
        weekly = WeeklyLoads(self) if weekly_loads_enabled(self.config) else None

        for i, session in enumerate(self.sessions):
            ci = session['course_idx']
            code = self.courses[ci].get('code')
            options = []
            for j, gene in enumerate(domains.by_course[ci]):
                x = model.new_bool_var(f's{i}_option{j}')
                options.append((x, gene))
                day, slot = gene['day'], gene['slot_id']
                tc, pc = gene['teacher_code'], gene['place_code']
                teacher_slots[(tc, day, slot)].append(x)
                place_slots[(pc, day, slot)].append(x)
                course_slots[(ci, day, slot)].append(x)
                teacher_days[(tc, day)].append(x)
                slot_courses[(day, slot)][code].append(x)
                if weekly:
                    teacher_loads[tc].append(weekly.weights[i] * x)
                for k, (pt, pd, ps, _) in enumerate(self._time_preferences):
                    if tc == pt and day == pd and (ps is None or slot == ps):
                        preference_choices[k].append(x)
            model.add_exactly_one(x for x, _ in options)
            choices.append(options)

        for buckets in (teacher_slots, place_slots, course_slots):
            for variables in buckets.values():
                if len(variables) > 1:
                    model.add_at_most_one(variables)
        for courses in slot_courses.values():
            for first, second in self._conflicting_course_pairs:
                variables = courses.get(first, []) + courses.get(second, [])
                if len(variables) > 1:
                    model.add_at_most_one(variables)

        if weekly:
            for tc, (minimum, maximum) in weekly.bounds.items():
                load = sum(teacher_loads[tc])
                model.add(load >= minimum)
                if maximum is not None:
                    model.add(load <= maximum)

        weights = [Fraction(str(max(0, weight))) for _, _, _, weight in self._time_preferences]
        scale = lcm(*(w.denominator for w in weights)) if weights else 1
        penalties = []
        for (tc, day), variables in teacher_days.items():
            excess = model.new_int_var(0, len(variables), f'excess_{tc}_{day}')
            model.add(excess >= sum(variables) - self.max_classes_per_day)
            penalties.append(scale * excess)
        for k, weight in enumerate(weights):
            if not weight:
                continue
            matches = preference_choices[k]
            if matches:
                satisfied = model.new_bool_var(f'preference_{k}')
                model.add_max_equality(satisfied, matches)
                penalties.append(int(weight * scale) * (1 - satisfied))
            else:
                penalties.append(int(weight * scale))
        model.minimize(sum(penalties))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit_seconds
        solver.parameters.random_seed = self.seed % (2**31 - 1)
        solver.parameters.num_search_workers = 1
        status = solver.solve(model)
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            if status == cp_model.INFEASIBLE:
                raise ValueError('برای داده‌های فعلی هیچ برنامه‌ای با رعایت همه قیود سخت وجود ندارد.')
            raise ValueError('CP-SAT در مهلت تعیین‌شده به پاسخ نرسید؛ زمان حل را افزایش دهید.')

        individual = [next(gene for x, gene in options if solver.value(x)) for options in choices]
        evaluated = TimetableObjective(self).evaluate(individual)
        if evaluated['hard_violations']:
            raise ValueError('پاسخ CP-SAT قیود سخت زمان‌بندی را رعایت نمی‌کند.')
        result = self._build_result(individual, evaluated['soft_penalty'], [], 0)
        result.update(evaluated)
        result.update({
            'algorithm': 'CP-SAT', 'algorithm_version': 1, 'seed': self.seed,
            'objective': list(evaluated['objective']),
            'objective_order': ['hard_violations', 'soft_penalty'],
            'solver_status': solver.status_name(status),
            'solve_time_seconds': solver.wall_time,
            'time_limit_seconds': self.time_limit_seconds,
            'constraint_model': 'weekly-loads-v1' if weekly else None,
        })
        return result
