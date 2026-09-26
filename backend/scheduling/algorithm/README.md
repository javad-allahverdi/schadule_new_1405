# COOP0 scheduling

All automatic scheduling tasks now call COOP0. `COOP0Scheduler` and the historical
`HybridBBO_RL_Scheduler` name resolve to the same implementation. There is no RL.

## Exact cooperation

One individual stores a complete (day, slot, teacher, room) assignment per session.
Initialization and random mutation use the existing generator, including its room
type/required-room selection. No capacity-aware generator or repair stage is added.

With `u = evaluations / budget`, each cycle performs:

1. Sort by `(H, S)` and protect the best two. Freeze the population and ranks for
   BBO donors. For each remaining parent, copy each gene with probability
   `0.25 * rank / (N - 1)` from a donor weighted by `1 - donor_rank / (N - 1)`.
   Independently regenerate each gene with probability `0.05 - 0.04*u`.
2. Evaluate each child and replace its parent only if `(H_child, S_child) <=
   (H_parent, S_parent)`. Equal-quality changes are permitted.
3. Re-rank the **accepted BBO population** and freeze the three best leaders.
   Protect the best two. Copy each remaining individual's genes with probability
   `0.35 - 0.20*u`, choosing leaders with weights `3:2:1`; otherwise retain the gene.
   Evaluate and apply the same acceptance rule.
4. Repeat until the exact budget is spent, including a partially completed stage.
   Return the best historical individual, updating it only on strict improvements.

`u` is evaluated once per child. GWO is a discrete leader-copy operator inspired
by GWO, not the original continuous position equation.

## Objective and limitations

`H` counts invalid day/slot, missing or ineligible teacher, teacher unavailability,
missing room, capacity, gender, required room/type, room unavailability, teacher/
room/same-course collisions, and student-group conflicts. Collision groups count
`size - 1`; student-group conflicts count unordered pairs of sessions. Reporting
also counts missing and extra sessions. `S` is excess teacher classes per day plus
the sum of nonnegative unmet time-preference weights (each preference once).

Any lower `H` wins regardless of `S`. `feasible` means `H == 0` **for these evaluated
constraints**. Weekly teacher unit bounds, prerequisite/corequisite ordering,
fixed-session assignments, and arbitrary custom constraint types are not added by
this implementation. COOP0 does not guarantee a feasible or optimal solution.

## Parameters and output compatibility

```python
from scheduling.algorithm.hybrid_bbo_rl import COOP0Scheduler

scheduler = COOP0Scheduler(config=config, seed=1400)
scheduler.popsize = 40
scheduler.max_evaluations = 3240
result = scheduler.optimize_with_hybrid_approach()
print(result['objective'], result['feasible'])
```

API `algorithm_params` accepts `popsize` (integer >= 4), `max_evaluations` (integer
>= population), and `seed` (integer 0 through 2^53-1). Omitting seed generates and
records one. Existing `maxgen` remains supported as a budget multiplier:
`budget = popsize * (maxgen + 1)`; explicit `max_evaluations` takes precedence.
Defaults are 40 and 80, giving 3240 evaluations. Initialization counts toward the
budget; reaching `(0,0)` does not stop early. Empty problems use zero evaluations.
Existing saved tasks also run COOP0 on their next execution; old results stay as
stored until explicitly rerun. No database migration is required.

New result fields include `algorithm`, `algorithm_version`, `seed`, `objective`,
`hard_violations`, `soft_penalty`, `feasible`, `violations`, `evaluations`,
`evaluation_budget`, `objective_convergence`, `operator_stats`, and `cycles_run`.
`generations_run` is retained as an alias for the number of COOP0 cycles, including
a final partial cycle; it is not the old generation count. Callbacks receive
`(evaluations, budget, legacy_cost)`.

`cost`, `total_cost`, and `convergence` retain the **old weighted metric** for
compatibility. Legacy cost weights affect only these reports, not optimization.
A zero legacy cost does not prove feasibility; use `hard_violations`/`feasible`.
The weighted trace can increase while `(H,S)` improves. The UI reports H and S.
`total_violations` in comparison reports retains hard + daily excess for older
consumers; `hard_violations` excludes that soft term.

## Validation

From `backend`, with a test SQLite database:

```powershell
$env:DJANGO_DB = 'sqlite'
python manage.py test scheduling_module --noinput
```

Tests cover acceptance, refreshed leaders, budget boundaries, objective priority,
constraint counts, reproducible seeds, API validation, persistence and reruns.
Five golden schedule hashes come from the independent paper experiments with
seed 1400, population 40 and budget 3240. The implementation was also replayed
against all 50 recorded COOP0 runs (five instances, seeds 1400–1409): all complete
schedules, H/S values and evaluation counts matched exactly.
