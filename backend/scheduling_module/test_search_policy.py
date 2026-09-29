"""Operational entry points must use the revised strict scheduler by default."""
import copy
from unittest.mock import patch, Mock

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from scheduling_module.benchmarks import get_seed
from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
from scheduling_module.search_policy import (
    application_config, application_parameters, require_consistent_weekly_minima,
)

S5W = 'seed_05b_large_faculty_weekly_loads'


class SearchPolicyTests(SimpleTestCase):
    def test_fractional_units_do_not_create_false_infeasibility_or_approval_blocks(self):
        from scheduling.algorithm.model_audit import audit_weekly_loads
        config = {
            'teachers': [{'code': 'T', 'min_units': 1, 'max_units': 1}],
            'courses': [{'code': f'C{i}', 'units': 0.1, 'teachers': ['T']} for i in range(10)],
            'constraints': [{'type': 'teacher_weekly_load'}],
        }
        entries = [{'course_code': c['code'], 'teacher_code': 'T'} for c in config['courses']]
        require_consistent_weekly_minima(config)
        audit = audit_weekly_loads(config, entries)
        self.assertEqual((audit['minimum_deficit_units'], audit['maximum_excess_units']), (0, 0))
        config['courses'] = [{'code': 'C', 'units': 1, 'sessions': 10, 'teachers': ['T']}]
        audit = audit_weekly_loads(config, [{'course_code': 'C', 'teacher_code': 'T'}] * 10)
        self.assertEqual((audit['minimum_deficit_units'], audit['maximum_excess_units']), (0, 0))

    def test_default_is_revised_but_explicit_baseline_is_preserved(self):
        self.assertEqual(application_parameters({}), {'algorithm': 'CP-SAT'})
        self.assertEqual(application_parameters({'algorithm': 'COOP0'}), {'algorithm': 'COOP0'})

    def test_weekly_policy_does_not_mutate_or_duplicate_input_constraints(self):
        config = seed_to_algorithm_config(get_seed('seed_01_basic_sciences'))
        original = copy.deepcopy(config)
        for method in ('CP-SAT', 'COOP1', 'COOP1-RL'):
            prepared = application_config(config, method)
            twice = application_config(prepared, method)
            self.assertEqual(prepared, twice)
            self.assertEqual(sum(c['type'] == 'teacher_weekly_load' for c in twice['constraints']), 1)
        self.assertEqual(config, original)
        self.assertEqual(application_config(config, 'COOP0'), original)

    def test_original_s5_is_rejected_but_correction_passes_necessary_check(self):
        config = application_config(seed_to_algorithm_config(get_seed('seed_05_large_faculty')), 'COOP1')
        with self.assertRaisesRegex(ValueError, 'P06.*P11.*P12'):
            require_consistent_weekly_minima(config)
        require_consistent_weekly_minima(seed_to_algorithm_config(get_seed(S5W)))


class RevisedApplicationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        uni = University.objects.create(name='Revised app test', subdomain='revised-app-test')
        cls.user = CustomUser.objects.create_user(
            username='revised_test', email='revised@example.test', role='admin', university=uni,
        )
        cls.config, _ = load_seed_into_db(S5W, user=cls.user)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_omitted_empty_and_partial_api_parameters_use_coop1(self):
        for data in ({}, {'algorithm_params': {}}, {'algorithm_params': {'seed': 1400}}):
            response = self.client.post('/scheduling/api/scheduling-tasks/', {
                'name': 'Default method', 'university_config': self.config.id, **data,
            }, format='json')
            self.assertEqual(response.status_code, 201, response.data)
            self.assertEqual(response.data['algorithm_params']['algorithm'], 'CP-SAT')

    def test_api_run_persists_zero_hard_score_without_a_manual_weekly_switch(self):
        from scheduling_module.models import SchedulingTask, Schedule
        # An ordinary semester with the same data must enforce loads too.
        self.config.constraints.filter(constraint_type='teacher_weekly_load').delete()
        response = self.client.post('/scheduling/api/scheduling-tasks/', {
            'name': 'Strict default', 'university_config': self.config.id,
            'algorithm_params': {'algorithm': 'COOP1', 'seed': 1400},
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        task_id = response.data['id']

        def inline_thread(*, target, args):
            return Mock(start=lambda: target(*args))

        with patch('scheduling_module.views.threading.Thread', side_effect=inline_thread):
            response = self.client.post(f'/scheduling/api/scheduling-tasks/{task_id}/run/')
        self.assertEqual(response.status_code, 200, response.data)
        task = SchedulingTask.objects.get(pk=task_id)
        self.assertEqual(task.status, 'completed', task.result)
        self.assertEqual(task.result['algorithm'], 'COOP1')
        self.assertEqual(task.result['constraint_model'], 'weekly-loads-v1')
        self.assertEqual(task.result['hard_violations'], 0)
        self.assertEqual(Schedule.objects.filter(schedule_result__task=task).count(), 56)
        detail = self.client.get(f'/scheduling/api/scheduling-tasks/{task_id}/status/').data
        audit = detail['schedule_data']['weekly_load_audit']
        self.assertTrue(audit['included_in_H'])
        self.assertEqual((audit['minimum_deficit_units'], audit['maximum_excess_units']), (0, 0))
        self.assertEqual(len(audit['teachers']), 14)
        approved = self.client.post(f'/scheduling/api/scheduling-tasks/{task_id}/approve/')
        self.assertEqual(approved.status_code, 200, approved.data)
        self.assertFalse(self.config.constraints.filter(constraint_type='teacher_weekly_load').exists())

    def test_untagged_saved_task_uses_revised_method_on_next_run(self):
        from scheduling_module.models import SchedulingTask
        from scheduling_module.utils import SchedulingAlgorithmRunner
        task = SchedulingTask.objects.create(created_by=self.user, university_config=self.config,
                                             name='Old explicit task', algorithm_params={'algorithm': 'COOP1', 'seed': 1400})
        SchedulingAlgorithmRunner(task.id).run()
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed', task.result)
        self.assertEqual(task.algorithm_params['algorithm'], 'COOP1')
        self.assertEqual(task.result['hard_violations'], 0)

    def test_inconsistent_s5_fails_before_search_without_creating_a_result(self):
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        from scheduling_module.models import SchedulingTask, ScheduleResult
        from scheduling_module.utils import SchedulingAlgorithmRunner
        config, _ = load_seed_into_db('seed_05_large_faculty', user=self.user)
        task = SchedulingTask.objects.create(created_by=self.user, university_config=config, name='Original S5')
        with patch('scheduling.algorithm.coop1.build_search_scheduler') as search:
            SchedulingAlgorithmRunner(task.id).run()
            search.assert_not_called()
        task.refresh_from_db()
        self.assertEqual(task.status, 'failed')
        self.assertIn('S5-W', task.result['error'])
        self.assertFalse(ScheduleResult.objects.filter(task=task).exists())
        self.assertEqual(config.teachers.get(code='P06').min_units, 4)

    def test_known_hard_or_weekly_violations_cannot_be_approved(self):
        from scheduling_module.models import SchedulingTask, ScheduleResult
        task = SchedulingTask.objects.create(created_by=self.user, university_config=self.config, name='Invalid')
        result = ScheduleResult.objects.create(task=task, total_cost=0, schedule_data={})
        for data in (
            {'hard_violations': 1, 'feasible': False},
            {'hard_violations': 0, 'feasible': True, 'weekly_load_audit': {'minimum_deficit_units': 1}},
            {'hard_violations': 0, 'feasible': True, 'weekly_load_audit': {'maximum_excess_units': 1}},
        ):
            result.schedule_data = data; result.save()
            response = self.client.post(f'/scheduling/api/scheduling-tasks/{task.id}/approve/')
            self.assertEqual(response.status_code, 400, response.data)
            result.refresh_from_db()
            self.assertEqual(result.approval_status, 'pending_review')
