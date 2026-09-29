"""Static-feasible assignments and limited, conflict-directed COOP0 refinement.

COOP1 uses cyclic neighborhood selection. COOP1-RL uses an optional per-run
tabular Q-learning controller over the SAME neighborhoods and budget. Neither
implementation reads a reference schedule, imports a trained policy, nor changes
the hard/soft objective. COOP-D and COOP-C are ablations for research.
"""

import copy
from collections import Counter, defaultdict

try:
    from .hybrid_bbo_rl import COOP0Scheduler
    from .coop0 import run_coop0
    from .weekly_loads import WeeklyLoads, weekly_loads_enabled
except ImportError:
    from hybrid_bbo_rl import COOP0Scheduler
    from coop0 import run_coop0
    from weekly_loads import WeeklyLoads, weekly_loads_enabled


METHODS = ('COOP0', 'COOP-C', 'COOP-D', 'COOP1', 'COOP1-RL')


def assignment_key(gene):
    return gene['day'], gene['slot_id'], gene['teacher_code'], gene['place_code']


class StaticDomains:
    """Enumerate unary-feasible assignments once per course, never per candidate."""
    def __init__(self, scheduler):
        self.by_course = {}
        self.keys = {}
        self.checks = 0
        s = scheduler
        for session in s.sessions:
            ci = session['course_idx']
            if ci in self.by_course:
                continue
            course = s.courses[ci]
            teachers = session['allowed_teachers'] or list(s.teacher_by_code)
            values = []
            for day in s.days:
                for slot in s.time_slots:
                    for tc in teachers:
                        teacher = s.teacher_by_code.get(str(tc))
                        if not teacher:
                            continue
                        blocked = set(map(str, teacher.get('unavailable_times') or []))
                        if blocked & {str(day), f"{day}-{slot['id']}", f"{day}_{slot['id']}"}:
                            continue
                        for place in s.places:
                            self.checks += 1
                            pc = place.get('code')
                            if not pc or str(pc) not in s.place_by_code:
                                continue
                            if int(place.get('capacity', 0)) < int(course.get('expected_students', 0)):
                                continue
                            pg, cg = int(place.get('gender', 0)), int(course.get('gender', 0))
                            if pg and cg and pg != cg:
                                continue
                            if course.get('required_place'):
                                if str(pc) != str(course['required_place']):
                                    continue
                            elif course.get('required_place_type') and place.get('place_type') != course['required_place_type']:
                                continue
                            if any(pc == room and day == pd and (ps is None or ps == slot['id'])
                                   for room, pd, ps in s._place_unavailable):
                                continue
                            values.append(dict(day=day, slot_id=slot['id'], start=slot['start'],
                                               end=slot['end'], teacher_code=tc, place_code=pc))
            if not values:
                raise ValueError(f"درس {course.get('code', ci)} هیچ تخصیص مجاز ایستا ندارد؛ "
                                 "ظرفیت، مکان، استاد و زمان‌های مجاز را بررسی کنید.")
            self.by_course[ci] = values
            self.keys[ci] = {assignment_key(g) for g in values}


class QController:
    """Online tabular Q-learning; reinitialized for every search run."""
    alpha, gamma, epsilon = .2, .8, .15

    def __init__(self, rng):
        self.rng = rng
        self.q = defaultdict(dict)
        self.visits = Counter()
        self.updates = 0

    def choose(self, state, actions):
        if self.rng.random() < self.epsilon:
            return self.rng.choice(actions)
        values = self.q[state]
        best = max(values.get(action, 0.0) for action in actions)
        return self.rng.choice([a for a in actions if values.get(a, 0.0) == best])

    def update(self, state, action, reward, next_state, next_actions, terminal=False):
        old = self.q[state].get(action, 0.0)
        future = 0.0 if terminal else max((self.q[next_state].get(a, 0.0) for a in next_actions), default=0.0)
        self.q[state][action] = old + self.alpha * (reward + self.gamma * future - old)
        self.visits[action] += 1
        self.updates += 1

    def report(self):
        return {'type': 'tabular_q_learning', 'alpha': self.alpha, 'gamma': self.gamma,
                'epsilon': self.epsilon, 'updates': self.updates,
                'action_visits': dict(self.visits),
                'q_table': {','.join(map(str, state)): dict(values) for state, values in self.q.items()}}


