// src/components/ProfileMenu.jsx
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import toast from '../utils/toast';

export default function ProfileMenu({ onClose }) {
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = async () => {
    await authService.logout();
    toast.success('با موفقیت خارج شدید');
    navigate('/');
    if (onClose) onClose();
  };

  if (!user) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 min-w-[160px] py-2">
        <Link
          to="/login"
          onClick={onClose}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ورود به سیستم
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200 min-w-[180px] py-2">
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-800">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-gray-500">
          {user.role_display || user.role}
        </p>
      </div>
      
      <a
        href="/src/pages/Profile/Profile.html"
        onClick={onClose}
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        پروفایل من
      </a>
      
      <Link
        to={authService.getDashboardPath()}
        onClick={onClose}
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        داشبورد
      </Link>
      
      <hr className="my-1 border-gray-100" />
      
      <button
        onClick={handleLogout}
        className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        خروج از سیستم
      </button>
    </div>
  );
}