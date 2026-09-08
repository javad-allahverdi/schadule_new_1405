// src/services/auth.js
import api from './api';
import toast from '../utils/toast';

class AuthService {
  // نقش‌های معتبر در سیستم
  static VALID_ROLES = [
    'admin',
    'teacher',
    'education_officer',
    'supervisor',
  ];

  // نگاشت نقش‌ها به داشبوردها
  static ROLE_DASHBOARD_MAP = {
    'admin': '/admin-dashboard',
    'teacher': '/teacher-dashboard',
    'education_officer': '/education-officer-dashboard',
    'supervisor': '/supervisor-dashboard',
  };

  // ============================================
  // متدهای API
  // ============================================

  async register(userData) {
    try {
      const response = await api.post('/account/api/register/', userData);
      
      if (response.data.success) {
        this.setTokens(response.data.tokens);
        this.setUser(response.data.user);
        
        toast.success('ثبت نام با موفقیت انجام شد!');
        return response.data;
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async login(credentials, tenantSubdomain = null) {
    try {
      const config = tenantSubdomain
        ? { headers: { 'X-Tenant-Subdomain': tenantSubdomain } }
        : {};
      const response = await api.post('/account/api/login/', credentials, config);
      
      if (response.data.success) {
        this.setTokens(response.data.tokens);
        this.setUser(response.data.user);
        await this.ensureActiveUniversityConfig();
        
        toast.success(`خوش آمدید ${response.data.user.first_name}!`);
        return response.data;
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getPublicUniversities() {
    try {
      const response = await api.get('/account/api/universities/public/');
      return response.data;
    } catch (error) {
      console.error('خطا در دریافت لیست دانشگاه‌ها:', error);
      return { success: false, universities: [] };
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/account/api/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      this.clearAuth();
      toast.success('با موفقیت خارج شدید');
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/account/api/profile/');
      
      if (response.data.success && response.data.user) {
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const response = await api.get('/account/api/dashboard/stats/');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getSupervisorDashboardStats() {
    try {
      const response = await api.get('/account/api/supervisor/dashboard/');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/account/api/users/?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async fetchUserById(userId) {
    try {
      const response = await api.get(`/account/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await api.post('/account/api/users/create/', userData);
      if (response.data.success) {
        toast.success('کاربر با موفقیت ایجاد شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/account/api/users/${userId}/`, userData);
      if (response.data.success) {
        toast.success('اطلاعات کاربر با موفقیت به‌روز شد');
        
        const currentUser = this.getUser();
        if (currentUser && currentUser.id === userId) {
          this.setUser({ ...currentUser, ...userData });
        }
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * تغییر دستی رمز عبور یک کاربر توسط مدیر/سوپروایزر (بدون نیاز به رمز فعلی).
   * برای زمانی که کاربری رمز خود را فراموش کرده است.
   */
  async setUserPassword(userId, newPassword) {
    try {
      const response = await api.post(`/account/api/users/${userId}/set-password/`, {
        new_password: newPassword,
      });
      if (response.data.success) {
        toast.success(response.data.message || 'رمز عبور با موفقیت تغییر یافت');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/account/api/users/${userId}/`);
      if (response.data.success) {
        toast.success('کاربر با موفقیت حذف شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/account/api/profile/', profileData);
      if (response.data.success) {
        toast.success('پروفایل با موفقیت به‌روز شد');
        
        const user = this.getUser();
        if (user) {
          const updatedUser = { ...user };
          if (profileData.first_name) updatedUser.first_name = profileData.first_name;
          if (profileData.last_name) updatedUser.last_name = profileData.last_name;
          if (profileData.email) updatedUser.email = profileData.email;
          if (profileData.phone_number) updatedUser.phone_number = profileData.phone_number;
          if (profileData.department) updatedUser.department = profileData.department;
          this.setUser(updatedUser);
        }
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await api.post('/account/api/change-password/', passwordData);
      if (response.data.success) {
        toast.success('رمز عبور با موفقیت تغییر یافت');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async validateToken() {
    try {
      const response = await api.get('/account/api/validate-token/');
      return response.data;
    } catch (error) {
      return { success: false, valid: false };
    }
  }

  async getPermissions() {
    try {
      const response = await api.get('/account/api/permissions/');
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('توکن رفرش موجود نیست');
      }

      const response = await api.post('/account/api/refresh/', { refresh: refreshToken });
      
      if (response.data.success) {
        localStorage.setItem('access_token', response.data.access);
        return response.data.access;
      }
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  // ============================================
  // متدهای مدیریت توکن و کاربر
  // ============================================

  setTokens(tokens) {
    if (tokens.access) {
      localStorage.setItem('access_token', tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }

  setUser(user) {
    if (user) {
      if (user.role && !AuthService.VALID_ROLES.includes(user.role)) {
        console.warn(`نقش نامعتبر: ${user.role}`);
      }
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-changed'));
    }
  }

  clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('current_university_id');
    window.dispatchEvent(new Event('auth-changed'));
  }

  /**
   * تعیین «پیکربندی نیمسال» فعال (UniversityConfig) کاربر و ذخیره‌ی آن در
   * localStorage تحت کلید current_university_id، تا سرویس‌های دیگر
   * (course/place/teacher/studentGroup) بتوانند بدون نیاز به انتخاب دستی
   * از آن استفاده کنند. سوپروایزر نیازی به این مقدار ندارد.
   */
  /**
   * تعیین «پیکربندی نیمسال» فعال (UniversityConfig) کاربر و ذخیره‌ی آن در
   * localStorage تحت کلید current_university_id، تا سرویس‌های دیگر
   * (course/place/teacher/studentGroup) بتوانند بدون نیاز به انتخاب دستی
   * از آن استفاده کنند. سوپروایزر نیازی به این مقدار ندارد.
   *
   * نکته‌ی مهم: مقدار موجود در localStorage همیشه با لیست واقعی نیمسال‌های
   * قابل‌دسترسِ کاربر اعتبارسنجی می‌شود. اگر آن نیمسال دیگر وجود نداشته باشد
   * (مثلاً حذف شده یا متعلق به کاربر دیگری بوده)، به‌جای گیر کردن کاربر با
   * خطای «عدم دسترسی» در همه‌ی صفحات، به‌صورت خودکار پاک و با یک مقدار
   * معتبر جایگزین می‌شود.
   */
  async ensureActiveUniversityConfig() {
    try {
      const user = this.getUser();
      if (!user || user.role === 'supervisor') return null;

      const response = await api.get('/scheduling/api/universities/');
      let configs = [];
      if (response.data?.results) configs = response.data.results;
      else if (Array.isArray(response.data)) configs = response.data;

      const existing = localStorage.getItem('current_university_id');
      const stillValid = existing && configs.some((c) => String(c.id) === String(existing));

      if (stillValid) {
        return existing;
      }

      if (configs.length > 0) {
        const activeId = String(configs[0].id);
        localStorage.setItem('current_university_id', activeId);
        return activeId;
      }

      // هیچ نیمسال معتبری برای این کاربر وجود ندارد؛ مقدار قدیمی و نامعتبر را پاک می‌کنیم
      localStorage.removeItem('current_university_id');
      return null;
    } catch (error) {
      console.error('خطا در تعیین پیکربندی فعال:', error);
      return null;
    }
  }

  getActiveUniversityConfigId() {
    return localStorage.getItem('current_university_id');
  }

  setActiveUniversityConfigId(id) {
    if (id) {
      localStorage.setItem('current_university_id', String(id));
    } else {
      localStorage.removeItem('current_university_id');
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch (error) {
      return false;
    }
  }

  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      
      if (user.role && !AuthService.VALID_ROLES.includes(user.role)) {
        console.warn(`نقش نامعتبر در localStorage: ${user.role}`);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('خطا در دریافت اطلاعات کاربر:', error);
      return null;
    }
  }

  // ============================================
  // متدهای نقش‌ها و دسترسی
  // ============================================

  /**
   * دریافت نمایش فارسی نقش کاربر جاری
   * @returns {string} نمایش فارسی نقش
   */
  getRoleDisplay() {
    const user = this.getUser();
    if (!user) return '';
    
    // اگر role_display از سرور برگشته باشد
    if (user.role_display) return user.role_display;
    
    // نگاشت دستی نقش‌ها به فارسی
    const roleMap = {
      'admin': 'مدیر',
      'teacher': 'استاد',
      'education_officer': 'کارشناس آموزش',
      'supervisor': 'سوپروایزر',
    };
    
    return roleMap[user.role] || user.role || 'نامشخص';
  }

  /**
   * دریافت نمایش فارسی یک نقش خاص
   * @param {string} role - کد نقش
   * @returns {string} نمایش فارسی نقش
   */
  getRoleDisplayByRole(role) {
    const roleMap = {
      'admin': 'مدیر',
      'teacher': 'استاد',
      'education_officer': 'کارشناس آموزش',
      'supervisor': 'سوپروایزر',
    };
    
    return roleMap[role] || role || 'نامشخص';
  }

  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  hasAnyRole(roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }

  isSupervisor() {
    return this.hasRole('supervisor');
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isTeacher() {
    return this.hasRole('teacher');
  }

  isEducationOfficer() {
    return this.hasRole('education_officer');
  }

  // ============================================
  // مدیریت دانشگاه‌ها (Tenant) - فقط سوپروایزر
  // ============================================

  async getUniversities(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      const response = await api.get(`/account/api/universities/?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getUniversity(universityId) {
    try {
      const response = await api.get(`/account/api/universities/${universityId}/`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async createUniversity(data) {
    try {
      const response = await api.post('/account/api/universities/', data);
      if (response.data.success) {
        toast.success('دانشگاه با موفقیت ایجاد شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async updateUniversity(universityId, data) {
    try {
      const response = await api.put(`/account/api/universities/${universityId}/`, data);
      if (response.data.success) {
        toast.success('اطلاعات دانشگاه با موفقیت به‌روز شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async deleteUniversity(universityId) {
    try {
      const response = await api.delete(`/account/api/universities/${universityId}/`);
      if (response.data.success) {
        toast.success('دانشگاه با موفقیت حذف شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async extendUniversityAccess(universityId, data) {
    try {
      const response = await api.post(`/account/api/universities/${universityId}/extend-access/`, data);
      if (response.data.success) {
        toast.success('اعتبار دانشگاه به‌روز شد');
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  getDashboardPath() {
    const user = this.getUser();
    if (!user) return '/login';
    
    return AuthService.ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
  }

  redirectToDashboard(navigate) {
    const path = this.getDashboardPath();
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  }

  // ============================================
  // مدیریت خطاها
  // ============================================

  handleError(error) {
    if (error.response?.status === 401) {
      return;
    }

    if (error.response?.status === 403) {
      toast.error('شما دسترسی به این بخش را ندارید');
      return;
    }

    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      Object.values(errors).forEach(errorMessages => {
        if (Array.isArray(errorMessages)) {
          errorMessages.forEach(msg => toast.error(msg));
        } else {
          toast.error(errorMessages);
        }
      });
    } else if (error.message === 'Network Error') {
      toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید');
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('خطای ناشناخته رخ داده است');
    }
  }
}

const authService = new AuthService();
export default authService;