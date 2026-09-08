import api from './api';

const GENDER_MAP = { man: 1, male: 1, woman: 2, female: 2 };
const GENDER_MAP_REVERSE = { 1: 'man', 2: 'woman' };

const DEGREE_MAP = { bachelor: 1, master: 2, phd: 3 };
const DEGREE_MAP_REVERSE = { 1: 'bachelor', 2: 'master', 3: 'phd' };

const EMPLOYMENT_MAP = { full_time: 1, part_time: 2, hourly: 3 };
const EMPLOYMENT_MAP_REVERSE = { 1: 'full_time', 2: 'part_time', 3: 'hourly' };

// پست دانشگاهی؛ چون در بک‌اند فیلد آزاد است (بدون choices ثابت)، همان عدد نگه داشته می‌شود
const POSITION_MAP = { instructor: 1, assistant_professor: 2, associate_professor: 3, professor: 4 };
const POSITION_MAP_REVERSE = { 1: 'instructor', 2: 'assistant_professor', 3: 'associate_professor', 4: 'professor' };

function getActiveUniversityConfigId() {
  return localStorage.getItem('current_university_id');
}

function formatTeacherData(formData) {
  const universityConfigId = formData.university_config || getActiveUniversityConfigId();

  return {
    code: formData.code || `T${Date.now()}`,
    full_name: formData.full_name || `${formData.name || ''} ${formData.last_name || ''}`.trim(),
    gender: GENDER_MAP[formData.gender] || parseInt(formData.gender) || 1,
    degree: DEGREE_MAP[formData.degree] || parseInt(formData.degree) || 1,
    employment_type: EMPLOYMENT_MAP[formData.employment_type] || parseInt(formData.employment_type) || 1,
    position: POSITION_MAP[formData.position] || parseInt(formData.position) || 1,
    min_units: parseInt(formData.min_units) || 0,
    max_units: parseInt(formData.max_units) || 0,
    unavailable_times: formData.unavailable_times || [],
    university_config: parseInt(universityConfigId) || null,
  };
}

const teacherService = {
  // دریافت لیست اساتید
  getAll: async (universityId = null) => {
    try {
      const params = {};
      const effectiveId = universityId || getActiveUniversityConfigId();
      if (effectiveId) params.university_id = effectiveId;

      const response = await api.get('/scheduling/api/teachers/', { params });

      let teachersData = [];
      if (response.data?.results) teachersData = response.data.results;
      else if (Array.isArray(response.data)) teachersData = response.data;
      else if (response.data?.data) teachersData = response.data.data;

      return {
        success: true,
        data: teachersData,
        message: 'لیست اساتید با موفقیت دریافت شد'
      };
    } catch (error) {
      console.error('خطا در دریافت لیست اساتید:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست اساتید',
        data: []
      };
    }
  },

  // دریافت جزئیات یک استاد
  getById: async (id) => {
    try {
      const response = await api.get(`/scheduling/api/teachers/${id}/`);
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات استاد با موفقیت دریافت شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اطلاعات استاد',
        data: null
      };
    }
  },

  // ثبت استاد جدید
  create: async (formData) => {
    try {
      const teacherData = formatTeacherData(formData);

      if (!teacherData.university_config) {
        return {
          success: false,
          message: 'دانشگاه/نیمسال فعال مشخص نیست. لطفاً ابتدا یک نیمسال انتخاب کنید.',
          data: null
        };
      }

      const response = await api.post('/scheduling/api/teachers/', teacherData);
      return {
        success: true,
        data: response.data,
        message: 'استاد با موفقیت ثبت شد'
      };
    } catch (error) {
      console.error('خطا در ثبت استاد:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.detail || 'خطا در ثبت استاد',
        data: null,
        errors: error.response?.data,
      };
    }
  },

  // ویرایش استاد
  update: async (id, formData) => {
    try {
      const teacherData = formatTeacherData(formData);
      const response = await api.put(`/scheduling/api/teachers/${id}/`, teacherData);
      return {
        success: true,
        data: response.data,
        message: 'اطلاعات استاد با موفقیت ویرایش شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ویرایش استاد',
        data: null,
        errors: error.response?.data,
      };
    }
  },

  // حذف استاد
  delete: async (id) => {
    try {
      await api.delete(`/scheduling/api/teachers/${id}/`);
      return { success: true, message: 'استاد با موفقیت حذف شد' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف استاد'
      };
    }
  },

  // جستجوی اساتید
  search: async (query, universityId = null) => {
    try {
      const params = { search: query };
      const effectiveId = universityId || getActiveUniversityConfigId();
      if (effectiveId) params.university_id = effectiveId;

      const response = await api.get('/scheduling/api/teachers/', { params });

      let teachersData = [];
      if (response.data?.results) teachersData = response.data.results;
      else if (Array.isArray(response.data)) teachersData = response.data;

      return { success: true, data: teachersData, message: 'نتیجه جستجو با موفقیت دریافت شد' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در جستجوی اساتید',
        data: []
      };
    }
  },

  // اساتیدی که هنوز حساب کاربری برای ورود ندارند
  getWithoutAccount: async () => {
    try {
      const response = await api.get('/scheduling/api/teachers/without_account/');
      return { success: true, data: response.data, message: 'دریافت شد' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت لیست',
        data: []
      };
    }
  },

  // ایجاد حساب کاربری برای یک استاد تا بتواند وارد سیستم شود
  createUserAccount: async (teacherId, accountData = {}) => {
    try {
      const response = await api.post(`/scheduling/api/teachers/${teacherId}/create_user_account/`, accountData);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'حساب کاربری با موفقیت ایجاد شد'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ایجاد حساب کاربری',
        data: null
      };
    }
  },

  // اعتبارسنجی کد استاد (یکتا بودن در دانشگاه)
  validateCode: async (code, universityId) => {
    try {
      const effectiveId = universityId || getActiveUniversityConfigId();
      const response = await api.get('/scheduling/api/teachers/', {
        params: { search: code, university_id: effectiveId }
      });

      let exists = false;
      const list = response.data?.results || (Array.isArray(response.data) ? response.data : []);
      exists = list.some(t => t.code === code);

      return {
        success: true,
        exists,
        message: exists ? 'این کد استاد قبلاً ثبت شده است' : 'کد استاد قابل استفاده است'
      };
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error.response?.data?.message || 'خطا در اعتبارسنجی کد استاد'
      };
    }
  },

  // تبدیل داده‌ی بک‌اند به فرمت فرم (برای پرکردن فرم ویرایش)
  toFormData: (teacher) => {
    if (!teacher) return null;
    const nameParts = (teacher.full_name || '').split(' ');
    return {
      id: teacher.id,
      code: teacher.code,
      name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      full_name: teacher.full_name,
      gender: GENDER_MAP_REVERSE[teacher.gender] || 'man',
      degree: DEGREE_MAP_REVERSE[teacher.degree] || 'bachelor',
      employment_type: EMPLOYMENT_MAP_REVERSE[teacher.employment_type] || 'full_time',
      position: POSITION_MAP_REVERSE[teacher.position] || 'instructor',
      min_units: teacher.min_units,
      max_units: teacher.max_units,
      unavailable_times: teacher.unavailable_times || [],
      university_config: teacher.university_config,
      has_account: !!teacher.user,
    };
  },

  formatTeacherData,
};

export default teacherService;
