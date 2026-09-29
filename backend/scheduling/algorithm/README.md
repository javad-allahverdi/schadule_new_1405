# Cooperative BBO/GWO scheduling

All application entry points default to **COOP1**, including API requests with
missing/empty parameters, Excel uploads and untagged pending tasks. Users can
choose **COOP1-RL** (experimental online operator selection) or **COOP0** (the
conference baseline). An explicit `algorithm: "COOP0"` preserves that baseline.
`COOP0Scheduler` and the historical `HybridBBO_RL_Scheduler` name still
resolve to the unchanged baseline; the historical name itself does not add RL.

## COOP1 and the optional RL controller

`coop1.build_search_scheduler(config, seed=1400, method='COOP1')` constructs the
improved solver. Set `popsize` and `max_evaluations` as in the example below.
API parameters are `{"algorithm":"COOP1","popsize":40,"max_evaluations":3240,"seed":1400}`.

COOP1 retains COOP0's BBO stage, refreshed GWO leaders, non-worsening acceptance,
and lexicographic `(H,S)` objective. It adds:

1. **Static domains:** initialization and mutation draw only assignments satisfying
   teacher eligibility/availability, enabled day/slot, room capacity/gender,
   required room/type, and room availability. Domains are precomputed per course;
   an empty domain raises an input error. Impossible session counts are rejected
   instead of silently clipped. Collisions between sessions still require search.
2. **Limited targeted refinement:** after a BBO/GWO cycle, select the current best
   individual and one of its sessions with the largest conflict contribution.
   With `H=0`, target daily overload or missed preferences. Ties are random.
   Run at `H=1` or `H=2`, or after two cycles without a best-score improvement;
   skip refinement at `(0,0)`. Score at most eight proposals in one neighborhood.
   Neighborhoods are full relocation, room-only replacement for room collisions,
   and a two-session time swap with both assignments statically valid. Room and
   teacher remain attached to their sessions in a time swap. Each batch starts
   from a frozen parent; acceptance compares to the latest accepted parent.
3. **Shared budget:** every refinement proposal spends one evaluation from the
   same budget as BBO/GWO. Domain enumeration and conflict attribution are extra
   preprocessing/diagnostic work, reported separately from full candidate scores.
   No reference schedule is read by the search.

COOP1 selects available neighborhoods cyclically (relocate, room, swap).
COOP1-RL replaces ONLY that selector with per-run tabular Q-learning; no pretrained
policy or cross-run learning is used. State is `(min(H,3), S>0, budget_remaining<=B/2)`.
Epsilon-greedy selection uses `epsilon=.15`; `alpha=.2`, `gamma=.8`.
The batch reward is `gain / number_of_scored_proposals`, where gain is
`1 + delta_H/max(1,H_before)` for a hard improvement,
`.5*delta_S/(1+S_before)` for a soft improvement, and `-.02` otherwise.
The update is `Q += alpha*(reward + gamma*max_available_Q_next - Q)`;
future value is zero at `(0,0)` or budget exhaustion. The next action mask is
observed from an eligible target at the updated best individual. This coarse
state omits the complete timetable, so this is heuristic operator control, not
a proof of a Markov model or an optimal learned policy.

Results additionally store `static_domain_checks`, `domain_sizes`,
`refinement_events`, and `learning` (Q table, update count, action counts and
hyperparameters). `COOP-C` (capacity-only generator) and `COOP-D` (all static
domains, no refinement) are available through the API/CLI as research ablations.
Neither improved method guarantees feasibility on arbitrary inputs or seeds.

```powershell
python -m scheduling_module.benchmarks.run_benchmark seed_05_large_faculty --algorithm COOP1 --max-evaluations 3240 --repeats 10
```

