import api from './api';

const studentGroupService = {
  // دریافت لیست گروه‌های دانشجویی
  getAll: async (universityId = null) => {
    try {
      const params = {};
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/student-groups/', { params });
      
      let groupsData = [];
      if (response.data?.results) {
        groupsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        groupsData = response.data;
      } else if (response.data?.data) {
        groupsData = response.data.data;
      }

      return {
        success: true,
        data: groupsData,
        message: 'لیست گروه‌های دانشجویی با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت لیست گروه‌ها:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست گروه‌ها',
        data: []
      };
    }
  },

  // دریافت جزئیات گروه دانشجویی
  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/student-groups/${id}/`);
      
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات گروه با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات گروه',
        data: null
      };
    }
  },

  // ایجاد گروه دانشجویی جدید
  create: async (groupData) => {
    try {
      const formattedData = studentGroupService.formatGroupData(groupData);
      const response = await api.post('/scheduling/api/student-groups/', formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'گروه دانشجویی با موفقیت ثبت شد'
      };
    } catch (error) {
      console.error('خطا در ثبت گروه:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ثبت گروه دانشجویی',
        data: null
      };
    }
  },

  // ویرایش گروه دانشجویی
  update: async (id, groupData) => {
    try {
      const formattedData = studentGroupService.formatGroupData(groupData);
      const response = await api.put(`/scheduling/api/student-groups/${id}/`, formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'گروه دانشجویی با موفقیت ویرایش شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ویرایش گروه',
        data: null
      };
    }
  },

  // حذف گروه دانشجویی
  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/student-groups/${id}/`);
      
      return {
        success: true,
        message: 'گروه دانشجویی با موفقیت حذف شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف گروه'
      };
    }
  },

  // تبدیل داده‌های فرم به فرمت بک‌اند
  formatGroupData: (formData) => {
    const universityId = localStorage.getItem('current_university_id') || 1;

    // پردازش دروس الزامی
    const requiredCourses = (formData.required_courses || []).map(course => {
      if (typeof course === 'object') {
        return course.code || course.id || course;
      }
      return course;
    });

    // پردازش دروس اختیاری
    const optionalCourses = (formData.optional_courses || []).map(course => {
      if (typeof course === 'object') {
        return course.code || course.id || course;
      }
      return course;
    });

    return {
      name: formData.name,
      size: parseInt(formData.size) || 30,
      entry_year: formData.entry_year ? parseInt(formData.entry_year) : null,
      field_of_study: formData.field_of_study || '',
      degree_level: formData.degree_level || 'bachelor',
      gender: parseInt(formData.gender) ?? 0,
      required_courses: requiredCourses,
      optional_courses: optionalCourses,
      university_config: parseInt(universityId),
    };
  },

  // جستجوی گروه‌ها
  search: async (query, universityId = null) => {
    try {
      const params = { search: query };
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/student-groups/', { params });
      
      let groupsData = [];
      if (response.data?.results) {
        groupsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        groupsData = response.data;
      }

      return {
        success: true,
        data: groupsData,
        message: 'نتیجه جستجو با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در جستجوی گروه‌ها',
        data: []
      };
    }
  },

  // اعتبارسنجی نام گروه
  validateName: async (name, universityId) => {
    try {
      const response = await api.get('/scheduling/api/student-groups/', {
        params: { search: name, university_id: universityId }
      });
      
      let exists = false;
      if (response.data?.results) {
        exists = response.data.results.some(g => g.name === name);
      } else if (Array.isArray(response.data)) {
        exists = response.data.some(g => g.name === name);
      }
      
      return {
        success: true,
        exists: exists,
        message: exists ? 'این نام گروه قبلاً ثبت شده است' : 'نام گروه قابل استفاده است'
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی نام گروه'
      };
    }
  }
};

export default studentGroupService;