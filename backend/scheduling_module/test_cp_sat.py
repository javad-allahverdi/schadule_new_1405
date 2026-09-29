"""CP-SAT feasibility, objective, and method selection."""

from django.test import SimpleTestCase, TestCase

from scheduling.algorithm.coop1 import build_search_scheduler
from scheduling.algorithm.objective import TimetableObjective
from scheduling_module.search_policy import application_config, application_parameters
from scheduling_module.test_coop0 import small_config


class CPSATTests(SimpleTestCase):
    def test_default_finds_feasible_preferred_schedule(self):
        config = application_config(small_config(), application_parameters({})['algorithm'])
        scheduler = build_search_scheduler(config, seed=3, method='CP-SAT')
        result = scheduler.optimize_with_hybrid_approach()
        self.assertEqual(result['algorithm'], 'CP-SAT')
        self.assertEqual(result['objective'], [0, 0])
        self.assertEqual(result['courses'][0]['day'], 'D1')
        self.assertEqual(result['courses'][0]['slot_id'], 1)
        self.assertEqual(result['constraint_model'], 'weekly-loads-v1')
        self.assertEqual(TimetableObjective(scheduler).evaluate_entries(result['courses'])['objective'], (0, 0))

    def test_teacher_load_and_group_conflict_are_hard(self):
        config = small_config()
        config['settings']['max_classes_per_day'] = 1
        config['teachers'].append({'code': 'U', 'min_units': 1, 'max_units': 1})
        config['teachers'][0].update(min_units=1, max_units=1)
        config['courses'].append({'code': 'B', 'units': 1, 'teachers': ['U'], 'expected_students': 20})
        config['student_groups'] = [{'required_courses': ['C', 'B']}]
        scheduler = build_search_scheduler(application_config(config, 'CP-SAT'), seed=1, method='CP-SAT')
        result = scheduler.optimize_with_hybrid_approach()
        self.assertEqual(result['objective'], [0, 0])
        self.assertNotEqual(
            (result['courses'][0]['day'], result['courses'][0]['slot_id']),
            (result['courses'][1]['day'], result['courses'][1]['slot_id']),
        )
        self.assertEqual(result['weekly_teacher_loads'], {'T': 1.0, 'U': 1.0})

    def test_infeasible_constraints_report_failure(self):
        config = small_config()
        config['teachers'][0].update(min_units=2, max_units=2)
        scheduler = build_search_scheduler(application_config(config, 'CP-SAT'), seed=1, method='CP-SAT')
        with self.assertRaisesRegex(ValueError, 'هیچ برنامه‌ای'):
            scheduler.optimize_with_hybrid_approach()


class CPSATApplicationTests(TestCase):
    def test_default_task_persists_cp_sat_schedule(self):
        from account_module.models import CustomUser, University
        from scheduling_module.benchmarks.db_loader import load_seed_into_db
        from scheduling_module.models import Schedule, SchedulingTask
        from scheduling_module.utils import SchedulingAlgorithmRunner

        university = University.objects.create(name='CP semester', subdomain='cp-semester')
        user = CustomUser.objects.create_user(
            username='cp_sat_test', email='cp_sat@example.test', role='admin', university=university,
        )
        config, _ = load_seed_into_db('seed_01_basic_sciences', user=user)
        # S1 predates the strict weekly model; remove its inconsistent workload
        # bounds so this test exercises persistence rather than fixture repair.
        config.teachers.update(min_units=0, max_units=20)
        task = SchedulingTask.objects.create(created_by=user, university_config=config, name='CP default')
        SchedulingAlgorithmRunner(task.id).run()
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed', task.result)
        self.assertEqual(task.algorithm_params['algorithm'], 'CP-SAT')
        self.assertEqual(task.result['objective'][0], 0)
        self.assertEqual(Schedule.objects.filter(schedule_result__task=task).count(), 13)
