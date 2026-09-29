# schadule_new_1405

The scheduling application uses **CP-SAT** by default. It enforces assignment,
room, teacher, group and weekly teaching-load constraints and minimizes daily
excess classes and unmet time preferences. Set a solve-time limit (60 seconds
by default). COOP1, COOP1-RL and COOP0 remain selectable; the COOP methods use
population size and evaluation budget instead. Install the backend dependencies
from `backend/requirements.txt`. See [algorithm details](backend/scheduling/algorithm/README.md).

## Run the corrected S5 example

1. Apply backend migrations: `cd backend`, then `python manage.py migrate`.
2. In the app's benchmark tab, load **S5-W**
   (`seed_05b_large_faculty_weekly_loads`) as a new semester.
3. Run the generated task with **CP-SAT** and a suitable time limit, or select
   **COOP1**, population **40**, evaluation budget **3240**, and seed **1400**
   to reproduce the earlier search result.
4. Check that the result reports **H = 0** and weekly loads included in H.
   Results with known hard or weekly-load violations cannot be finalized.

Original S5 is retained for the conference comparison. Its weekly minima are
infeasible; it must not be used as a strict-feasibility example. S5-W lowers
only P06's minimum to 3 and P11/P12's to 2, preserving all sessions and other
input data. This is a separate, documented fixture, not a silent correction.
No method guarantees feasibility for arbitrary data or random seeds.

## Verification

From `backend`, run `python manage.py test scheduling_module`. Use
`DJANGO_DB=sqlite` for an isolated SQLite test database when PostgreSQL is not
available. The tests include an API-to-database S5-W run, final workload checks,
legacy COOP0 replay, and rejection of inconsistent original S5 inputs.
