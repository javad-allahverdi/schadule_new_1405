import React, { useState } from 'react';

const ChangePassword = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password1: '',
    new_password2: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // پاک کردن خطا هنگام تایپ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.current_password) {
      newErrors.current_password = 'رمز عبور فعلی الزامی است';
    }
    
    if (!formData.new_password1) {
      newErrors.new_password1 = 'رمز عبور جدید الزامی است';
    } else if (formData.new_password1.length < 8) {
      newErrors.new_password1 = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    }
    
    if (!formData.new_password2) {
      newErrors.new_password2 = 'تکرار رمز عبور الزامی است';
    } else if (formData.new_password1 !== formData.new_password2) {
      newErrors.new_password2 = 'رمزهای عبور مطابقت ندارند';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <h3 className="text-lg font-semibold mb-4">تغییر رمز عبور</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          رمز عبور فعلی
        </label>
        <input
          type="password"
          name="current_password"
          value={formData.current_password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.current_password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.current_password && (
          <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          رمز عبور جدید
        </label>
        <input
          type="password"
          name="new_password1"
          value={formData.new_password1}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.new_password1 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.new_password1 && (
          <p className="text-red-500 text-sm mt-1">{errors.new_password1}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">
          رمز عبور باید حداقل ۸ کاراکتر و شامل حروف و اعداد باشد
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          تکرار رمز عبور جدید
        </label>
        <input
          type="password"
          name="new_password2"
          value={formData.new_password2}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.new_password2 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.new_password2 && (
          <p className="text-red-500 text-sm mt-1">{errors.new_password2}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 space-x-reverse pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
        >
          انصراف
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          تغییر رمز عبور
        </button>
      </div>
    </form>
  );
};

export default ChangePassword;