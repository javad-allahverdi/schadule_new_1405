// src/components/ProtectedRoute.jsx
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/login');
  const location = useLocation();

  useEffect(() => {
    checkAccess();
  }, [location.pathname]);

  const checkAccess = async () => {
    try {
      // بررسی سریع: آیا توکن در localStorage وجود دارد؟
      const token = localStorage.getItem('access_token');
      if (!token) {
        setHasAccess(false);
        setRedirectPath('/login');
        setLoading(false);
        return;
      }

      // بررسی اطلاعات کاربر در localStorage
      const user = authService.getUser();
      if (!user) {
        // اگر کاربر در localStorage نیست اما توکن هست، باید پروفایل را fetch کنیم
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.user) {
            // اطلاعات کاربر دریافت شد، حالا بررسی نقش
            const currentUser = profileResponse.user;
            
            if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
              // کاربر نقش مجاز را ندارد - هدایت به داشبورد خودش
              const userDashboard = authService.ROLE_DASHBOARD_MAP[currentUser.role] || '/dashboard';
              setHasAccess(false);
              setRedirectPath(userDashboard);
            } else {
              setHasAccess(true);
            }
          } else {
            setHasAccess(false);
            setRedirectPath('/login');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setHasAccess(false);
          setRedirectPath('/login');
        }
      } else {
        // کاربر در localStorage وجود دارد
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          // کاربر نقش مجاز را ندارد
          const userDashboard = authService.ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
          setHasAccess(false);
          setRedirectPath(userDashboard);
        } else {
          setHasAccess(true);
        }
      }
    } catch (error) {
      console.error('ProtectedRoute error:', error);
      setHasAccess(false);
      setRedirectPath('/login');
    } finally {
      setLoading(false);
    }
  };

  // نمایش لودینگ
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // اگر دسترسی ندارد، هدایت کن
  if (!hasAccess) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  // دسترسی مجاز است
  return children;
}