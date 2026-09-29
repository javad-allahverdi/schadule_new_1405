"""Diagnostics for weekly load fields outside the conference H/S objective.

This audit does not change search or classify these fields as hard constraints.
Course units are divided equally over its requested sessions for assigned load.
An eligibility upper bound below a minimum proves the stricter input infeasible;
passing this necessary check does not prove that the stricter model is feasible.
"""
from collections import defaultdict
from fractions import Fraction


def audit_weekly_loads(config, entries):
    courses = {str(c['code']): c for c in config.get('courses', [])}
    assigned = defaultdict(Fraction)
    for entry in entries:
        course = courses.get(str(entry.get('course_code')))
        if course is None:
            continue
        units = Fraction(str(course.get('units', 1)))
        sessions = int(course.get('sessions') or max(1, int(units)))
        if sessions > 0:
            assigned[str(entry.get('teacher_code'))] += units / sessions
    teachers = []
    impossible = []
    for teacher in config.get('teachers', []):
        tc = str(teacher['code'])
        minimum = max(0, Fraction(str(teacher.get('min_units', 0) or 0)))
        maximum = teacher.get('max_units')
        maximum = Fraction(str(maximum)) if maximum is not None else None
        available = sum(Fraction(str(c.get('units', 1))) for c in courses.values()
                        if not c.get('teachers') or tc in [str(t).strip() for t in c['teachers']])
        deficit = max(0, minimum - assigned[tc])
        excess = max(0, assigned[tc] - maximum) if maximum is not None else 0
        # Compare exact values before converting JSON report fields. Repeated
        # fractional sessions must not create a false deficit or approval block.
        row = {'teacher_code': tc, 'minimum_units': float(minimum),
               'maximum_units': float(maximum) if maximum is not None else None,
               'assigned_units': float(assigned[tc]), 'eligible_units_upper_bound': float(available),
               'minimum_deficit': float(deficit), 'maximum_excess': float(excess)}
        teachers.append(row)
        if available < minimum:
            impossible.append({'teacher_code': tc, 'minimum_units': float(minimum),
                               'eligible_units_upper_bound': float(available)})
    included = any(c.get('type') == 'teacher_weekly_load' for c in config.get('constraints', []))
    return {'included_in_H': included, 'teachers': teachers,
            'minimum_deficit_units': sum(t['minimum_deficit'] for t in teachers),
            'maximum_excess_units': sum(t['maximum_excess'] for t in teachers),
            'stricter_model_proven_infeasible': bool(impossible),
            'infeasibility_witnesses': impossible}
