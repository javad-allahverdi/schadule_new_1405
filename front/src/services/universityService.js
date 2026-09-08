import api from './api';

const universityService = {
  // دریافت لیست دانشگاه‌ها
  getAll: async () => {
    try {
      const response = await api.get('/scheduling/api/universities/');
      
      // نرمالایز کردن داده‌ها
      let universitiesData = [];
      if (response.data?.results) {
        universitiesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        universitiesData = response.data;
      } else if (response.data?.data) {
        universitiesData = response.data.data;
      }

      return {
        success: true,
        data: universitiesData,
        message: 'لیست دانشگاه‌ها با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت لیست دانشگاه‌ها:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست دانشگاه‌ها',
        data: []
      };
    }
  },

  // دریافت جزئیات دانشگاه
  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/`);
      
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات دانشگاه با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت اطلاعات دانشگاه:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات دانشگاه',
        data: null
      };
    }
  },

  // ایجاد دانشگاه جدید
  create: async (universityData) => {
    try {
      // اعتبارسنجی داده‌ها
      if (!universityData.name) {
        return {
          success: false,
          message: 'نام دانشگاه الزامی است',
          data: null
        };
      }

      const response = await api.post('/scheduling/api/universities/', universityData);
      
      return {
        success: true,
        data: response.data,
        message: 'دانشگاه با موفقیت ایجاد شد'
      };
    } catch (error) {
      console.error('خطا در ایجاد دانشگاه:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ایجاد دانشگاه',
        data: null
      };
    }
  },

  // ویرایش دانشگاه
  update: async (id, universityData) => {
    try {
      const response = await api.put(`/scheduling/api/universities/${id}/`, universityData);
      
      return {
        success: true,
        data: response.data,
        message: 'دانشگاه با موفقیت ویرایش شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ویرایش دانشگاه',
        data: null
      };
    }
  },

  // حذف دانشگاه
  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/universities/${id}/`);
      
      return {
        success: true,
        message: 'دانشگاه با موفقیت حذف شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف دانشگاه'
      };
    }
  },

  // کپی کردن اساتید/مکان‌ها/دروس/گروه‌های دانشجویی از یک نیمسال دیگر به این نیمسال
  copyFrom: async (targetId, sourceId, options = {}) => {
    try {
      const payload = {
        source_id: sourceId,
        copy_teachers: options.copy_teachers ?? true,
        copy_places: options.copy_places ?? true,
        copy_courses: options.copy_courses ?? false,
        copy_groups: options.copy_groups ?? false,
      };
      const response = await api.post(`/scheduling/api/universities/${targetId}/copy_from/`, payload);
      return {
        success: response.data.success,
        message: response.data.message,
        counts: response.data.counts,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در کپی کردن اطلاعات',
      };
    }
  },

  // دانلود همه‌ی اطلاعات ورودی این نیمسال (اساتید/دروس/مکان‌ها/گروه‌ها) به‌صورت اکسل
  exportDataToExcel: async (id, semesterName = 'semester') => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/export_excel/`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${semesterName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      let message = 'خطا در دانلود فایل اکسل';
      try {
        if (error.response?.data instanceof Blob) {
          const text = await error.response.data.text();
          try {
            const parsed = JSON.parse(text);
            message = parsed.message || parsed.detail || text || message;
          } catch {
            message = text || message;
          }
        } else if (error.response?.data?.message) {
          message = error.response.data.message;
        }
      } catch (parseErr) {
        // اگر خواندن Blob هم شکست خورد، همان پیام پیش‌فرض باقی می‌ماند
      }
      console.error('خطای دانلود اکسل نیمسال:', { status: error.response?.status, message });
      return {
        success: false,
        message: `${message}${error.response?.status ? ` (کد ${error.response.status})` : ''}`,
      };
    }
  },

  // دریافت آمار دانشگاه
  getStats: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/stats/`);
      
      return {
        success: true,
        data: response.data,
        message: 'آمار دانشگاه با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت آمار دانشگاه:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت آمار دانشگاه',
        data: null
      };
    }
  },

  // دریافت پیکربندی دانشگاه (روزها و ساعت‌ها)
  getConfig: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/`);
      
      const config = {
        days_of_week: response.data.days_of_week || [],
        time_slots: response.data.time_slots || [],
        max_units_per_student: response.data.max_units_per_student || 20,
        max_classes_per_day: response.data.max_classes_per_day || 3,
      };

      return {
        success: true,
        data: config,
        message: 'پیکربندی دانشگاه با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت پیکربندی دانشگاه',
        data: null
      };
    }
  },

  // به‌روزرسانی پیکربندی دانشگاه
  updateConfig: async (id, configData) => {
    try {
      const response = await api.put(`/scheduling/api/universities/${id}/`, configData);
      
      return {
        success: true,
        data: response.data,
        message: 'پیکربندی دانشگاه با موفقیت به‌روزرسانی شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در به‌روزرسانی پیکربندی',
        data: null
      };
    }
  },

  // دریافت لیست روزهای هفته فعال دانشگاه
  getActiveDays: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/`);
      
      const activeDays = (response.data.days_of_week || [])
        .filter(day => day.enabled)
        .map(day => ({
          id: day.id,
          name: day.name,
          value: day.name,
        }));

      return {
        success: true,
        data: activeDays,
        message: 'روزهای فعال با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت روزهای فعال',
        data: []
      };
    }
  },

  // دریافت لیست بازه‌های زمانی فعال دانشگاه
  getActiveTimeSlots: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${id}/`);
      
      const activeSlots = (response.data.time_slots || [])
        .filter(slot => slot.enabled)
        .map(slot => ({
          id: slot.id,
          label: `${slot.start} - ${slot.end}`,
          start: slot.start,
          end: slot.end,
        }));

      return {
        success: true,
        data: activeSlots,
        message: 'بازه‌های زمانی فعال با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت بازه‌های زمانی',
        data: []
      };
    }
  },

  // دریافت داشبورد دانشگاه (برای مدیر)
  getDashboard: async () => {
    try {
      const response = await api.get('/scheduling/api/dashboard/university/');
      
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات داشبورد با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات داشبورد',
        data: null
      };
    }
  },

  // دریافت لیست دانشگاه‌های کاربر (API ساده)
  getUserUniversities: async () => {
    try {
      const response = await api.get('/scheduling/api/universities/list/');
      
      return {
        success: true,
        data: response.data.universities || [],
        message: 'لیست دانشگاه‌های کاربر با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست دانشگاه‌ها',
        data: []
      };
    }
  },

  // ایجاد دانشگاه جدید (API ساده)
  createSimple: async (name, semester = 'نیمسال اول') => {
    try {
      const response = await api.post('/scheduling/api/universities/create/', {
        name,
        semester
      });
      
      return {
        success: true,
        data: response.data.university,
        message: response.data.message || 'دانشگاه با موفقیت ایجاد شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ایجاد دانشگاه',
        data: null
      };
    }
  },

  // دریافت آمار سریع دانشگاه
  getQuickStats: async (universityId) => {
    try {
      const response = await api.get(`/scheduling/api/universities/${universityId}/stats/`);
      
      return {
        success: true,
        data: response.data.stats,
        message: 'آمار دانشگاه با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت آمار دانشگاه',
        data: null
      };
    }
  },

  // تبدیل داده‌های فرم به فرمت بک‌اند
  formatUniversityData: (formData, universityId = null) => {
    const payload = {
      name: formData.name,
      semester: formData.semester || 'نیمسال اول',
      days_of_week: formData.days_of_week || [
        { id: 0, name: "شنبه", enabled: true },
        { id: 1, name: "یکشنبه", enabled: true },
        { id: 2, name: "دوشنبه", enabled: true },
        { id: 3, name: "سه‌شنبه", enabled: true },
        { id: 4, name: "چهارشنبه", enabled: true }
      ],
      time_slots: formData.time_slots || [
        { id: 0, start: "08:00", end: "10:00", enabled: true },
        { id: 1, start: "10:00", end: "12:00", enabled: true },
        { id: 2, start: "14:00", end: "16:00", enabled: true },
        { id: 3, start: "16:00", end: "18:00", enabled: true }
      ],
      max_units_per_student: parseInt(formData.max_units_per_student) || 20,
      max_classes_per_day: parseInt(formData.max_classes_per_day) || 3,
    };
    if (universityId) {
      payload.university = parseInt(universityId);
    }
    return payload;
  },

  // اعتبارسنجی نام دانشگاه
  validateName: async (name) => {
    try {
      const response = await api.get('/scheduling/api/universities/', {
        params: { search: name }
      });
      
      let exists = false;
      if (response.data?.results) {
        exists = response.data.results.some(u => u.name === name);
      } else if (Array.isArray(response.data)) {
        exists = response.data.some(u => u.name === name);
      }
      
      return {
        success: true,
        exists: exists,
        message: exists ? 'این نام دانشگاه قبلاً ثبت شده است' : 'نام دانشگاه قابل استفاده است'
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی نام دانشگاه'
      };
    }
  }
};

export default universityService;