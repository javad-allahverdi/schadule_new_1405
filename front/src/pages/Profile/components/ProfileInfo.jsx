import React from 'react';

const ROLE_LABELS = {
  supervisor: 'سوپروایزر',
  admin: 'مدیر دانشگاه',
  education_officer: 'مسئول آموزش',
  teacher: 'استاد',
};

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-800 font-medium">{value || '—'}</span>
    </div>
  );
}

export default function ProfileInfo({ data }) {
  const user = data?.user || {};

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات حساب کاربری</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <Row label="نام" value={user.first_name} />
          <Row label="نام خانوادگی" value={user.last_name} />
          <Row label="نام کاربری" value={user.username} />
          <Row label="ایمیل" value={user.email} />
        </div>
        <div>
          <Row label="نقش" value={ROLE_LABELS[user.role] || user.role_display || user.role} />
          <Row label="دانشگاه" value={user.university_name} />
          <Row label="شماره تلفن" value={user.phone_number} />
          <Row label="کد ملی" value={user.national_code} />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <span className={`px-3 py-1 rounded-full text-xs ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {user.is_verified ? 'حساب تأیید شده' : 'در انتظار تأیید'}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {user.is_active ? 'فعال' : 'غیرفعال'}
        </span>
      </div>
    </div>
  );
}
