"""Selective BBO -> refreshed discrete GWO, matching the paper's COOP0.

The default COOP0 path has no repair stage; COOP1 supplies an optional refiner.
Every candidate, even an unchanged one, uses one objective evaluation. The
initial population also uses the budget.
"""

import copy
import math

try:
    from .objective import TimetableObjective
except ImportError:  # direct imports used by older command-line callers
    from objective import TimetableObjective


LEGACY_COST_PARAMETERS = frozenset({
    'teacher_conflict_cost', 'place_conflict_cost', 'capacity_cost',
    'gender_mismatch_cost', 'unavailable_cost', 'max_classes_per_day_cost',
    'same_course_same_slot_cost', 'min_units_cost', 'group_conflict_cost',
    'place_unavailable_cost', 'time_preference_bonus',
})


def validate_parameters(params):
    """Normalize API/legacy task parameters without allowing arbitrary setattr."""
    if not isinstance(params, dict):
        raise ValueError('پارامترهای الگوریتم باید یک شیء JSON باشند.')
    normalized = {}
    integer_limits = {'popsize': 4, 'maxgen': 0, 'max_evaluations': 4, 'seed': 0,
                      'time_limit_seconds': 1}
    for key, value in params.items():
        if key == 'algorithm':
            if value not in ('CP-SAT', 'COOP0', 'COOP-C', 'COOP-D', 'COOP1', 'COOP1-RL'):
                raise ValueError('روش زمان‌بندی نامعتبر است.')
            normalized[key] = value
            continue
        if key not in integer_limits and key not in LEGACY_COST_PARAMETERS:
            raise ValueError(f'پارامتر ناشناخته برای زمان‌بندی: {key}')
        if value is None:
            continue
        if isinstance(value, bool):
            raise ValueError(f'مقدار {key} باید عدد باشد.')
        try:
            if key in integer_limits:
                number = int(value)
                if str(number) != str(value) or number < integer_limits[key]:
                    raise ValueError
                if key == 'seed' and number > 2**53 - 1:
                    raise ValueError
            else:
                number = float(value)
                if not math.isfinite(number) or number < 0:
                    raise ValueError
        except (ValueError, TypeError, OverflowError):
            raise ValueError(f'مقدار نامعتبر برای {key}') from None
        normalized[key] = number
    if normalized.get('algorithm') != 'CP-SAT' and normalized.get('max_evaluations', float('inf')) < normalized.get('popsize', 40):
        raise ValueError('بودجه ارزیابی باید حداقل برابر اندازه جمعیت باشد.')
    return normalized


def run_coop0(s, progress_callback=None, *, refiner=None):
    """Use a fixed evaluation budget, accepting ties as well as improvements."""
    params = validate_parameters({'popsize': s.popsize, 'maxgen': s.maxgen,
                                  'max_evaluations': s.max_evaluations})
    n = params['popsize']
    budget = params.get('max_evaluations', n * (params['maxgen'] + 1))
    evaluator = TimetableObjective(s)
    rng = s._rng
    evaluations, cycles = 0, 0
    best_score, best_individual = None, None
    first_feasible, first_zero = None, None
    objective_trace, legacy_trace = [], []
    stats = {op: {'attempted': 0, 'accepted': 0, 'improved': 0} for op in ('bbo', 'gwo')}

    def score(individual):
        nonlocal evaluations, best_score, best_individual, first_feasible, first_zero
        value = evaluator.evaluate(individual)['objective']
        evaluations += 1
        if best_score is None or value < best_score:
            best_score, best_individual = value, copy.deepcopy(individual)
        if value[0] == 0 and first_feasible is None:
            first_feasible = evaluations
        if value == (0, 0) and first_zero is None:
            first_zero = evaluations
        return value

    def record_progress():
        objective_trace.append({'evaluations': evaluations, 'hard_violations': best_score[0],
                                'soft_penalty': best_score[1]})
        legacy_trace.append(s._fitness(best_individual))
        if progress_callback:
            try:
                # Same three-argument callback; progress is now evaluations/budget.
                progress_callback(evaluations, budget, legacy_trace[-1])
            except Exception:
                pass  # A presentation callback must not abort a search.

    def accept(index, child, operator):
        value = score(child)
        stats.setdefault(operator, {'attempted': 0, 'accepted': 0, 'improved': 0})
        stats[operator]['attempted'] += 1
        if value <= scores[index]:
            stats[operator]['accepted'] += 1
            stats[operator]['improved'] += int(value < scores[index])
            population[index], scores[index] = child, value
        return value

    if s.sessions:
        population = s._init_population()
        scores = [score(individual) for individual in population]
        record_progress()
        while evaluations < budget:
            # Freeze rank and donors for this BBO stage; protect the best two.
            order = sorted(range(n), key=lambda i: scores[i])
            rank = {i: r for r, i in enumerate(order)}
            snapshot = copy.deepcopy(population)
            weights = [1 - rank[i] / (n - 1) for i in range(n)]
            for i in order[2:]:
                if evaluations >= budget:
                    break
                child = copy.deepcopy(population[i])
                fraction = evaluations / budget
                for j in range(len(child)):
                    if rng.random() < .25 * rank[i] / (n - 1):
                        child[j] = copy.deepcopy(rng.choices(snapshot, weights=weights)[0][j])
                    if rng.random() < .05 - .04 * fraction:
                        child[j] = s._random_gene(s.sessions[j])
                accept(i, child, 'bbo')

            # Leaders MUST include accepted BBO changes, not the old snapshot.
            order = sorted(range(n), key=lambda i: scores[i])
            leaders = copy.deepcopy([population[i] for i in order[:3]])
            for i in order[2:]:
                if evaluations >= budget:
                    break
                child = copy.deepcopy(population[i])
                fraction = evaluations / budget
                for j in range(len(child)):
                    if rng.random() < .35 - .20 * fraction:
                        child[j] = copy.deepcopy(rng.choices(leaders, weights=[3, 2, 1])[0][j])
                accept(i, child, 'gwo')
            if refiner is not None and evaluations < budget:
                # Refinement spends the SAME budget through the same acceptance
                # function. With no refiner, COOP0's random stream is unchanged.
                refiner.step(population, scores, accept, lambda: budget - evaluations, budget)
            cycles += 1
            record_progress()
    else:
        # No candidates to search; still report unmet preferences honestly.
        best_individual = []
        best_score = evaluator.evaluate([])['objective']
        record_progress()

    details = evaluator.evaluate(best_individual)
    result = s._build_result(best_individual, legacy_trace[-1], legacy_trace, cycles)
    result.update(details)
    result.update({
        'algorithm': 'COOP0', 'algorithm_version': 1, 'seed': s.seed,
        'objective': list(best_score), 'objective_order': ['hard_violations', 'soft_penalty'],
        'evaluations': evaluations, 'evaluation_budget': budget,
        'cycles_run': cycles, 'objective_convergence': objective_trace,
        'first_feasible_evaluation': first_feasible, 'first_zero_evaluation': first_zero,
        'operator_stats': stats, 'legacy_cost': result['cost'],
        'convergence_metric': 'legacy_cost',
    })
    return result
