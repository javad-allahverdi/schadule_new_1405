"""COOP0 regression tests, including independently recorded paper outputs."""

import copy
import hashlib
import json
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase

from scheduling.algorithm.coop0 import validate_parameters
from scheduling.algorithm.hybrid_bbo_rl import COOP0Scheduler
from scheduling.algorithm.objective import TimetableObjective
from scheduling_module.benchmarks import get_seed
from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config


def small_config():
    return {
        'settings': {'days_of_week': ['D1', 'D2'], 'max_classes_per_day': 3,
                     'time_slots': [{'id': 1, 'start': '08:00', 'end': '10:00'},
                                    {'id': 2, 'start': '10:00', 'end': '12:00'}]},
        'teachers': [{'code': 'T', 'unavailable_times': []}],
        'places': [{'code': 'R', 'capacity': 30, 'gender': 0, 'place_type': 'class'},
                   {'code': 'SMALL', 'capacity': 1, 'gender': 0, 'place_type': 'class'}],
        'courses': [{'code': 'C', 'units': 1, 'teachers': ['T'], 'expected_students': 20,
                     'gender': 0}],
        'constraints': [{'type': 'time_preference', 'parameters': {
            'teacher_code': 'T', 'day': 'D1', 'slot_id': 1, 'weight': 10}}],
    }


def gene(**changes):
    return {'day': 'D1', 'slot_id': 1, 'start': '08:00', 'end': '10:00',
            'teacher_code': 'T', 'place_code': 'R', **changes}


class ObjectiveTests(SimpleTestCase):
    def test_preference_bonus_cannot_hide_capacity_violation(self):
        scheduler = COOP0Scheduler(config=small_config(), seed=1)
        individual = [gene(place_code='SMALL')]
        self.assertEqual(scheduler._fitness(individual), 0)  # old zero is misleading
        report = TimetableObjective(scheduler).evaluate(individual)
        self.assertEqual(report['objective'], (1, 0))
        self.assertFalse(report['feasible'])

    def test_hard_feasibility_takes_priority_over_all_soft_penalties(self):
        objective = TimetableObjective(COOP0Scheduler(config=small_config()))
        feasible = objective.evaluate([gene(day='D2')])
        infeasible = objective.evaluate([gene(place_code='SMALL')])
        self.assertEqual(feasible['objective'], (0, 10))
        self.assertTrue(feasible['feasible'])
        self.assertLess(feasible['objective'], infeasible['objective'])

    def test_group_pairs_count_sessions_and_daily_load_is_soft(self):
        config = small_config()
        config['courses'][0]['units'] = 2
        config['courses'].append({**config['courses'][0], 'code': 'B', 'units': 1})
        config['student_groups'] = [{'required_courses': ['C', 'B']}]
        config['settings']['max_classes_per_day'] = 1
        report = TimetableObjective(COOP0Scheduler(config=config)).evaluate([gene()] * 3)
        self.assertEqual(report['violations'], {
            'teacher_conflict': 2, 'place_conflict': 2, 'same_course': 1, 'group_conflict': 2})
        self.assertEqual(report['objective'], (7, 2))
        self.assertEqual(report['time_preferences'], {'satisfied': 1, 'total': 1})

    def test_invalid_assignments_and_static_constraints(self):
        config = small_config()
        config['courses'][0].update(required_place='R', gender=1)
        config['places'][1]['gender'] = 2
        config['teachers'][0]['unavailable_times'] = ['D1_1']
        config['constraints'].append({'type': 'place_unavailable', 'parameters': {
            'place_code': 'SMALL', 'day': 'D1'}})
        objective = TimetableObjective(COOP0Scheduler(config=config))
        self.assertEqual(objective.evaluate([gene(place_code='SMALL')])['violations'], {
            'teacher_unavailable': 1, 'capacity': 1, 'gender': 1,
            'required_place': 1, 'place_unavailable': 1})
        self.assertEqual(objective.evaluate([gene(day='bad', teacher_code='bad', place_code='bad')])['violations'],
                         {'domain': 1, 'teacher_eligibility': 1, 'missing_place': 1})
        config['teachers'].append({'code': 'OTHER'})
        self.assertIn('teacher_eligibility', TimetableObjective(COOP0Scheduler(config=config))
                      .evaluate([gene(teacher_code='OTHER')])['violations'])
        del config['courses'][0]['required_place']
        config['courses'][0]['required_place_type'] = 'lab'
        self.assertIn('place_type', TimetableObjective(COOP0Scheduler(config=config))
                      .evaluate([gene()])['violations'])

    def test_structurally_incomplete_schedules_are_never_feasible(self):
        objective = TimetableObjective(COOP0Scheduler(config=small_config()))
        self.assertEqual(objective.evaluate_entries([])['violations'], {'missing_session': 1})
        self.assertEqual(objective.evaluate_entries([dict(gene(), course_code='UNKNOWN')])['violations'],
                         {'extra_session': 1, 'missing_session': 1})
        self.assertEqual(objective.evaluate_entries([dict(gene(), course_code='C')] * 2)['violations'],
                         {'extra_session': 1})

    def test_negative_preferences_do_not_reward_violations(self):
        config = small_config()
        config['constraints'][0]['parameters']['weight'] = -100
        report = TimetableObjective(COOP0Scheduler(config=config)).evaluate([gene(day='D2')])
        self.assertEqual(report['objective'], (0, 0))

    def test_comparison_does_not_call_unmet_preferences_optimal(self):
        from scheduling_module.benchmarks.comparison import _build_verdict
        from scheduling_module.benchmarks.evaluation import evaluate_entries
        target = evaluate_entries(small_config(), [dict(gene(), course_code='C')])
        produced = evaluate_entries(small_config(), [dict(gene(day='D2'), course_code='C')])
        verdict = _build_verdict({'exact': {'percent': 0}}, target, produced, 0, 0, 1, 1)
        self.assertEqual(produced['hard_violations'], 0)
        self.assertEqual(produced['soft_penalty'], 10)
        self.assertEqual(verdict['code'], 'feasible')


