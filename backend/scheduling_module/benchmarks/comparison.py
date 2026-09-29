# -*- coding: utf-8 -*-
"""
مقایسه‌ی خروجی الگوریتم با «پاسخ مرجع» (ground truth) یک seed.

--------------------------------------------------------------------------
چرا مقایسه‌ی ساده‌ی سطر به سطر غلط است؟
--------------------------------------------------------------------------
۱) جلسات یک درس با هم قابل جابه‌جایی‌اند: اگر پاسخ مرجع دو جلسه‌ی «ریاضی ۱» را
   شنبه‌بازه‌۱ و دوشنبه‌بازه‌۳ گذاشته باشد و الگوریتم همان دو را جابه‌جا تولید کند،
   جدول‌ها دقیقاً یکی هستند. بنابراین برای هر درس، «بهترین تطابق ممکن» بین
   جلسات پاسخ مرجع و جلسات خروجی محاسبه می‌شود (تخصیص بهینه).

۲) مسئله‌ی زمان‌بندی چند جواب بهینه دارد. پاسخ مرجع فقط «یکی» از جواب‌های
   بدون تخلف است، نه تنها جواب درست. پس گزارش دو بخش مستقل دارد:
       - «میزان انطباق» با همان جواب مرجع (چند درصد از جلسات مثل مرجع چیده شده)
       - «کیفیت» مستقل از مرجع (تعداد تخلف‌ها و هزینه‌ی خروجی در برابر مرجع)
   داوری نهایی بر اساس بخش دوم انجام می‌شود؛ بخش اول صرفاً برای نمایش شباهت است.
"""

from itertools import permutations

from .config_builder import seed_to_algorithm_config
from .evaluation import algorithm_cost, evaluate_entries

# وزن مؤلفه‌های تطابق در تخصیص بهینه‌ی جلسات یک درس
W_TIME = 100    # هم روز و هم بازه یکی است
W_DAY = 20      # فقط روز یکی است
W_TEACHER = 15
W_PLACE = 10

_BRUTE_FORCE_LIMIT = 7   # تا این تعداد جلسه در یک درس، تخصیص بهینه‌ی کامل


def _pair_score(target_entry, produced_entry):
    """امتیاز تطابق یک جفت جلسه (هرچه بیشتر، شبیه‌تر)."""
    same_day = target_entry.get('day') == produced_entry.get('day')
    same_slot = target_entry.get('slot_id') == produced_entry.get('slot_id')

    score = 0
    if same_day and same_slot:
        score += W_TIME
    elif same_day:
        score += W_DAY
    if target_entry.get('teacher_code') == produced_entry.get('teacher_code'):
        score += W_TEACHER
    if target_entry.get('place_code') == produced_entry.get('place_code'):
        score += W_PLACE
    return score


def _best_pairing(target_entries, produced_entries):
    """
    بهترین تناظر یک‌به‌یک بین جلسات مرجع و جلسات خروجیِ یک درس.
    خروجی: لیست تاپل‌های (target_entry|None, produced_entry|None)
    """
    n_t, n_p = len(target_entries), len(produced_entries)
    n = max(n_t, n_p)

    if n == 0:
        return []

    if n <= _BRUTE_FORCE_LIMIT:
        best_perm, best_total = None, -1
        for perm in permutations(range(n)):
            total = 0
            for t_idx, p_idx in enumerate(perm):
                if t_idx < n_t and p_idx < n_p:
                    total += _pair_score(target_entries[t_idx], produced_entries[p_idx])
            if total > best_total:
                best_total, best_perm = total, perm
        pairing = best_perm
    else:
        # حریصانه: جفت‌ها را بر اساس امتیاز نزولی انتخاب می‌کنیم
        candidates = sorted(
            ((_pair_score(t, p), t_idx, p_idx)
             for t_idx, t in enumerate(target_entries)
             for p_idx, p in enumerate(produced_entries)),
            key=lambda x: -x[0],
        )
        used_t, used_p = set(), set()
        mapping = {}
        for _score, t_idx, p_idx in candidates:
            if t_idx in used_t or p_idx in used_p:
                continue
            mapping[t_idx] = p_idx
            used_t.add(t_idx)
            used_p.add(p_idx)
        free_p = [i for i in range(n) if i not in used_p]
        pairing = []
        for t_idx in range(n):
            if t_idx in mapping:
                pairing.append(mapping[t_idx])
            else:
                pairing.append(free_p.pop(0) if free_p else n)

    result = []
    for t_idx, p_idx in enumerate(pairing):
        target = target_entries[t_idx] if t_idx < n_t else None
        produced = produced_entries[p_idx] if p_idx < n_p else None
        if target is None and produced is None:
            continue
        result.append((target, produced))
    return result


