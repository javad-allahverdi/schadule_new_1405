"""Journal-model regression: weekly loads are actual hard constraints."""
import copy
import hashlib
from pathlib import Path

from django.test import SimpleTestCase, TestCase
from scheduling.algorithm.coop1 import build_search_scheduler
from scheduling.algorithm.objective import TimetableObjective
from scheduling.algorithm.model_audit import audit_weekly_loads
from scheduling_module.benchmarks import get_seed
from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
from scheduling_module.test_coop0 import small_config, gene


def strict(config):
    config=copy.deepcopy(config)
    config['constraints'].append({'type':'teacher_weekly_load','parameters':{}})
    return config


class WeeklyObjectiveTests(SimpleTestCase):
    def test_minimum_is_hard_and_bonus_cannot_hide_it(self):
        config=small_config()
        config['teachers'][0].update(min_units=4,max_units=10)
        paper=TimetableObjective(build_search_scheduler(config,seed=0,method='COOP0')).evaluate([gene()])
        journal=TimetableObjective(build_search_scheduler(strict(config),seed=0,method='COOP0')).evaluate([gene()])
        self.assertEqual(paper['objective'],(0,0))
        self.assertEqual(journal['objective'],(3,0))
        self.assertEqual(journal['violations'],{'weekly_minimum_units':3})
        self.assertFalse(journal['feasible'])

    def test_maximum_units_and_exact_fractional_session_accounting(self):
        config=small_config();config['courses'][0]['units']=2
        config['teachers'][0].update(min_units=0,max_units=1)
        obj=TimetableObjective(build_search_scheduler(strict(config)))
        report=obj.evaluate([gene(),gene(day='D2',slot_id=2)])
        self.assertEqual(report['violations'],{'weekly_maximum_units':1})
        config['courses'][0].update(units=1,sessions=3)
        config['teachers'][0].update(min_units=1,max_units=1)
        obj=TimetableObjective(build_search_scheduler(strict(config)))
        report=obj.evaluate([gene(),gene(slot_id=2),gene(day='D2')])
        self.assertEqual(report['hard_violations'],0)
        self.assertEqual(report['weekly_teacher_loads'],{'T':1})

    def test_inconsistent_bounds_are_rejected(self):
        config=small_config();config['teachers'][0].update(min_units=5,max_units=4)
        with self.assertRaises(ValueError):
            TimetableObjective(build_search_scheduler(strict(config)))

    def test_correction_changes_only_documented_inputs(self):
        original=get_seed('seed_05_large_faculty')
        revised=get_seed('seed_05b_large_faculty_weekly_loads')
        for key in ('places','courses','student_groups','stats'):
            self.assertEqual(original[key],revised[key])
        self.assertEqual(original['constraints'],revised['constraints'][:-1])
        expected={'P06':3,'P11':2,'P12':2}
        for a,b in zip(original['teachers'],revised['teachers']):
            self.assertEqual({**a,'min_units':expected.get(a['code'],a['min_units'])},b)
        path=Path(__file__).parent/'benchmarks/seeds/seed_05_large_faculty.json'
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),'e9b701499cca37aa699ff3f9ab940255290857298ba46f9cb4779f27673b2006')

    def test_corrected_s5_has_a_fully_feasible_solution(self):
        config=seed_to_algorithm_config(get_seed('seed_05b_large_faculty_weekly_loads'))
        for method in ('COOP1','COOP1-RL'):
            s=build_search_scheduler(copy.deepcopy(config),seed=1400,method=method)
            result=s.optimize_with_hybrid_approach()
            self.assertEqual(result['constraint_model'],'weekly-loads-v1')
            self.assertEqual(result['algorithm_version'],2)
            self.assertEqual(result['objective'],[0,0])
            self.assertEqual(len(result['courses']),56)
            audit=audit_weekly_loads(config,result['courses'])
            self.assertTrue(audit['included_in_H'])
            self.assertEqual(audit['minimum_deficit_units'],0)
            self.assertEqual(audit['maximum_excess_units'],0)
            self.assertFalse(audit['stricter_model_proven_infeasible'])
            if method.endswith('RL'):
                self.assertGreater(result['learning']['updates'],0)


class WeeklyApplicationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University
        uni=University.objects.create(name='Weekly test',subdomain='weekly-test')
        cls.user=CustomUser.objects.create_user(username='weekly_test',email='weekly@example.test',role='admin',university=uni)

    def test_strict_model_survives_database_load_run_compare_and_export(self):
        from rest_framework.test import APIClient
        from scheduling_module.models import SchedulingTask
        from scheduling_module.utils import SchedulingAlgorithmRunner
        client=APIClient();client.force_authenticate(self.user)
        response=client.post('/scheduling/api/benchmarks/seeds/seed_05b_large_faculty_weekly_loads/load/',
                             {'algorithm_params':{'algorithm':'COOP1','seed':1400}},format='json')
        self.assertEqual(response.status_code,201,response.data)
        task=SchedulingTask.objects.get(pk=response.data['task_id'])
        self.assertTrue(task.university_config.constraints.filter(constraint_type='teacher_weekly_load',is_active=True).exists())
        runner=SchedulingAlgorithmRunner(task.id);runner.run();task.refresh_from_db()
        self.assertEqual(task.status,'completed',task.result)
        # Database relation ordering may change the random stream. The contract
        # here is hard feasibility under all weekly bounds, not a soft optimum.
        self.assertEqual(task.result['hard_violations'],0)
        self.assertEqual(task.result['constraint_model'],'weekly-loads-v1')
        status=client.get(f'/scheduling/api/scheduling-tasks/{task.id}/status/').data
        self.assertEqual(status['schedule_data']['constraint_model'],'weekly-loads-v1')
        self.assertTrue(status['schedule_data']['weekly_load_audit']['included_in_H'])
        self.assertEqual(status['schedule_data']['weekly_load_audit']['minimum_deficit_units'],0)
        self.assertEqual(status['schedule_data']['weekly_load_audit']['maximum_excess_units'],0)
        report=client.get(f'/scheduling/api/scheduling-tasks/{task.id}/compare/').data['comparison']
        self.assertTrue(report['produced']['feasible'])
        self.assertEqual(report['produced']['violations']['weekly_minimum_units'],0)
        text=client.get(f'/scheduling/api/scheduling-tasks/{task.id}/export/?file_format=text').content.decode('utf8')
        self.assertIn('در H محاسبه شده‌اند',text)
        pdf=client.get(f'/scheduling/api/scheduling-tasks/{task.id}/export/?file_format=pdf')
        self.assertEqual(pdf.status_code,200)
        self.assertTrue(pdf.content.startswith(b'%PDF'))