class COOP0Tests(SimpleTestCase):
    def test_matches_independent_paper_schedules(self):
        # SHA256 of canonical schedules in the recorded COOP0 experiments (seed 1400).
        references = {
            'seed_01_basic_sciences': ([0, 0], '981a481f6b1d6651ed00edd33880d800c66e91c13e7b5c90a0301e187967bfee'),
            'seed_02_computer_engineering': ([0, 0], '39338c1eb7a345acb5a21ba15bb5295034e3e8500c1e274786586518f5b6c87c'),
            'seed_03_lab_constrained': ([0, 0], '724282fb95773de5523e2bfa6cc0908af52dd98e315d07f76f36178ed05d1e44'),
            'seed_04_gender_segregated': ([0, 0], '7d6dc1f90309005e1643f9e71a64d7f4115610c3f70e4d40878de8da4aa6476e'),
            'seed_05_large_faculty': ([4, 2], 'fede9a04dc21a5cca04c786fb0ec394ee1065b7c5b9d71ed529fe77f5528a3be'),
        }
        for key, (expected, digest) in references.items():
            with self.subTest(instance=key):
                result = COOP0Scheduler(config=seed_to_algorithm_config(get_seed(key)), seed=1400).optimize_with_hybrid_approach()
                self.assertEqual(result['objective'], expected)
                self.assertEqual(result['evaluations'], 3240)
                actual = hashlib.sha256(json.dumps(result['courses'], sort_keys=True, ensure_ascii=True).encode()).hexdigest()
                self.assertEqual(actual, digest)

    def test_exact_budget_including_partial_stages_and_no_early_zero_stop(self):
        for budget in (4, 5, 6, 7, 8, 9, 17):
            with self.subTest(budget=budget):
                scheduler = COOP0Scheduler(config=small_config(), seed=17)
                scheduler.popsize, scheduler.max_evaluations = 4, budget
                callback = Mock()
                result = scheduler.optimize_with_hybrid_approach(callback)
                self.assertEqual(result['evaluations'], budget)
                self.assertEqual(sum(v['attempted'] for v in result['operator_stats'].values()), budget - 4)
                self.assertEqual(callback.call_args.args[:2], (budget, budget))
                values = [(r['hard_violations'], r['soft_penalty']) for r in result['objective_convergence']]
                self.assertTrue(all(b <= a for a, b in zip(values, values[1:])))

    def test_random_seed_is_recorded_and_replayable(self):
        scheduler = COOP0Scheduler(config=small_config())
        scheduler.popsize, scheduler.max_evaluations = 4, 25
        first = scheduler.optimize_with_hybrid_approach()
        self.assertLess(first['seed'], 2**53)
        second = COOP0Scheduler(config=small_config(), seed=first['seed'])
        second.popsize, second.max_evaluations = 4, 25
        self.assertEqual(first, second.optimize_with_hybrid_approach())

    def test_legacy_weights_do_not_affect_search(self):
        a, b = (COOP0Scheduler(config=small_config(), seed=7) for _ in range(2))
        for scheduler in (a, b):
            scheduler.popsize, scheduler.max_evaluations = 4, 25
        b.capacity_cost, b.time_preference_bonus = 99999, 0
        first, second = a.optimize_with_hybrid_approach(), b.optimize_with_hybrid_approach()
        self.assertEqual(first['courses'], second['courses'])
        self.assertEqual(first['objective_convergence'], second['objective_convergence'])

    def test_empty_problem_does_not_crash_or_spend_budget(self):
        config = small_config()
        config['courses'] = []
        result = COOP0Scheduler(config=config).optimize_with_hybrid_approach()
        self.assertEqual(result['evaluations'], 0)
        self.assertEqual(result['objective'], [0, 10])
        self.assertEqual(result['courses'], [])

    def test_selective_acceptance_and_refreshed_gwo_leaders(self):
        def marker_objective(_, individual):
            hard = individual[0]['marker']
            return {'objective': (hard, 0), 'hard_violations': hard, 'soft_penalty': 0, 'feasible': hard == 0}

        for mutant, budget, expected_bbo, expected_gwo in ((100, 6, 0, 0), (0, 8, 2, 2)):
            with self.subTest(mutant=mutant):
                scheduler = COOP0Scheduler(config=small_config(), seed=1)
                scheduler.popsize, scheduler.max_evaluations = 4, budget
                initial = [[gene(marker=n)] for n in (10, 20, 30, 40)]
                scheduler._init_population = lambda: copy.deepcopy(initial)
                scheduler._random_gene = lambda _: gene(marker=mutant)
                scheduler._rng = Mock()
                scheduler._rng.random.return_value = 0
                scheduler._rng.choices.side_effect = lambda population, weights: [population[0]]
                with patch.object(TimetableObjective, 'evaluate', marker_objective):
                    result = scheduler.optimize_with_hybrid_approach()
                self.assertEqual(result['operator_stats']['bbo']['improved'], expected_bbo)
                # Only refreshed leaders allow both formerly elite members to improve.
                self.assertEqual(result['operator_stats']['gwo']['improved'], expected_gwo)
                self.assertEqual(result['objective'][0], min(10, mutant))

    def test_bad_parameters_fail_before_search(self):
        for params in ({'popsize': 3}, {'popsize': 4.5}, {'maxgen': -1}, {'max_evaluations': 39},
                       {'seed': True}, {'seed': -1}, {'seed': 2**53}, {'_rng': 7}, [],
                       {'capacity_cost': float('nan')}):
            with self.subTest(params=params), self.assertRaises(ValueError):
                validate_parameters(params)
        self.assertEqual(validate_parameters({'seed': 0, 'popsize': '4', 'max_evaluations': '4'}),
                         {'seed': 0, 'popsize': 4, 'max_evaluations': 4})


