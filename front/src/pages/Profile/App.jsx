import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProfileForm from './components/ProfileForm';
import ProfileInfo from './components/ProfileInfo';
import ChangePassword from './components/ChangePassword';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

export default function App() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'edit', 'password'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دریافت اطلاعات پروفایل
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/account/api/profile/');
      if (response.data.success) {
        setProfileData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات پروفایل');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // بررسی وجود توکن
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    fetchProfile();
  }, []);

  // به‌روزرسانی پروفایل
  const handleUpdateProfile = async (formData) => {
    try {
      const response = await api.put('/account/api/profile/', formData);
      if (response.data.success) {
        await fetchProfile(); // دریافت مجدد اطلاعات
        setActiveTab('profile');
        alert('پروفایل با موفقیت به‌روزرسانی شد');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در به‌روزرسانی پروفایل');
    }
  };

  // تغییر رمز عبور
  const handleChangePassword = async (passwordData) => {
    try {
      const response = await api.post('/account/api/change-password/', passwordData);
      if (response.data.success) {
        setActiveTab('profile');
        alert('رمز عبور با موفقیت تغییر یافت');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'خطا در تغییر رمز عبور');
    }
  };

  // خروج از سیستم
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await api.post('/account/api/logout/', { refresh: refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('current_university_id');
      window.location.href = '/login';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProfile} />;
  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* هدر */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              پروفایل کاربری
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              خروج
            </button>
          </div>
          
          {/* تب‌ها */}
          <div className="flex space-x-4 space-x-reverse mt-4 border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              مشاهده پروفایل
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 ${activeTab === 'edit' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              ویرایش پروفایل
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 ${activeTab === 'password' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            >
              تغییر رمز عبور
            </button>
          </div>
        </div>

        {/* محتوای تب‌ها */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {activeTab === 'profile' && (
            <ProfileInfo data={profileData} />
          )}
          {activeTab === 'edit' && (
            <ProfileForm 
              initialData={profileData} 
              onSubmit={handleUpdateProfile}
              onCancel={() => setActiveTab('profile')}
            />
          )}
          {activeTab === 'password' && (
            <ChangePassword 
              onSubmit={handleChangePassword}
              onCancel={() => setActiveTab('profile')}
            />
          )}
        </div>
      </div>
    </div>
  );
}