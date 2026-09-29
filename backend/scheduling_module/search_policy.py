"""Application defaults, kept separate from the frozen research algorithms."""
from copy import deepcopy

from scheduling.algorithm.coop0 import validate_parameters


def application_parameters(params):
    """Unspecified methods use CP-SAT, including uploads and older pending tasks."""
    normalized = validate_parameters(params)
    normalized.setdefault('algorithm', 'CP-SAT')
    return normalized


def application_config(config, method):
    """Enforce weekly bounds in revised app runs without editing the input data."""
    config = deepcopy(config)
    if method in ('CP-SAT', 'COOP1', 'COOP1-RL'):
        constraints = config.setdefault('constraints', [])
        if not any(c.get('type') == 'teacher_weekly_load' for c in constraints):
            constraints.append({'type': 'teacher_weekly_load', 'parameters': {}})
    return config


def require_consistent_weekly_minima(config):
    """Fail on a proven eligibility shortfall; this is only a necessary check."""
    from scheduling.algorithm.model_audit import audit_weekly_loads

    audit = audit_weekly_loads(config, [])
    if audit['included_in_H'] and audit['stricter_model_proven_infeasible']:
        detail = '؛ '.join(
            f"{w['teacher_code']}: حداقل {w['minimum_units']:g}، واحد مجاز حداکثر {w['eligible_units_upper_bound']:g}"
            for w in audit['infeasibility_witnesses']
        )
        raise ValueError(
            'داده‌های ورودی با حداقل بار هفتگی استادان ناسازگارند. '
            + detail + '. داده‌ها را اصلاح کنید؛ برای آزمون S5، مجموعه جداگانه S5-W را بارگذاری کنید.'
        )
