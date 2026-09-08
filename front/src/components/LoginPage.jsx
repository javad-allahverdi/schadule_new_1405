// src/components/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../services/auth';
import SearchSelect from './SearchSelect';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('university'); // 'university' | 'supervisor'
  const [universities, setUniversities] = useState([]);
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      navigateDashboard(user);
    }
    loadUniversities();
  }, [navigate]);

  const loadUniversities = async () => {
    setUniversitiesLoading(true);
    const res = await authService.getPublicUniversities();
    if (res.success) {
      setUniversities(res.universities || []);
      if (res.universities?.length > 0) {
        setSelectedSubdomain(res.universities[0].subdomain);
      }
    }
    setUniversitiesLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError('');

    if (loginMode === 'university' && !selectedSubdomain) {
      setGeneralError('لطفاً دانشگاه خود را انتخاب کنید');
      setLoading(false);
      return;
    }

    try {
      const tenantSubdomain = loginMode === 'university' ? selectedSubdomain : null;
      const result = await authService.login(formData, tenantSubdomain);
      if (result.success) {
        navigateDashboard(result.user);
      }
    } catch (error) {
      const message = error.response?.data?.message;
      if (message) setGeneralError(message);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateDashboard = (user) => {
    const role = user?.role || 'teacher';
    const routes = {
      admin: '/admin-dashboard',
      education_officer: '/education-officer-dashboard',
      teacher: '/teacher-dashboard',
      supervisor: '/supervisor-dashboard',
    };
    navigate(routes[role] || '/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex w-full max-w-7xl h-auto lg:h-[680px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 overflow-hidden border border-white/20 dark:border-gray-700/50"
      >
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                ورود به سیستم
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                برای ورود، نام کاربری و رمز عبور خود را وارد کنید
              </p>
            </div>

            {/* انتخاب نوع ورود */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
              <button
                type="button"
                onClick={() => setLoginMode('university')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  loginMode === 'university'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-300'
                }`}
              >
                ورود کاربران دانشگاه
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('supervisor')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  loginMode === 'supervisor'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-300'
                }`}
              >
                ورود سوپروایزر
              </button>
            </div>

            {generalError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm">
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {loginMode === 'university' && (
                <div>
                  {universitiesLoading ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        دانشگاه شما
                      </label>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-400 text-sm">
                        در حال بارگذاری لیست دانشگاه‌ها...
                      </div>
                    </div>
                  ) : universities.length === 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        دانشگاه شما
                      </label>
                      <div className="w-full px-4 py-3 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 text-sm">
                        هنوز هیچ دانشگاهی ثبت نشده است. ابتدا سوپروایزر باید یک دانشگاه ایجاد کند.
                      </div>
                    </div>
                  ) : (
                    <SearchSelect
                      label="دانشگاه شما (جستجو کنید)"
                      value={selectedSubdomain}
                      onChange={(val) => setSelectedSubdomain(val)}
                      options={universities.map((u) => ({
                        ...u,
                        name: u.is_accessible ? u.name : `${u.name} (غیرفعال/منقضی)`,
                      }))}
                      displayField="name"
                      valueField="subdomain"
                      placeholder="نام دانشگاه را جستجو کنید..."
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام کاربری یا ایمیل
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="نام کاربری یا ایمیل خود را وارد کنید"
                  required
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رمز عبور
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                  disabled={loading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    در حال ورود...
                  </span>
                ) : (
                  'ورود'
                )}
              </button>

              {loginMode === 'university' && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    حساب کاربری ندارید؟{' '}
                    <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                      ثبت نام کنید
                    </a>
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-600 p-12 items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">سامانه برنامه‌ریزی دانشگاه</h1>
            <p className="text-blue-100 text-lg">
              به سامانه جامع برنامه‌ریزی دانشگاه خوش آمدید
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}