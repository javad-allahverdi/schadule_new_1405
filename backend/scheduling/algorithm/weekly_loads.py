"""Exact weekly teaching-unit accounting for the opt-in journal model."""
from collections import Counter
from fractions import Fraction
from math import lcm


def weekly_loads_enabled(config):
    return any(c.get('type') == 'teacher_weekly_load' for c in config.get('constraints', []))


class WeeklyLoads:
    def __init__(self, scheduler):
        self.s = scheduler
        counts = Counter(s['course_idx'] for s in scheduler.sessions)
        weights = [Fraction(str(scheduler.courses[s['course_idx']].get('units', 1))) / counts[s['course_idx']]
                   for s in scheduler.sessions]
        bounds = {}
        for tc, teacher in scheduler.teacher_by_code.items():
            low = Fraction(str(teacher.get('min_units', 0) or 0))
            high = teacher.get('max_units')
            high = Fraction(str(high)) if high is not None else None
            if low < 0 or (high is not None and (high < low or high < 0)):
                raise ValueError(f'حداقل/حداکثر واحد هفتگی استاد {tc} معتبر نیست.')
            bounds[tc] = (low, high)
        numbers = weights + [v for limits in bounds.values() for v in limits if v is not None]
        self.scale = lcm(*(v.denominator for v in numbers)) if numbers else 1
        self.weights = [int(w * self.scale) for w in weights]
        self.bounds = {tc:(int(lo*self.scale),int(hi*self.scale) if hi is not None else None)
                       for tc,(lo,hi) in bounds.items()}

    def loads(self, individual):
        loads = Counter()
        for gene, weight in zip(individual, self.weights):
            if gene is not None:
                loads[str(gene.get('teacher_code'))] += weight
        return loads

    def violations(self, loads):
        low = sum(max(0,minimum-loads[tc]) for tc,(minimum,_) in self.bounds.items())
        high = sum(max(0,loads[tc]-maximum) for tc,(_,maximum) in self.bounds.items() if maximum is not None)
        return low / self.scale, high / self.scale
