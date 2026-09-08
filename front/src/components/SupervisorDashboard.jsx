// src/components/SupervisorDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import toast from '../utils/toast';
import UniversitiesManage from './UniversitiesManage';
import UsersManage from './UsersManage';
import {
  Users,
  Building2,
  Clock,
  ShieldAlert,
  RefreshCw,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const user = authService.getUser();
    if (!user || !authService.isSupervisor()) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getSupervisorDashboardStats();
      if (response.success) {
        setStats(response.stats);
      } else {
        setError(response.message || 'خطا در دریافت اطلاعات');
      }
    } catch (error) {
      console.error('Error loading supervisor dashboard:', error);
      setError('خطا در بارگذاری داشبورد. لطفاً دوباره تلاش کنید.');
      toast.error('خطا در بارگذاری داشبورد');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر داشبورد */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">داشبورد سوپروایزر</h1>
              <p className="text-blue-100 mt-2">
                خوش آمدید، {authService.getUser()?.first_name} {authService.getUser()?.last_name}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                نقش: {authService.getRoleDisplay()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              <RefreshCw className="h-5 w-5 ml-2" />
              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      {/* تب‌ها */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 rtl:space-x-reverse">
            {[
              { id: 'overview', label: 'نمای کلی', icon: BarChart3 },
              { id: 'universities', label: 'دانشگاه‌ها', icon: Building2 },
              { id: 'users', label: 'کاربران', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 ml-2" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* محتوای اصلی */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="کل دانشگاه‌ها"
                value={stats?.total_universities || 0}
                icon={Building2}
                color="text-blue-600"
                bgColor="bg-blue-50"
                trend={`${stats?.active_universities || 0} فعال`}
              />
              <StatCard
                title="در آستانه انقضا (۱۴ روز)"
                value={stats?.expiring_soon || 0}
                icon={Clock}
                color="text-yellow-600"
                bgColor="bg-yellow-50"
                trend="نیازمند تمدید"
              />
              <StatCard
                title="منقضی شده"
                value={stats?.expired || 0}
                icon={ShieldAlert}
                color="text-red-600"
                bgColor="bg-red-50"
                trend="نیازمند اقدام"
              />
              <StatCard
                title="کل کاربران"
                value={stats?.total_users || 0}
                icon={Users}
                color="text-purple-600"
                bgColor="bg-purple-50"
                trend={`${stats?.total_admins || 0} مدیر`}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Users className="h-6 w-6 ml-2 text-blue-500" />
                  توزیع کاربران بر اساس نقش
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <DetailBox title="مدیران دانشگاه" value={stats?.total_admins || 0} color="text-blue-600" />
                  <DetailBox title="مسئولین آموزش" value={stats?.total_education_officers || 0} color="text-green-600" />
                  <DetailBox title="اساتید" value={stats?.total_teachers || 0} color="text-purple-600" />
                </div>
              </div>
            </div>

            {stats?.recent_universities?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Building2 className="h-6 w-6 ml-2 text-blue-500" />
                    آخرین دانشگاه‌های ثبت‌شده
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  {stats.recent_universities.map((u) => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500" dir="ltr">{u.subdomain}.example.com</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${u.is_accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_accessible ? 'فعال' : 'غیرفعال/منقضی'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'universities' && <UniversitiesManage />}

        {activeTab === 'users' && <UsersManage isSupervisorView={true} />}
      </main>
    </div>
  );
}

// کامپوننت‌های کمکی
function StatCard({ title, value, icon: Icon, color, bgColor, trend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <span className="text-xs text-gray-500">{trend}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function DetailBox({ title, value, color }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
