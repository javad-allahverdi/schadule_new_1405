import React, { useState } from 'react';

const ProfileForm = ({ initialData, onSubmit, onCancel }) => {
  const { user, profile } = initialData;
  
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    gender: user.gender || 'male',
    department: user.department || '',
    bio: profile.bio || '',
    address: profile.address || '',
    birth_date: profile.birth_date || '',
    educational_background: profile.educational_background || '',
    expertise: profile.expertise || '',
    emergency_contact: profile.emergency_contact || '',
    emergency_phone: profile.emergency_phone || '',
    email_notifications: profile.email_notifications ?? true,
    sms_notifications: profile.sms_notifications ?? true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* اطلاعات شخصی */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">اطلاعات شخصی</h3>
          
          <InputField
            label="نام"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
          
          <InputField
            label="نام خانوادگی"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
          
          <InputField
            label="ایمیل"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          
          <InputField
            label="شماره تلفن"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="09xxxxxxxxx"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              جنسیت
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="male">مرد</option>
              <option value="female">زن</option>
            </select>
          </div>
          
          <InputField
            label="دانشکده"
            name="department"
            value={formData.department}
            onChange={handleChange}
          />
        </div>

        {/* اطلاعات تکمیلی */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">اطلاعات تکمیلی</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاریخ تولد
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <TextareaField
            label="بیوگرافی"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
          />
          
          <TextareaField
            label="آدرس"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
          />
          
          <TextareaField
            label="سوابق تحصیلی"
            name="educational_background"
            value={formData.educational_background}
            onChange={handleChange}
            rows={3}
          />
          
          <TextareaField
            label="تخصص‌ها"
            name="expertise"
            value={formData.expertise}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>

      {/* اطلاعات اضطراری */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">اطلاعات اضطراری</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="شخص تماس اضطراری"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
          />
          <InputField
            label="تلفن اضطراری"
            name="emergency_phone"
            value={formData.emergency_phone}
            onChange={handleChange}
            placeholder="09xxxxxxxxx"
          />
        </div>
      </div>

      {/* تنظیمات اعلان‌ها */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">تنظیمات اعلان‌ها</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              name="email_notifications"
              checked={formData.email_notifications}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-500"
            />
            <span className="text-gray-700">اعلان‌های ایمیلی</span>
          </label>
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              name="sms_notifications"
              checked={formData.sms_notifications}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-500"
            />
            <span className="text-gray-700">اعلان‌های پیامکی</span>
          </label>
        </div>
      </div>

      {/* دکمه‌ها */}
      <div className="flex justify-end space-x-4 space-x-reverse border-t pt-4">
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
          ذخیره تغییرات
        </button>
      </div>
    </form>
  );
};

const InputField = ({ label, name, type = 'text', value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const TextareaField = ({ label, name, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default ProfileForm;