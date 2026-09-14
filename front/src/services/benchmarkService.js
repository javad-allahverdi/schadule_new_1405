// src/services/benchmarkService.js
//
// سرویس «مجموعه‌های داده‌ی آزمون» (Benchmark Seeds).
//
// جریان کار: دریافت فهرست مجموعه‌ها → نمایش داده‌ها به کاربر → بارگذاری در
// قالب یک نیمسال جدید → اجرای الگوریتم (از تب زمان‌بندی) → مقایسه‌ی خروجی با
// پاسخ مرجع همان مجموعه.
import api from './api';

const benchmarkService = {
  // فهرست مجموعه‌ها با خلاصه‌ی آماری
  getSeeds: async (universityId = null) => {
    try {
      const response = await api.get('/scheduling/api/benchmarks/seeds/', {
        params: universityId ? { university_id: universityId } : {},
      });
      return { success: true, data: response.data.results || [] };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت مجموعه‌های داده‌ی آزمون',
        data: [],
      };
    }
  },

  // جزئیات کامل یک مجموعه (داده‌های ورودی + پاسخ مرجع)
  getSeed: async (seedKey) => {
    try {
      const response = await api.get(`/scheduling/api/benchmarks/seeds/${seedKey}/`);
      return { success: true, data: response.data.seed };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت جزئیات مجموعه',
        data: null,
      };
    }
  },

  // بارگذاری مجموعه به‌صورت یک نیمسال جدید (به‌همراه یک وظیفه‌ی آماده‌ی اجرا)
  loadSeed: async (seedKey, options = {}) => {
    try {
      const response = await api.post(
        `/scheduling/api/benchmarks/seeds/${seedKey}/load/`,
        {
          create_task: options.createTask !== false,
          config_name: options.configName || undefined,
          algorithm_params: options.algorithmParams || undefined,
          // فقط برای سوپروایزر معنا دارد؛ برای بقیه‌ی نقش‌ها سرور دانشگاه خود
          // کاربر را استفاده می‌کند و این مقدار نادیده گرفته می‌شود
          university_id: options.universityId || undefined,
        },
        // بارگذاری داده‌های بزرگ (مثل مجموعه‌ی پنجم) ممکن است از timeout پیش‌فرض
        // ۱۵ ثانیه‌ای بیشتر طول بکشد، چون ده‌ها رکورد در یک تراکنش ساخته می‌شود.
        { timeout: 60000 }
      );
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          'خطا در بارگذاری داده‌های آزمون',
      };
    }
  },

  // مقایسه‌ی نتیجه‌ی یک اجرا با پاسخ مرجع
  compare: async (taskId, seedKey = null) => {
    try {
      const response = await api.get(
        `/scheduling/api/scheduling-tasks/${taskId}/compare/`,
        { params: seedKey ? { seed_key: seedKey } : {}, timeout: 60000 }
      );
      return { success: true, data: response.data.comparison };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.response?.data?.detail ||
          'خطا در مقایسه با پاسخ مرجع',
      };
    }
  },
};

export default benchmarkService;
