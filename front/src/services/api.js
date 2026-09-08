// src/services/api.js
import axios from 'axios';
import toast from '../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 ثانیه timeout
  withCredentials: false,
});

// متغیر برای جلوگیری از رفرش همزمان توکن
let isRefreshing = false;
let failedQueue = [];

// پردازش صف درخواست‌های ناموفق
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor برای اضافه کردن توکن
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor برای مدیریت خطاها و تازه‌سازی توکن
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // اگر خطای شبکه باشد (سرور در دسترس نیست)
    if (!error.response) {
      toast.error('سرور در دسترس نیست. لطفاً اتصال خود را بررسی کنید.');
      return Promise.reject(error);
    }

    // اگر خطای 401 و توکن منقضی شده باشد
    // (درخواست‌های ورود/ثبت‌نام را مستثنی می‌کنیم چون 401 آن‌ها یعنی «رمز اشتباه»
    // نه «توکن منقضی شده»، و کاربر هنوز اصلاً توکنی برای رفرش کردن ندارد)
    const isAuthEndpoint =
      originalRequest.url?.includes('/account/api/login/') ||
      originalRequest.url?.includes('/account/api/register/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // اگر درخواست رفرش توکن باشد، نباید دوباره تلاش کند
      if (originalRequest.url?.includes('/account/api/refresh/')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // اگر در حال رفرش توکن هستیم، درخواست را در صف قرار بده
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('رفرش توکن موجود نیست');
        }

        // استفاده از URL صحیح با prefix account/
        const response = await axios.post(
          `${API_BASE_URL}/account/api/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data?.success && response.data?.access) {
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // به‌روزرسانی توکن در هدر درخواست اصلی
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // پردازش صف درخواست‌های منتظر
          processQueue(null, newAccessToken);
          
          // تکرار درخواست اصلی
          return api(originalRequest);
        } else {
          throw new Error('پاسخ رفرش توکن نامعتبر است');
        }
      } catch (refreshError) {
        // خطا در تازه‌سازی توکن - کاربر باید دوباره وارد شود
        processQueue(refreshError, null);
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // نمایش پیام فقط اگر در صفحه login نباشیم
        if (window.location.pathname !== '/login') {
          toast.error('نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
          // تاخیر کوتاه برای نمایش پیام قبل از ریدایرکت
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // مدیریت سایر خطاها بر اساس status code
    if (error.response) {
      switch (error.response.status) {
        case 400:
          // خطای اعتبارسنجی - در auth.service مدیریت می‌شود
          break;
        case 403:
          toast.error('شما دسترسی به این بخش را ندارید');
          break;
        case 404:
          toast.error('منبع مورد نظر یافت نشد');
          break;
        case 423:
          toast.error('حساب کاربری شما قفل شده است');
          break;
        case 429:
          toast.error('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید');
          break;
        case 500:
          toast.error('خطای سرور. لطفاً بعداً تلاش کنید');
          break;
        default:
          // بررسی وجود پیام خطا در پاسخ
          if (error.response.data?.message) {
            // پیام‌های خطا در auth.service نمایش داده می‌شوند
          } else if (error.response.data?.errors) {
            // خطاهای اعتبارسنجی در auth.service نمایش داده می‌شوند
          } else {
            toast.error('خطایی رخ داده است');
          }
          break;
      }
    }

    return Promise.reject(error);
  }
);

// متد کمکی برای بررسی اتصال به سرور
api.checkConnection = async () => {
  try {
    await api.get('/account/api/validate-token/', { timeout: 5000 });
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      // توکن نامعتبر است اما سرور در دسترس است
      return true;
    }
    return false;
  }
};

// متد کمکی برای تست API
api.testConnection = async () => {
  try {
    const response = await api.get('/account/api/permissions/', { 
      timeout: 5000,
      // برای تست اتصال، اگر 401 برگشت یعنی سرور در دسترس است
      validateStatus: (status) => status === 200 || status === 401
    });
    return true;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
};

export default api;