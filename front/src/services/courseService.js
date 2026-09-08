import api from './api';

const courseService = {
  // دریافت لیست دروس
  getAll: async (universityId = null) => {
    try {
      const params = {};
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/courses/', { params });
      
      let coursesData = [];
      if (response.data?.results) {
        coursesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data?.data) {
        coursesData = response.data.data;
      }

      return {
        success: true,
        data: coursesData,
        message: 'لیست دروس با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت لیست دروس:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست دروس',
        data: []
      };
    }
  },

  // دریافت جزئیات درس
  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/courses/${id}/`);
      
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات درس با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات درس',
        data: null
      };
    }
  },

  // ایجاد درس جدید
  create: async (courseData) => {
    try {
      // تبدیل داده‌ها به فرمت بک‌اند
      const formattedData = courseService.formatCourseData(courseData);
      
      const response = await api.post('/scheduling/api/courses/', formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'درس با موفقیت ثبت شد'
      };
    } catch (error) {
      console.error('خطا در ثبت درس:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ثبت درس',
        data: null
      };
    }
  },

  // ویرایش درس
  update: async (id, courseData) => {
    try {
      const formattedData = courseService.formatCourseData(courseData);
      const response = await api.put(`/scheduling/api/courses/${id}/`, formattedData);
      
      return {
        success: true,
        data: response.data,
        message: 'درس با موفقیت ویرایش شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ویرایش درس',
        data: null
      };
    }
  },

  // حذف درس
  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/courses/${id}/`);
      
      return {
        success: true,
        message: 'درس با موفقیت حذف شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف درس'
      };
    }
  },

  // تبدیل داده‌های فرم به فرمت بک‌اند
  formatCourseData: (formData) => {
    // دریافت university_id از localStorage یا props
    const universityId = localStorage.getItem('current_university_id') || 1;

    // نقشه تبدیل انواع درس
    const courseTypeMap = {
      'تئوری': 'تئوری',
      'عملی': 'عملی',
      'آزمایشگاهی': 'تئوری_عملی'
    };

    // نقشه تبدیل نوع واحد
    const unitTypeMap = {
      'اصلی': 'تخصصی',
      'پایه': 'پایه',
      'جبرانی': 'عمومی',
      'اختیاری': 'عمومی'
    };

    // پردازش پیش‌نیازها و هم‌نیازها
    const prerequisites = (formData.prerequisites || []).map(p => p.code || p);
    const corequisites = (formData.corequisites || []).map(c => c.code || c);
    const teachers = (formData.teachers || []).map(t => t.id || t);

    return {
      code: formData.code || `C${Date.now()}`,
      name: formData.name,
      course_type: courseTypeMap[formData.type] || formData.type || 'تئوری',
      unit_type: unitTypeMap[formData.unit_type] || formData.unit_type || 'تخصصی',
      units: parseInt(formData.units) || 3,
      priority: parseInt(formData.priority) || 1,
      gender: parseInt(formData.gender) || 0,
      required_place_type: formData.required_place_type || 'کلاس تئوری',
      prerequisites: prerequisites,
      corequisites: corequisites,
      expected_students: parseInt(formData.expected_students) || 30,
      teachers: teachers,
      required_place: formData.required_place || null,
      fixed: formData.fixed || false,
      university_config: parseInt(formData.university_config) || parseInt(universityId),
    };
  },

  // جستجوی دروس
  search: async (query, universityId = null) => {
    try {
      const params = { search: query };
      if (universityId) {
        params.university_id = universityId;
      }
      
      const response = await api.get('/scheduling/api/courses/', { params });
      
      let coursesData = [];
      if (response.data?.results) {
        coursesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        coursesData = response.data;
      }

      return {
        success: true,
        data: coursesData,
        message: 'نتیجه جستجو با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در جستجوی دروس',
        data: []
      };
    }
  },

  // اعتبارسنجی کد درس
  validateCode: async (code, universityId) => {
    try {
      const response = await api.get('/scheduling/api/courses/', {
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
        message: exists ? 'این کد درس قبلاً ثبت شده است' : 'کد درس قابل استفاده است'
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی کد درس'
      };
    }
  }
};

export default courseService;