class TargetedRefiner:
    """At most eight scored proposals per cycle, near feasibility or on stagnation."""
    actions = ('relocate', 'room', 'swap')

    def __init__(self, scheduler, domains, learning=False):
        self.s, self.domains, self.rng = scheduler, domains, scheduler._rng
        self.controller = QController(self.rng) if learning else None
        self.previous = None
        self.stale = 0
        self.cursor = 0
        self.events = []
        self.weekly = WeeklyLoads(scheduler) if weekly_loads_enabled(scheduler.config) else None
        if self.weekly:
            self.actions = ('relocate', 'teacher', 'room', 'swap')

    def contributions(self, individual, score):
        s = self.s
        blame = [0] * len(individual)
        rooms = [0] * len(individual)
        by_teacher, by_room, by_course, by_slot, by_day = (defaultdict(list) for _ in range(5))
        for i, (g, session) in enumerate(zip(individual, s.sessions)):
            day, slot, tc, pc = assignment_key(g)
            by_teacher[(tc, day, slot)].append(i)
            by_room[(pc, day, slot)].append(i)
            by_course[(session['course_idx'], day, slot)].append(i)
            by_slot[(day, slot)].append(i)
            by_day[(tc, day)].append(i)
        for groups in (by_teacher, by_room, by_course):
            for ids in groups.values():
                if len(ids) > 1:
                    for i in ids:
                        blame[i] += len(ids)-1
                        if groups is by_room:
                            rooms[i] += len(ids)-1
        for ids in by_slot.values():
            for k, i in enumerate(ids):
                first = s.courses[s.sessions[i]['course_idx']].get('code')
                for j in ids[k+1:]:
                    second = s.courses[s.sessions[j]['course_idx']].get('code')
                    if tuple(sorted((first, second))) in s._conflicting_course_pairs:
                        blame[i] += 1
                        blame[j] += 1
        if self.weekly:
            loads = self.weekly.loads(individual)
            for tc,(minimum,maximum) in self.weekly.bounds.items():
                if loads[tc] < minimum:
                    for i,session in enumerate(s.sessions):
                        if individual[i]['teacher_code'] != tc and (not session['allowed_teachers'] or tc in session['allowed_teachers']):
                            blame[i] += (minimum-loads[tc])/self.weekly.scale
                if maximum is not None and loads[tc] > maximum:
                    for i,g in enumerate(individual):
                        if g['teacher_code'] == tc:
                            blame[i] += (loads[tc]-maximum)/self.weekly.scale
        if score[0] == 0:
            for ids in by_day.values():
                if len(ids) > s.max_classes_per_day:
                    for i in ids:
                        blame[i] += len(ids)-s.max_classes_per_day
            for tc, day, slot, weight in s._time_preferences:
                if weight <= 0 or any(g['teacher_code'] == tc and g['day'] == day
                                      and (slot is None or g['slot_id'] == slot) for g in individual):
                    continue
                for i, session in enumerate(s.sessions):
                    if not session['allowed_teachers'] or tc in session['allowed_teachers']:
                        blame[i] += weight
        return blame, rooms

    def neighborhoods(self, individual, score):
        blame, room_blame = self.contributions(individual, score)
        top = max(blame)
        i = self.rng.choice([j for j, value in enumerate(blame) if value == top])
        ci = self.s.sessions[i]['course_idx']
        current = individual[i]
        options = self.domains.by_course[ci]
        # Construct proposals using only static membership checks, not hidden
        # full-objective evaluations. All tested complete schedules spend budget.
        candidates = {'relocate': [(i, g) for g in options if assignment_key(g) != assignment_key(current)]}
        if self.weekly:
            candidates['teacher'] = [(i,g) for g in options if g['day']==current['day']
                and g['slot_id']==current['slot_id'] and g['place_code']==current['place_code']
                and g['teacher_code']!=current['teacher_code']]
        room_options = [(i, g) for g in options if g['day'] == current['day']
                        and g['slot_id'] == current['slot_id'] and g['teacher_code'] == current['teacher_code']
                        and g['place_code'] != current['place_code']]
        if room_blame[i] and room_options:
            candidates['room'] = room_options
        swaps = []
        for j, other in enumerate(individual):
            if i == j or (current['day'], current['slot_id']) == (other['day'], other['slot_id']):
                continue
            gi, gj = dict(current), dict(other)
            for key in ('day', 'slot_id', 'start', 'end'):
                gi[key], gj[key] = other[key], current[key]
            cj = self.s.sessions[j]['course_idx']
            if assignment_key(gi) in self.domains.keys[ci] and assignment_key(gj) in self.domains.keys[cj]:
                swaps.append((i, gi, j, gj))
        if swaps:
            candidates['swap'] = swaps
        return {a: proposals for a, proposals in candidates.items() if proposals}

    @staticmethod
    def state(score, remaining, budget):
        return min(int(score[0]), 3), int(score[1] > 0), int(remaining <= budget/2)

    def step(self, population, scores, accept, remaining, budget):
        index = min(range(len(population)), key=lambda i: scores[i])
        before = scores[index]
        self.stale = 0 if self.previous is None or before < self.previous else self.stale + 1
        self.previous = before
        if before == (0, 0) or (before[0] > 2 and self.stale < 2) or (before[0] == 0 and self.stale < 2):
            return
        neighborhoods = self.neighborhoods(population[index], before)
        if not neighborhoods:
            return
        available = list(neighborhoods)
        state = self.state(before, remaining(), budget)
        if self.controller:
            action = self.controller.choose(state, available)
        else:
            action = next(self.actions[(self.cursor+k) % len(self.actions)]
                          for k in range(len(self.actions)) if self.actions[(self.cursor+k) % len(self.actions)] in available)
            self.cursor = (self.actions.index(action)+1) % len(self.actions)
        proposals = neighborhoods[action]
        selected = self.rng.sample(proposals, min(8, len(proposals), remaining()))
        # Freeze the parent for this neighborhood so a rejected swap cannot
        # accidentally inherit assignments from a previously accepted proposal.
        parent = copy.deepcopy(population[index])
        for proposal in selected:
            if remaining() <= 0:
                break
            child = copy.deepcopy(parent)
            i, gi = proposal[:2]
            child[i] = dict(gi)
            if len(proposal) == 4:
                j, gj = proposal[2:]
                child[j] = dict(gj)
            accept(index, child, 'repair_' + action)
        after = scores[index]
        spent = len(selected)
        if self.controller:
            if after[0] < before[0]:
                gain = 1 + (before[0]-after[0])/max(1, before[0])
            elif after[1] < before[1]:
                gain = .5*(before[1]-after[1])/(1+before[1])
            else:
                gain = -.02
            next_state = self.state(after, remaining(), budget)
            # The next eligible action mask is observed at the updated state.
            next_actions = list(self.neighborhoods(population[index], after)) if after != (0,0) and remaining() else []
            self.controller.update(state, action, gain/max(1,spent), next_state, next_actions,
                                   terminal=after == (0,0) or remaining() == 0)
        self.events.append({'evaluations':budget-remaining(), 'action':action, 'candidates':spent,
                            'before':list(before), 'after':list(after)})
        self.previous = min(scores)