## Exact COOP0 cooperation (preserved baseline)

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
constraints**. The conference model excludes weekly teacher unit bounds. The
journal model enables them with a `teacher_weekly_load` constraint, described
below. Prerequisite/corequisite ordering, fixed-session assignments and arbitrary
custom types are not implemented. Time conflicts use day/slot IDs, not arbitrary interval
overlap. COOP0, COOP1 and COOP1-RL do not guarantee a feasible or optimal solution.

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
Existing saved tasks without an explicit `algorithm` use COOP1 on their next
execution; saved results are not rewritten. The runner records the selected
method. Apply migration `0005_teacher_weekly_load_constraint` as described below.

New result fields include `algorithm`, `algorithm_version`, `seed`, `objective`,
`hard_violations`, `soft_penalty`, `feasible`, `violations`, `evaluations`,
`evaluation_budget`, `objective_convergence`, `operator_stats`, and `cycles_run`.
`generations_run` is retained as an alias for the number of COOP0 cycles, including
a final partial cycle; it is not the old generation count. Callbacks receive
`(evaluations, budget, legacy_cost)`.

The application policy automatically includes weekly minimum and maximum units
in H for COOP1 and COOP1-RL, for both uploaded and database configurations. It
copies the configuration and does not edit the semester or teacher data. The
research algorithms remain unchanged: direct research calls use the model in
their input. An explicit COOP0 app run uses its input model for baseline replay.

Before search, the app rejects a proven teacher eligibility/minimum shortfall
with the affected teacher codes. Passing this necessary check does not prove
feasibility. Original S5 fails it: P06, P11 and P12 require four units but each
has only three eligible units. Use the separately corrected S5-W below; the app
never silently relaxes original S5. After search the serialized schedule is
re-evaluated, and `weekly_load_audit` reports each teacher's loads. Known hard
or weekly-load violations prevent final approval. Benchmark comparisons apply
the saved run's weekly model to both schedules.

## Journal model and the separate S5-W dataset

The benchmark `seed_05b_large_faculty_weekly_loads` is a separately labeled S5
correction. P06's minimum becomes 3; P11 and P12 become 2. Other minima, all
maxima, course/session counts, eligibility, rooms and times remain unchanged.
This is the minimum total reduction of five units with eligibility unchanged:
P03/P11 demand 8 units from only 6 eligible units, and P06/P12 demand 8 from 5.
The teacher subsets are disjoint, so at least 2+3 units must be removed from
the combined minimum requirements. The corrected instance has a verified
complete (H,S)=(0,0) timetable, generated without a reference schedule.

An active `teacher_weekly_load` constraint enables the new hard objective for
ALL methods, including baseline COOP0:

`H_journal = H_conference + sum(max(0, minimum-load)) + sum(max(0, load-maximum))`.

Course units are divided equally among requested sessions. `weekly_loads.py`
uses exact scaled integer accounting before reporting unit totals. The result
records `constraint_model='weekly-loads-v1'` and `weekly_teacher_loads`; COOP1
variants report algorithm version 2 for this model. Their targeted repair adds
weekly imbalance contributions and a teacher-only reassignment neighborhood.
The cyclic order becomes relocate, teacher, room, swap. Q-learning controls the
same available neighborhoods, with the same parameters and shared budget.

The S5-W study uses 10 development seeds (1400–1409) and 30 fresh seeds
(3400–3429), with population 40 and budget 3240. Fresh-seed hard-feasible counts
are COOP0 0/30, COOP-C 23/30, COOP-D 19/30, COOP1 30/30, COOP1-RL 30/30.
COOP1 reaches (0,0) in 20/30, versus 16/30 for RL. These are repeated random
seeds on one corrected instance, not external-benchmark validation or a proof
of guaranteed feasibility. Original-model runs are separate and not pooled.

Load S5-W in the benchmark UI; its weekly constraint persists in the database
and is used in comparisons and exports. Migration `0005_teacher_weekly_load_constraint`
adds the constraint choice. Apply deployment migrations with
`python manage.py migrate` before using the updated application.
Exact schedule replay requires the same ordered JSON input; database relation
ordering may produce another feasible schedule with the same random seed.

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
