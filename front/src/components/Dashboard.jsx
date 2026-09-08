// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  School, 
  BookOpen, 
  Calendar,
  TrendingUp,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import authService from '../services/auth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await authService.getDashboardStats();
      if (response.success) {
        setStats(response.stats);
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'کل کاربران',
      value: stats?.total_users || 0,
      icon: <Users className="w-6 h-6 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      link: '/admin/users'
    },
    {
      title: 'اساتید',
      value: stats?.total_teachers || 0,
      icon: <UserCheck className="w-6 h-6 text-green-500" />,
      color: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      link: '/admin/users?role=teacher'
    },
    {
      title: 'مسئولین آموزش',
      value: stats?.total_education_officers || 0,
      icon: <School className="w-6 h-6 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      link: '/admin/users?role=education_officer'
    },
    {
      title: 'مدیران',
      value: stats?.total_admins || 0,
      icon: <UserPlus className="w-6 h-6 text-red-500" />,
      color: 'bg-red-50 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      link: '/admin/users?role=admin'
    },
    {
      title: 'کاربران فعال',
      value: stats?.active_users || 0,
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      link: '/admin/users?is_active=true'
    },
    {
      title: 'کاربران تایید شده',
      value: stats?.verified_users || 0,
      icon: <BarChart3 className="w-6 h-6 text-indigo-500" />,
      color: 'bg-indigo-50 dark:bg-indigo-900/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      link: '/admin/users?is_verified=true'
    },
    {
      title: 'کاربران جدید',
      value: stats?.new_users || 0,
      icon: <UserPlus className="w-6 h-6 text-cyan-500" />,
      color: 'bg-cyan-50 dark:bg-cyan-900/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      link: '/admin/users'
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            داشبورد
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            خوش آمدید {user?.name} • نقش: {user?.role_display}
          </p>
        </div>
        <Link
          to="/admin/users"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users size={18} />
          <span>مدیریت کاربران</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <Link to={stat.link} className="block">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold">مدیریت کاربران</h3>
          <p className="text-blue-100 mt-2">افزودن، ویرایش و حذف کاربران</p>
          <Link
            to="/admin/users"
            className="inline-block mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            مشاهده کاربران
          </Link>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold">مدیریت دروس</h3>
          <p className="text-purple-100 mt-2">ایجاد و مدیریت دروس دانشگاه</p>
          <Link
            to="/admin/courses"
            className="inline-block mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            مشاهده دروس
          </Link>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold">برنامه‌ریزی</h3>
          <p className="text-green-100 mt-2">تنظیم زمان‌بندی کلاس‌ها</p>
          <Link
            to="/admin/schedule"
            className="inline-block mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            مشاهده برنامه
          </Link>
        </div>
      </div>
    </div>
  );
}