class COOP1Scheduler(COOP0Scheduler):
    def _build_sessions(self):
        # The legacy constructor clips impossible course counts. Improved methods
        # must reject such inputs rather than silently report a partial timetable.
        for course in self.courses:
            count = int(course.get('sessions') or max(1, int(course.get('units', 1) or 1)))
            if count < 1 or count > len(self.days) * len(self.time_slots):
                raise ValueError(f"تعداد جلسات درس {course.get('code')} با زمان‌های موجود سازگار نیست.")
        return super()._build_sessions()

    def __init__(self, *args, method='COOP1', **kwargs):
        if method not in METHODS[1:]:
            raise ValueError(f'Unknown improved method: {method}')
        super().__init__(*args, **kwargs)
        self.method = method
        self.domains = None

    def _candidate_places(self, course):
        # Used only by the capacity-only ablation. No fallback to undersized rooms.
        return [p for p in super()._candidate_places(course)
                if int(p.get('capacity', 0)) >= int(course.get('expected_students', 0))]

    def _random_gene(self, session):
        if self.domains is None:
            return super()._random_gene(session)
        return dict(self._rng.choice(self.domains.by_course[session['course_idx']]))

    def optimize_with_hybrid_approach(self, progress_callback=None):
        if self.method != 'COOP-C':
            self.domains = StaticDomains(self)
        refiner = TargetedRefiner(self, self.domains, self.method == 'COOP1-RL') if self.method in ('COOP1','COOP1-RL') else None
        result = run_coop0(self, progress_callback, refiner=refiner)
        result['algorithm'] = self.method
        result['algorithm_version'] = 2 if weekly_loads_enabled(self.config) else 1
        result['static_domain_checks'] = self.domains.checks if self.domains else 0
        result['domain_sizes'] = {str(self.courses[ci].get('code',ci)):len(values)
                                  for ci,values in self.domains.by_course.items()} if self.domains else {}
        result['refinement_events'] = refiner.events if refiner else []
        result['learning'] = refiner.controller.report() if refiner and refiner.controller else None
        return result


def build_search_scheduler(config, *, seed=None, method='COOP1'):
    if method == 'CP-SAT':
        from .cp_sat import CPSATScheduler
        return CPSATScheduler(config=config, seed=seed)
    if method == 'COOP0':
        return COOP0Scheduler(config=config, seed=seed)
    return COOP1Scheduler(config=config, seed=seed, method=method)
