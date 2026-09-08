// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import toast from '../utils/toast';
import TeachersManage from './TeachersManage';
import CoursesManage from './CoursesManage';
import PlacesManage from './PlacesManage';
import StudentGroupsManage from './StudentGroupsManage';
import UsersManage from './UsersManage';
import SemestersManage from './SemestersManage';
import SchedulingRun from './SchedulingRun';
import ReportsView from './ReportsView';

const TABS = [
  { id: 'overview', label: 'نمای کلی' },
  { id: 'semesters', label: 'نیمسال‌ها' },
  { id: 'teachers', label: 'اساتید' },
  { id: 'courses', label: 'دروس' },
  { id: 'places', label: 'مکان‌ها' },
  { id: 'groups', label: 'گروه‌های دانشجویی' },
  { id: 'scheduling', label: 'زمان‌بندی هوشمند' },
  { id: 'reports', label: 'گزارشات' },
  { id: 'users', label: 'کاربران' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSemesterId, setActiveSemesterId] = useState(authService.getActiveUniversityConfigId());

  useEffect(() => {
    const user = authService.getUser();
    if (!user || !authService.isAdmin()) {
      navigate('/login');
      return;
    }
    // اعتبارسنجی نیمسال فعال (در صورتی که از قبل لاگین بوده و localStorage قدیمی/نامعتبر باشد)
    authService.ensureActiveUniversityConfig().then((id) => setActiveSemesterId(id));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await authService.getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">داشبورد مدیریت</h1>
          <p className="text-blue-100 mt-1">
            خوش آمدید، {authService.getUser()?.first_name}
          </p>
          <p className="text-blue-200 text-sm">
            نقش: {authService.getRoleDisplay()} | دانشگاه: {authService.getUser()?.university_name || '—'}
          </p>
          {!activeSemesterId && (
            <p className="mt-2 inline-block bg-yellow-400/90 text-yellow-900 text-xs px-3 py-1 rounded-full">
              هیچ نیمسال فعالی انتخاب نشده — ابتدا از تب «نیمسال‌ها» یک نیمسال بسازید و فعال کنید
            </p>
          )}
        </div>
      </div>

      {/* تب‌ها */}
      <div className="bg-white border-b shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 sm:gap-8 whitespace-nowrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* محتوا */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox title="کل کاربران" value={stats?.total_users || 0} color="blue" />
            <StatBox title="کاربران فعال" value={stats?.active_users || 0} color="green" />
            <StatBox title="اساتید" value={stats?.total_teachers || 0} color="purple" />
            <StatBox title="کارشناسان آموزش" value={stats?.total_education_officers || 0} color="pink" />
            <StatBox title="مدیران" value={stats?.total_admins || 0} color="red" />
            <StatBox title="کاربران جدید (۷ روز اخیر)" value={stats?.new_users || 0} color="indigo" />
            <StatBox title="تایید شده" value={stats?.verified_users || 0} color="teal" />
          </div>
        )}

        {activeTab === 'semesters' && (
          <SemestersManage onActiveChanged={(id) => setActiveSemesterId(id)} />
        )}
        {activeTab === 'teachers' && <TeachersManage />}
        {activeTab === 'courses' && <CoursesManage />}
        {activeTab === 'places' && <PlacesManage />}
        {activeTab === 'groups' && <StudentGroupsManage />}
        {activeTab === 'scheduling' && <SchedulingRun />}
        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'users' && <UsersManage isSupervisorView={false} />}
      </div>
    </div>
  );
}

function StatBox({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colors[color] || colors.blue}`}>
      <p className="text-sm opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
