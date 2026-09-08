// src/services/schedulingService.js
import api from './api';

function getActiveUniversityConfigId() {
  return localStorage.getItem('current_university_id');
}

const schedulingService = {
  getAll: async () => {
    try {
      const params = {};
      const activeId = getActiveUniversityConfigId();
      if (activeId) params.university_id = activeId;
      const response = await api.get('/scheduling/api/scheduling-tasks/', { params });
      const data = response.data?.results || (Array.isArray(response.data) ? response.data : []);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت لیست وظایف', data: [] };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/scheduling-tasks/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت وظیفه', data: null };
    }
  },

  create: async (formData) => {
    try {
      const activeId = getActiveUniversityConfigId();
      const payload = {
        name: formData.name,
        description: formData.description || '',
        university_config: parseInt(activeId),
        algorithm_params: {
          popsize: parseInt(formData.popsize) || 40,
          maxgen: parseInt(formData.maxgen) || 80,
          teacher_conflict_cost: parseInt(formData.teacher_conflict_cost) || 100,
          place_conflict_cost: parseInt(formData.place_conflict_cost) || 100,
          capacity_cost: parseInt(formData.capacity_cost) || 50,
          gender_mismatch_cost: parseInt(formData.gender_mismatch_cost) || 40,
        },
      };
      const response = await api.post('/scheduling/api/scheduling-tasks/', payload);
      return { success: true, data: response.data, message: 'وظیفه زمان‌بندی ایجاد شد' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.detail || 'خطا در ایجاد وظیفه',
        errors: error.response?.data,
      };
    }
  },

  run: async (id) => {
    try {
      const response = await api.post(`/scheduling/api/scheduling-tasks/${id}/run/`);
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در اجرای الگوریتم' };
    }
  },

  getStatus: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/scheduling-tasks/${id}/status/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در دریافت وضعیت' };
    }
  },

  approve: async (id) => {
    try {
      const response = await api.post(`/scheduling/api/scheduling-tasks/${id}/approve/`);
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در تأیید' };
    }
  },

  reject: async (id, note) => {
    try {
      const response = await api.post(`/scheduling/api/scheduling-tasks/${id}/reject/`, { note });
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در رد کردن' };
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/scheduling-tasks/${id}/`);
      return { success: true, message: 'وظیفه حذف شد' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطا در حذف' };
    }
  },

  getExportUrl: (id, format) => {
    const base = api.defaults.baseURL;
    return `${base}/scheduling/api/scheduling-tasks/${id}/export/?file_format=${format}`;
  },

  exportFile: async (id, format) => {
    try {
      const response = await api.get(`/scheduling/api/scheduling-tasks/${id}/export/`, {
        params: { file_format: format },
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extMap = { pdf: 'pdf', excel: 'xlsx', text: 'txt', json: 'json' };
      link.download = `schedule_${id}.${extMap[format] || format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      // چون responseType='blob' است، پیام خطای واقعی هم به‌صورت Blob برمی‌گردد
      // نه JSON معمولی؛ باید صریحاً آن را به متن تبدیل و parse کنیم، وگرنه
      // پیام واقعی خطا هرگز دیده نمی‌شود و فقط یک پیام عمومی نشان داده می‌شود.
      let message = 'خطا در دانلود فایل';
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
        } else if (error.message) {
          message = error.message;
        }
      } catch (parseErr) {
        // اگر خواندن Blob هم شکست خورد، همان پیام پیش‌فرض باقی می‌ماند
      }

      console.error('خطای دانلود فایل:', {
        status: error.response?.status,
        message,
        url: error.config?.url,
      });

      return {
        success: false,
        message: `${message}${error.response?.status ? ` (کد ${error.response.status})` : ''}`,
      };
    }
  },
};

export default schedulingService;
