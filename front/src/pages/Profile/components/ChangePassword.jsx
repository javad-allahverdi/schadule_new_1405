import React, { useState } from 'react';

export default function ChangePassword({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password2: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.new_password2) {
      setLocalError('رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }
    if (formData.new_password.length < 8) {
      setLocalError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ current_password: '', new_password: '', new_password2: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">تغییر رمز عبور</h2>

      {localError && (
        <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg px-3 py-2">{localError}</p>
      )}

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-gray-600 mb-1">رمز عبور فعلی</label>
          <input
            type="password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">رمز عبور جدید</label>
          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">تکرار رمز عبور جدید</label>
          <input
            type="password"
            name="new_password2"
            value={formData.new_password2}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {submitting ? 'در حال تغییر...' : 'تغییر رمز عبور'}
        </button>
      </div>
    </form>
  );
}