def _row(target, produced, course_name):
    """یک سطر مقایسه برای نمایش در جدول رابط کاربری."""
    matched = {'day': False, 'slot': False, 'time': False,
               'teacher': False, 'place': False, 'exact': False}

    if target and produced:
        matched['day'] = target.get('day') == produced.get('day')
        matched['slot'] = target.get('slot_id') == produced.get('slot_id')
        matched['time'] = matched['day'] and matched['slot']
        matched['teacher'] = target.get('teacher_code') == produced.get('teacher_code')
        matched['place'] = target.get('place_code') == produced.get('place_code')
        matched['exact'] = matched['time'] and matched['teacher'] and matched['place']

    def _side(entry):
        if not entry:
            return None
        return {
            'day': entry.get('day'),
            'slot_id': entry.get('slot_id'),
            'start': entry.get('start'),
            'end': entry.get('end'),
            'teacher_code': entry.get('teacher_code'),
            'place_code': entry.get('place_code'),
        }

    return {
        'course_name': course_name,
        'target': _side(target),
        'produced': _side(produced),
        'matched': matched,
        'status': ('exact' if matched['exact']
                   else 'missing' if produced is None
                   else 'extra' if target is None
                   else 'different'),
    }


def _percent(part, whole):
    return round(100.0 * part / whole, 1) if whole else 0.0


def _distribution(entries, keys, key_func):
    """شمارش تعداد جلسات به ازای هر کلید (روز، استاد، مکان و ...)."""
    counts = {k: 0 for k in keys}
    for entry in entries:
        k = key_func(entry)
        if k in counts:
            counts[k] += 1
        else:
            counts[k] = 1
    return counts


def _structure_report(seed, target_entries, produced_entries):
    """
    مقایسه‌ی «ساختاری»: صرف‌نظر از این‌که کدام درس کجا رفته، آیا بار کاری روی
    روزها، اساتید و مکان‌ها مثل پاسخ مرجع توزیع شده است؟

    این معیار برای ارائه گویاتر از «انطباق سطر به سطر» است، چون دو جواب بهینه‌ی
    متفاوت معمولاً توزیع بار مشابهی دارند حتی وقتی هیچ جلسه‌ای دقیقاً یکی نیست.
    """
    days = [d['name'] for d in seed['settings']['days_of_week'] if d.get('enabled', True)]
    slot_ids = [s['id'] for s in seed['settings']['time_slots'] if s.get('enabled', True)]
    teacher_codes = [t['code'] for t in seed['teachers']]
    place_codes = [p['code'] for p in seed['places']]

    def block(keys, key_func, labels=None):
        t_counts = _distribution(target_entries, keys, key_func)
        p_counts = _distribution(produced_entries, keys, key_func)
        all_keys = list(dict.fromkeys(list(keys) + list(p_counts.keys())))
        total_diff = sum(abs(t_counts.get(k, 0) - p_counts.get(k, 0)) for k in all_keys)
        # شباهت: ۱ منهای نصفِ فاصله‌ی L1 نسبت به تعداد کل جلسات (بین ۰ و ۱)
        denominator = max(1, len(target_entries) + len(produced_entries))
        similarity = round(100.0 * (1 - total_diff / denominator), 1)
        return {
            'keys': all_keys,
            'labels': labels or {k: k for k in all_keys},
            'target': [t_counts.get(k, 0) for k in all_keys],
            'produced': [p_counts.get(k, 0) for k in all_keys],
            'similarity_percent': max(0.0, similarity),
        }

    teacher_labels = {t['code']: t['full_name'] for t in seed['teachers']}
    place_labels = {p['code']: p['name'] for p in seed['places']}

    return {
        'by_day': block(days, lambda e: e.get('day')),
        'by_slot': block(slot_ids, lambda e: e.get('slot_id'),
                         labels={s['id']: f"{s['start']}-{s['end']}"
                                 for s in seed['settings']['time_slots']}),
        'by_teacher': block(teacher_codes, lambda e: e.get('teacher_code'),
                            labels=teacher_labels),
        'by_place': block(place_codes, lambda e: e.get('place_code'),
                          labels=place_labels),
    }


