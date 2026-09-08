// src/components/Header.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/images/favicon.png";
import profile from "../assets/svg/profile.svg";
import ProfileMenu from "./ProfileMenu";
import { Menu, X } from "lucide-react";
import authService from "../services/auth";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);
  const menuRef = useRef(null);
  const [menuOpenProfile, setMenuOpenProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "صفحه اصلی", href: "/" },
  ];

  // بررسی وضعیت احراز هویت
  useEffect(() => {
    const checkAuth = () => {
      const auth = authService.isAuthenticated();
      setIsAuthenticated(auth);
      if (auth) {
        const userData = authService.getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // رویداد 'storage' فقط بین تب‌های مختلف مرورگر فایر می‌شود، نه داخل همین تب؛
    // به همین دلیل رویداد سفارشی 'auth-changed' را هم گوش می‌دهیم که در همان لحظه‌ی
    // login/logout (در همین تب) از auth.js ارسال می‌شود.
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-changed', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-changed', checkAuth);
    };
  }, []);

  // شبکه‌ی اطمینان اضافه: با هر تغییر مسیر هم وضعیت را دوباره بررسی می‌کنیم
  // (مثلاً بلافاصله بعد از ریدایرکت صفحه‌ی ورود به داشبورد)
  useEffect(() => {
    const auth = authService.isAuthenticated();
    setIsAuthenticated(auth);
    setUser(auth ? authService.getUser() : null);
  }, [location.pathname]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.scrollHeight);
    }
  }, [menuOpen]);

  // بستن منوی پروفایل با کلیک بیرون از آن
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-menu-trigger')) {
        setMenuOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // خروج از سیستم
  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
    setMenuOpenProfile(false);
  };

  // دریافت نقش کاربر برای نمایش
  const getRoleDisplay = () => {
    if (!user) return '';
    const roles = {
      admin: 'مدیر',
      education_officer: 'مسئول آموزش',
      teacher: 'استاد',
      supervisor: 'سوپروایزر',
    };
    return roles[user.role] || user.role;
  };

  return (
    <header className="w-full bg-bg shadow-md fixed top-0 z-50 h-20 md:h-24 flex justify-center items-center">
      <div className="container mx-auto px-4 sm:px-6 py-2 md:py-3 w-full flex items-center justify-between">
        {/* موبایل */}
        <div className="flex items-center justify-between w-full md:hidden">
          {/* منوی همبرگری */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* لوگو */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <span className="text-base font-secondary text-text_primary_color whitespace-nowrap hidden mobile:inline">
              سامانه برنامه ریزی دانشگاه ها
            </span>
          </Link>

          {/* پروفایل */}
          <div className="relative profile-menu-trigger">
            <img
              src={profile}
              alt="پروفایل کاربر"
              className="w-6 h-6 cursor-pointer"
              onClick={() => {
                if (isAuthenticated) {
                  setMenuOpenProfile(!menuOpenProfile);
                } else {
                  navigate('/login');
                }
              }}
            />
            {menuOpenProfile && isAuthenticated && (
              <div className="absolute left-0 top-10">
                <ProfileMenu onClose={() => setMenuOpenProfile(false)} />
              </div>
            )}
          </div>
        </div>

        {/* دسکتاپ */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* لوگو */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-14 h-14" />
            <span className="text-xl text-text_primary_color font-secondary md:hidden lg:inline">
              سامانه برنامه ریزی دانشگاه ها
            </span>
          </Link>

          {/* منو */}
          <nav className="flex gap-8 text-text_secondary_color font-medium font-primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="transition-colors hover:text-blue-600"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* پروفایل */}
          <div className="relative profile-menu-trigger">
            <img
              src={profile}
              alt="پروفایل کاربر"
              className="w-7 h-7 cursor-pointer"
              onClick={() => {
                if (isAuthenticated) {
                  setMenuOpenProfile(!menuOpenProfile);
                } else {
                  navigate('/login');
                }
              }}
            />
            {menuOpenProfile && isAuthenticated && (
              <div className="absolute left-0 top-12">
                <ProfileMenu onClose={() => setMenuOpenProfile(false)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* منوی موبایل */}
      <div
        ref={menuRef}
        style={{
          maxHeight: menuOpen ? `${menuHeight}px` : "0px",
          opacity: menuOpen ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.4s ease",
          overflow: "hidden",
        }}
        className="absolute top-20 right-0 w-full bg-bg shadow-md md:hidden"
      >
        <ul className="flex flex-col items-center py-3 gap-3 text-text_secondary_color font-primary text-sm">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-1 hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            </li>
          ))}
          
          {/* گزینه‌های اضافی در منوی موبایل */}
          {isAuthenticated ? (
            <>
              <li className="w-full border-t border-gray-200 pt-2">
                <a
                  href="/src/pages/Profile/Profile.html"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-1 hover:text-blue-600 transition-colors"
                >
                  پروفایل
                </a>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-1 hover:text-blue-600 transition-colors"
                >
                  داشبورد
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="block px-4 py-1 text-red-600 hover:text-red-700 transition-colors"
                >
                  خروج
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                ورود
              </Link>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}