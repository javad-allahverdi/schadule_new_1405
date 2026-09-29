"""Improved search, true Q updates, feasibility and application integration."""
import copy
import random
from unittest.mock import Mock

from django.test import SimpleTestCase, TestCase

from scheduling.algorithm.coop0 import validate_parameters
from scheduling.algorithm.coop1 import COOP1Scheduler, QController, StaticDomains, build_search_scheduler
from scheduling.algorithm.objective import TimetableObjective
from scheduling_module.benchmarks import get_seed
from scheduling_module.benchmarks.config_builder import seed_to_algorithm_config
from scheduling_module.test_coop0 import small_config


class ImprovedSearchTests(SimpleTestCase):
    def test_domains_enforce_every_static_constraint(self):
        config = small_config()
        config['teachers'][0]['unavailable_times'] = ['D1']
        config['teachers'].append({'code':'UNAUTHORIZED'})
        config['courses'][0].update(required_place='R', gender=1)
        config['places'][0]['gender'] = 1
        config['constraints'].append({'type':'place_unavailable','parameters':{
            'place_code':'R','day':'D2','slot_id':2}})
        scheduler = COOP1Scheduler(config=config,seed=0)
        domains = StaticDomains(scheduler)
        self.assertEqual(len(domains.by_course[0]),1)
        g = domains.by_course[0][0]
        self.assertEqual((g['day'],g['slot_id'],g['teacher_code'],g['place_code']),('D2',1,'T','R'))
        self.assertEqual(TimetableObjective(scheduler).evaluate([g])['hard_violations'],0)
        for changes in ({'required_place':'UNKNOWN'}, {'gender':2}, {'expected_students':100}):
            bad = copy.deepcopy(config)
            bad['courses'][0].update(changes)
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                StaticDomains(COOP1Scheduler(config=bad))
        config['courses'][0].pop('required_place')
        config['courses'][0]['required_place_type']='lab'
        with self.assertRaises(ValueError):
            StaticDomains(COOP1Scheduler(config=config))

    def test_does_not_silently_drop_impossible_session_counts(self):
        config=small_config()
        for count in (5,-1):
            config['courses'][0]['sessions']=count
            with self.subTest(count=count), self.assertRaises(ValueError):
                COOP1Scheduler(config=config)

    def test_infeasible_instance_budget_and_replay_including_partial_repair(self):
        config=small_config()
        config['teachers'][0]['unavailable_times']=['D1_2','D2']
        config['courses'].append({**config['courses'][0],'code':'B'})
        for method in ('COOP1','COOP1-RL'):
            for budget in (4,5,8,9,11,17,33,101):
                with self.subTest(method=method,budget=budget):
                    results=[]
                    for _ in range(2):
                        s=build_search_scheduler(copy.deepcopy(config),seed=0,method=method)
                        s.popsize,s.max_evaluations=4,budget
                        callback=Mock()
                        result=s.optimize_with_hybrid_approach(callback)
                        self.assertEqual(result['evaluations'],budget)
                        self.assertEqual(sum(v['attempted'] for v in result['operator_stats'].values())+4,budget)
                        self.assertEqual(callback.call_args.args[:2],(budget,budget))
                        self.assertFalse(result['feasible'])
                        self.assertEqual(len(result['courses']),2)
                        self.assertEqual(TimetableObjective(s).evaluate_entries(result['courses'])['objective'],tuple(result['objective']))
                        trace=[(v['hard_violations'],v['soft_penalty']) for v in result['objective_convergence']]
                        self.assertTrue(all(b<=a for a,b in zip(trace,trace[1:])))
                        results.append(result)
                    self.assertEqual(*results)

    def test_q_learning_update_bootstraps_and_terminal_update_does_not(self):
        controller=QController(random.Random(0))
        a,b=(2,1,0),(0,1,1)
        controller.q[b]={'relocate':4.0,'swap':2.0}
        controller.update(a,'swap',1.0,b,['relocate','swap'])
        self.assertAlmostEqual(controller.q[a]['swap'],.84)
        controller.update(a,'swap',1.0,b,['relocate'],terminal=True)
        self.assertAlmostEqual(controller.q[a]['swap'],.872)
        self.assertEqual(controller.report()['updates'],2)
        controller.epsilon=0
        self.assertEqual(controller.choose(b,['swap','relocate']),'relocate')
        self.assertEqual(controller.choose(b,['swap']),'swap')

    def test_s5_feasible_and_learning_is_recorded(self):
        config=seed_to_algorithm_config(get_seed('seed_05_large_faculty'))
        for method in ('COOP1','COOP1-RL'):
            s=build_search_scheduler(copy.deepcopy(config),seed=1400,method=method)
            result=s.optimize_with_hybrid_approach()
            self.assertEqual(result['algorithm'],method)
            self.assertEqual(result['objective'],[0,0])
            self.assertEqual(len(result['courses']),56)
            self.assertTrue(TimetableObjective(s).evaluate_entries(result['courses'])['feasible'])
            self.assertGreater(result['static_domain_checks'],0)
            self.assertGreater(len(result['refinement_events']),0)
            self.assertEqual(sum(e['candidates'] for e in result['refinement_events']),
                             sum(v['attempted'] for k,v in result['operator_stats'].items() if k.startswith('repair_')))
            if method.endswith('RL'):
                self.assertEqual(result['learning']['updates'],len(result['refinement_events']))
                self.assertTrue(any(abs(v)>0 for values in result['learning']['q_table'].values() for v in values.values()))
            else:
                self.assertIsNone(result['learning'])

    def test_method_validation(self):
        for method in ('COOP0','COOP-C','COOP-D','COOP1','COOP1-RL'):
            self.assertEqual(validate_parameters({'algorithm':method}),{'algorithm':method})
        for method in ('RL', None, [], True):
            with self.assertRaises(ValueError):
                validate_parameters({'algorithm':method})

    def test_weekly_load_audit_detects_stricter_s5_infeasibility(self):
        from scheduling.algorithm.model_audit import audit_weekly_loads
        config=seed_to_algorithm_config(get_seed('seed_05_large_faculty'))
        audit=audit_weekly_loads(config,[])
        self.assertFalse(audit['included_in_H'])
        self.assertTrue(audit['stricter_model_proven_infeasible'])
        self.assertEqual([w['teacher_code'] for w in audit['infeasibility_witnesses']],['P06','P11','P12'])
        self.assertTrue(all(w['minimum_units']==4 and w['eligible_units_upper_bound']==3
                            for w in audit['infeasibility_witnesses']))
        small=small_config()
        small['teachers'][0].update(min_units=1,max_units=1)
        small['courses'][0]['sessions']=2
        entries=[{'teacher_code':'T','course_code':'C'}]*2
        checked=audit_weekly_loads(small,entries)
        self.assertEqual(checked['minimum_deficit_units'],0)
        self.assertEqual(checked['maximum_excess_units'],0)
        self.assertFalse(checked['stricter_model_proven_infeasible'])


class ImprovedIntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        from account_module.models import CustomUser, University
        cls.university=University.objects.create(name='COOP1 test',subdomain='coop1-test')
        cls.user=CustomUser.objects.create_user(username='coop1_test',email='coop1@example.test',
                                               role='admin',university=cls.university)

    def test_benchmark_explicit_coop1_and_rl_round_trip(self):
        from rest_framework.test import APIClient
        from scheduling_module.models import SchedulingTask, Schedule
        from scheduling_module.utils import SchedulingAlgorithmRunner
        client=APIClient()
        client.force_authenticate(self.user)
        loaded=client.post('/scheduling/api/benchmarks/seeds/seed_05b_large_faculty_weekly_loads/load/',{
            'algorithm_params':{'algorithm':'COOP1','seed':1400}},format='json')
        self.assertEqual(loaded.status_code,201,loaded.data)
        task=SchedulingTask.objects.get(pk=loaded.data['task_id'])
        self.assertEqual(task.algorithm_params['algorithm'],'COOP1')
        SchedulingAlgorithmRunner(task.id).run()
        task.refresh_from_db()
        self.assertEqual(task.status,'completed',task.result)
        self.assertEqual(task.result['hard_violations'],0)
        self.assertEqual(Schedule.objects.filter(schedule_result__task=task).count(),56)
        response=client.post('/scheduling/api/scheduling-tasks/',{
            'name':'RL test','university_config':task.university_config_id,
            'algorithm_params':{'algorithm':'COOP1-RL','seed':1400}},format='json')
        self.assertEqual(response.status_code,201,response.data)
        rl_task=SchedulingTask.objects.get(pk=response.data['id'])
        SchedulingAlgorithmRunner(rl_task.id).run()
        rl_task.refresh_from_db()
        self.assertEqual(rl_task.status,'completed',rl_task.result)
        self.assertEqual(rl_task.result['algorithm'],'COOP1-RL')
        self.assertEqual(rl_task.result['hard_violations'],0)
        status=client.get(f'/scheduling/api/scheduling-tasks/{rl_task.id}/status/').data
        self.assertGreater(status['schedule_data']['learning']['updates'],0)
        self.assertFalse(status['schedule_data']['weekly_load_audit']['stricter_model_proven_infeasible'])
        self.assertTrue(status['schedule_data']['weekly_load_audit']['included_in_H'])
        exported=client.get(f'/scheduling/api/scheduling-tasks/{rl_task.id}/export/?file_format=text')
        self.assertIn('COOP1-RL | H: 0',exported.content.decode('utf8'))
        pdf=client.get(f'/scheduling/api/scheduling-tasks/{rl_task.id}/export/?file_format=pdf')
        self.assertEqual(pdf.status_code,200)
        self.assertTrue(pdf.content.startswith(b'%PDF'))