def compare_with_target(seed, produced_entries, *, weekly_loads=False):
    """
    مقایسه‌ی کامل خروجی الگوریتم با پاسخ مرجع یک seed.

    produced_entries: لیست جلسات خروجی الگوریتم
                      (همان ساختار ScheduleResult.schedule_data['courses'])
    """
    target_entries = seed['target']['entries']
    config = seed_to_algorithm_config(seed)
    if weekly_loads:
        from scheduling_module.search_policy import application_config
        config = application_config(config, 'COOP1')

    course_names = {c['code']: c['name'] for c in seed['courses']}
    teacher_names = {t['code']: t['full_name'] for t in seed['teachers']}
    place_names = {p['code']: p['name'] for p in seed['places']}

    # --- گروه‌بندی بر اساس درس ---
    by_course_target, by_course_produced = {}, {}
    for e in target_entries:
        by_course_target.setdefault(e.get('course_code'), []).append(e)
    for e in produced_entries:
        by_course_produced.setdefault(e.get('course_code'), []).append(e)

    all_codes = list(dict.fromkeys(
        list(by_course_target.keys()) + list(by_course_produced.keys())
    ))

    counters = {'exact': 0, 'time': 0, 'day': 0, 'teacher': 0, 'place': 0}
    total_pairs = 0
    course_reports = []

    for code in all_codes:
        t_list = by_course_target.get(code, [])
        p_list = by_course_produced.get(code, [])
        name = course_names.get(code, code)

        pairs = _best_pairing(t_list, p_list)
        rows = [_row(t, p, name) for t, p in pairs]

        c_counts = {'exact': 0, 'time': 0, 'day': 0, 'teacher': 0, 'place': 0}
        for row in rows:
            m = row['matched']
            for key, flag in (('exact', m['exact']), ('time', m['time']),
                              ('day', m['day']), ('teacher', m['teacher']),
                              ('place', m['place'])):
                if flag:
                    c_counts[key] += 1

        n_pairs = len(rows)
        total_pairs += n_pairs
        for key in counters:
            counters[key] += c_counts[key]

        course_reports.append({
            'course_code': code,
            'course_name': name,
            'target_sessions': len(t_list),
            'produced_sessions': len(p_list),
            'exact_matches': c_counts['exact'],
            'exact_percent': _percent(c_counts['exact'], n_pairs),
            'time_percent': _percent(c_counts['time'], n_pairs),
            'teacher_percent': _percent(c_counts['teacher'], n_pairs),
            'place_percent': _percent(c_counts['place'], n_pairs),
            'rows': rows,
        })

    course_reports.sort(key=lambda c: (c['exact_percent'], c['time_percent']))

    # --- کیفیت مستقل از مرجع ---
    target_report = evaluate_entries(config, target_entries)
    produced_report = evaluate_entries(config, produced_entries)
    target_cost = seed['target'].get('cost')
    produced_cost = algorithm_cost(config, produced_entries)

    agreement = {
        key: {
            'matched': counters[key],
            'total': total_pairs,
            'percent': _percent(counters[key], total_pairs),
        }
        for key in counters
    }

    verdict = _build_verdict(
        agreement, target_report, produced_report, target_cost, produced_cost,
        len(target_entries), len(produced_entries),
    )

    return {
        'seed': {
            'key': seed['key'],
            'title': seed['title'],
            'difficulty_label': seed['difficulty_label'],
            'stats': seed.get('stats', {}),
        },
        # روزها و بازه‌ها لازم‌اند تا رابط کاربری بتواند هر دو جدول هفتگی
        # (مرجع و خروجی) را با یک قالب واحد رسم کند
        'settings': {
            'days': [d['name'] for d in seed['settings']['days_of_week']
                     if d.get('enabled', True)],
            'slots': [{'id': s['id'], 'start': s['start'], 'end': s['end']}
                      for s in seed['settings']['time_slots']
                      if s.get('enabled', True)],
        },
        'entries': {
            'target': target_entries,
            'produced': produced_entries,
        },
        'agreement': agreement,
        'target': {
            'hard_violations': target_report['hard_violations'],
            'soft_penalty': target_report['soft_penalty'],
            'feasible': target_report['feasible'],
            'cost': target_cost,
            'sessions': len(target_entries),
            'violations': target_report['violations'],
            'total_violations': target_report['total_violations'],
            'time_preferences': target_report['time_preferences'],
        },
        'produced': {
            'hard_violations': produced_report['hard_violations'],
            'soft_penalty': produced_report['soft_penalty'],
            'feasible': produced_report['feasible'],
            'cost': produced_cost,
            'sessions': len(produced_entries),
            'violations': produced_report['violations'],
            'total_violations': produced_report['total_violations'],
            'time_preferences': produced_report['time_preferences'],
        },
        'violation_labels': produced_report['violation_labels'],
        'structure': _structure_report(seed, target_entries, produced_entries),
        'courses': course_reports,
        'lookup': {
            'teachers': teacher_names,
            'places': place_names,
            'courses': course_names,
        },
        'verdict': verdict,
    }


