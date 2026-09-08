import api from './api';

const placeService = {
  // دریافت لیست کلاس‌ها
  getAll: async (universityId = null) => {
    try {
      const params = {};
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/places/', { params });
      
      let placesData = [];
      if (response.data?.results) {
        placesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        placesData = response.data;
      } else if (response.data?.data) {
        placesData = response.data.data;
      }

      return {
        success: true,
        data: placesData,
        message: 'لیست کلاس‌ها با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت لیست کلاس‌ها:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست کلاس‌ها',
        data: []
      };
    }
  },

  // دریافت جزئیات کلاس
  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/places/${id}/`);
      
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات کلاس با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات کلاس',
        data: null
      };
    }
  },

  // ایجاد کلاس جدید
  create: async (placeData) => {
    try {
      const formattedData = placeService.formatPlaceData(placeData);
      const response = await api.post('/scheduling/api/places/', formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'کلاس با موفقیت ثبت شد'
      };
    } catch (error) {
      console.error('خطا در ثبت کلاس:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ثبت کلاس',
        data: null
      };
    }
  },

  // ویرایش کلاس
  update: async (id, placeData) => {
    try {
      const formattedData = placeService.formatPlaceData(placeData);
      const response = await api.put(`/scheduling/api/places/${id}/`, formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'کلاس با موفقیت ویرایش شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ویرایش کلاس',
        data: null
      };
    }
  },

  // حذف کلاس
  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/places/${id}/`);
      
      return {
        success: true,
        message: 'کلاس با موفقیت حذف شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف کلاس'
      };
    }
  },

  // تبدیل داده‌های فرم به فرمت بک‌اند
  formatPlaceData: (formData) => {
    const universityId = localStorage.getItem('current_university_id') || 1;

    // تبدیل امکانات
    let facilities = formData.facilities || [];
    if (typeof facilities === 'string') {
      try {
        facilities = JSON.parse(facilities);
      } catch {
        facilities = facilities.split(',').map(f => ({ name: f.trim() }));
      }
    }

    return {
      code: formData.code || `P${Date.now()}`,
      name: formData.name,
      capacity: parseInt(formData.capacity) || 30,
      place_type: formData.type || formData.place_type || 'کلاس تئوری',
      gender: parseInt(formData.gender) || 0,
      facilities: facilities,
      available: formData.available === 'true' || formData.available === true,
      university_config: parseInt(universityId),
    };
  },

  // جستجوی کلاس‌ها
  search: async (query, universityId = null) => {
    try {
      const params = { search: query };
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/places/', { params });
      
      let placesData = [];
      if (response.data?.results) {
        placesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        placesData = response.data;
      }

      return {
        success: true,
        data: placesData,
        message: 'نتیجه جستجو با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در جستجوی کلاس‌ها',
        data: []
      };
    }
  },

  // اعتبارسنجی کد کلاس
  validateCode: async (code, universityId) => {
    try {
      const response = await api.get('/scheduling/api/places/', {
        params: { code, university_id: universityId }
      });
      
      let exists = false;
      if (response.data?.results) {
        exists = response.data.results.length > 0;
      } else if (Array.isArray(response.data)) {
        exists = response.data.length > 0;
      }
      
      return {
        success: true,
        exists: exists,
        message: exists ? 'این کد کلاس قبلاً ثبت شده است' : 'کد کلاس قابل استفاده است'
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی کد کلاس'
      };
    }
  }
};

export default placeService;