class COOP0IntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University
        cls.university = University.objects.create(name='COOP0 test', subdomain='coop0-test')
        cls.user = CustomUser.objects.create_user(username='coop0_test', email='coop0@example.test',
                                                 role='admin', university=cls.university)

    def test_runner_persists_objective_seed_and_schedule_and_can_rerun(self):
        from rest_framework.test import APIClient
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        from scheduling_module.models import SchedulingTask, Schedule
        from scheduling_module.utils import SchedulingAlgorithmRunner

        config, _ = load_seed_into_db('seed_01_basic_sciences', user=self.user)
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post('/scheduling/api/scheduling-tasks/', {
            'name': 'COOP0', 'university_config': config.id,
            'algorithm_params': {'algorithm': 'COOP0', 'popsize': 8, 'max_evaluations': 100, 'seed': 0},
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        task = SchedulingTask.objects.get(pk=response.data['id'])
        for _ in range(2):
            SchedulingAlgorithmRunner(task.id).run()
            task.refresh_from_db()
            self.assertEqual(task.status, 'completed', task.result)
            self.assertEqual(task.result['algorithm'], 'COOP0')
            self.assertEqual(task.result['seed'], 0)
            self.assertEqual(task.result['evaluations'], 100)
            self.assertEqual(Schedule.objects.filter(schedule_result__task=task).count(), 13)
        response = client.get(f'/scheduling/api/scheduling-tasks/{task.id}/status/')
        self.assertEqual(response.data['schedule_data']['objective'], task.result['objective'])
        report = client.get(f'/scheduling/api/scheduling-tasks/{task.id}/compare/').data['comparison']
        self.assertEqual(report['produced']['hard_violations'], task.result['hard_violations'])
        self.assertEqual(report['produced']['soft_penalty'], task.result['soft_penalty'])
        self.assertEqual(report['task']['evaluations'], 100)
        text_export = client.get(f'/scheduling/api/scheduling-tasks/{task.id}/export/?file_format=text')
        self.assertEqual(text_export.status_code, 200)
        self.assertIn('COOP0 | H:', text_export.content.decode('utf-8'))
        pdf_export = client.get(f'/scheduling/api/scheduling-tasks/{task.id}/export/?file_format=pdf')
        self.assertEqual(pdf_export.status_code, 200)
        self.assertTrue(pdf_export.content.startswith(b'%PDF'))

    def test_invalid_seed_load_parameters_do_not_create_a_semester(self):
        from rest_framework.test import APIClient
        from scheduling_module.models import UniversityConfig
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post('/scheduling/api/benchmarks/seeds/seed_01_basic_sciences/load/',
                               {'algorithm_params': {'popsize': 0}}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(UniversityConfig.objects.exists())

    def test_serializer_rejects_invalid_budget(self):
        from rest_framework.exceptions import ValidationError
        from panel_module.serializers import SchedulingTaskSerializer
        with self.assertRaises(ValidationError):
            SchedulingTaskSerializer().validate_algorithm_params({'max_evaluations': 10})