def _build_verdict(agreement, target_report, produced_report,
                   target_cost, produced_cost, n_target, n_produced):
    """
    داوری نهایی — بر پایه‌ی «کیفیت»، نه شباهت ظاهری به پاسخ مرجع.
    """
    exact_percent = agreement['exact']['percent']
    produced_violations = produced_report['hard_violations']
    target_violations = target_report['hard_violations']
    produced_soft = produced_report['soft_penalty']
    target_soft = target_report['soft_penalty']

    if (n_produced != n_target or produced_report['violations']['missing_session']
            or produced_report['violations']['extra_session']):
        return {
            'code': 'incomplete',
            'label': 'ناقص',
            'tone': 'error',
            'title': 'تعداد جلسات خروجی با پاسخ مرجع یکی نیست',
            'detail': (
                f'پاسخ مرجع {n_target} جلسه دارد ولی خروجی الگوریتم {n_produced} جلسه؛ '
                'تعداد جلسات هر درس باید با مرجع مطابقت داشته باشد.'
            ),
        }

    if produced_violations == 0:
        if produced_soft > target_soft:
            return {
                'code': 'feasible', 'label': 'معتبر، با جریمه نرم', 'tone': 'warning',
                'title': 'قیود سخت رعایت شده‌اند؛ ترجیحات هنوز قابل بهبودند',
                'detail': f'جریمه نرم خروجی {produced_soft} و مرجع {target_soft} است.',
            }
        if exact_percent >= 100:
            return {
                'code': 'identical',
                'label': 'منطبق بر مرجع',
                'tone': 'success',
                'title': 'خروجی الگوریتم دقیقاً همان پاسخ مرجع است',
                'detail': 'همه‌ی جلسات از نظر روز، بازه، استاد و مکان با پاسخ مرجع یکی هستند.',
            }
        return {
            'code': 'equivalent_optimal',
            'label': 'بهینه (جواب جایگزین)',
            'tone': 'success',
            'title': 'خروجی الگوریتم هم‌ارزِ پاسخ مرجع است',
            'detail': (
                'جدول تولیدشده با پاسخ مرجع یکی نیست، اما قیود سخت و ترجیحات ارزیابی‌شده را رعایت می‌کند؛ '
                f'یعنی یکی دیگر از جواب‌های بهینه‌ی همین مسئله است. میزان شباهت به مرجع: '
                f'{exact_percent}٪.'
            ),
        }

    if (produced_violations, produced_soft) <= (target_violations, target_soft):
        tone, code, label = 'success', 'equivalent_optimal', 'هم‌ارز مرجع'
        title = 'کیفیت خروجی از پاسخ مرجع کمتر نیست'
    elif produced_violations <= 3:
        tone, code, label = 'warning', 'near_optimal', 'نزدیک به بهینه'
        title = f'خروجی الگوریتم هنوز {produced_violations} نقض قید سخت دارد'
    else:
        tone, code, label = 'error', 'suboptimal', 'دور از بهینه'
        title = f'خروجی الگوریتم {produced_violations} نقض قید سخت دارد'

    broken = {k: n for k, n in produced_report['violations'].items() if n}
    labels = produced_report['violation_labels']
    detail_parts = [f"{labels.get(k, k)}: {n}" for k, n in broken.items()]

    return {
        'code': code,
        'label': label,
        'tone': tone,
        'title': title,
        'detail': (
            'پاسخ مرجع صفر تخلف دارد. تخلف‌های خروجی: ' + '، '.join(detail_parts)
            + f'. میزان شباهت به مرجع: {exact_percent}٪.'
        ),
    }
