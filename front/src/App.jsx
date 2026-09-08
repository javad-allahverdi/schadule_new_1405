// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// کامپوننت‌های عمومی
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

// کامپوننت‌های احراز هویت
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

// کامپوننت‌های محافظت شده
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// داشبوردها - مطمئن شوید این فایل‌ها وجود دارند
import AdminDashboard from "./components/AdminDashboard";
import SupervisorDashboard from './components/SupervisorDashboard';
import SupervisorUniversityWorkspace from './components/SupervisorUniversityWorkspace';

// سرویس‌ها
import authService from './services/auth';

// استایل‌ها
import './index.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // اگر کاربر وارد شده باشد و در صفحه اصلی باشد، به داشبورد هدایت شود
  useEffect(() => {
    const user = authService.getUser();
    if (user && location.pathname === '/') {
      const dashboardPath = authService.getDashboardPath();
      navigate(dashboardPath, { replace: true });
    }
  }, []);

  return (
    <div className="app flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-20 md:pt-24"> {/* pt برای offset هدر ثابت */}
        <Routes>
          {/* صفحه اصلی */}
          <Route path="/" element={
            <>
              <Hero />
            </>
          } />
          
          {/* صفحات احراز هویت */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* داشبورد مدیریت */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* داشبورد سوپروایزر */}
          <Route path="/supervisor-dashboard" element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />

          {/* مدیریت یک دانشگاه خاص توسط سوپروایزر */}
          <Route path="/supervisor/university/:universityId" element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorUniversityWorkspace />
            </ProtectedRoute>
          } />
          
          {/* داشبورد عمومی */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SimpleDashboard />
            </ProtectedRoute>
          } />
          
          {/* داشبورد استاد */}
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <SimpleDashboard title="داشبورد استاد" />
            </ProtectedRoute>
          } />
          
          {/* داشبورد کارشناس آموزش */}
          <Route path="/education-officer-dashboard" element={
            <ProtectedRoute allowedRoles={['education_officer']}>
              <SimpleDashboard title="داشبورد کارشناس آموزش" />
            </ProtectedRoute>
          } />
          
          {/* پروفایل */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* صفحه 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// کامپوننت داشبورد ساده
function SimpleDashboard({ title = "داشبورد کاربر" }) {
  const user = authService.getUser();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">خوش آمدید {user?.first_name} {user?.last_name}</p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">نقش: {authService.getRoleDisplay()}</p>
          <p className="text-sm text-gray-500">ایمیل: {user?.email}</p>
        </div>
      </div>
    </div>
  );
}

// صفحه 404
function NotFoundPage() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-800">۴۰۴</h1>
      <p className="text-gray-600 mt-4 text-xl">صفحه مورد نظر یافت نشد</p>
      <button 
        onClick={() => navigate('/')}
        className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        بازگشت به صفحه اصلی
      </button>
    </div>
  );
}

export default App;