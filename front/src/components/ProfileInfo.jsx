import React from 'react';

const ProfileInfo = ({ data }) => {
  const { user, profile } = data;

  return (
    <div className="space-y-6">
      {/* اطلاعات شخصی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            اطلاعات شخصی
          </h3>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {user.profile_image ? (
              <img 
                src={user.profile_image} 
                alt="تصویر پروفایل" 
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl text-white">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
            )}
            <div>
              <h4 className="text-xl font-medium">{user.full_name}</h4>
              <span className="text-sm text-gray-500">{user.role_display || user.role}</span>
            </div>
          </div>

          <div className="space-y-2">
            <InfoItem label="نام کاربری" value={user.username} />
            <InfoItem label="ایمیل" value={user.email} />
            <InfoItem label="تلفن" value={user.phone_number} />
            <InfoItem label="جنسیت" value={user.gender === 'male' ? 'مرد' : 'زن'} />
            <InfoItem label="دانشکده" value={user.department} />
          </div>
        </div>

        {/* اطلاعات تکمیلی */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            اطلاعات تکمیلی
          </h3>
          
          <div className="space-y-2">
            <InfoItem label="کد ملی" value={user.national_code} />
            <InfoItem label="تاریخ تولد" value={profile.birth_date} />
            <InfoItem label="سن" value={profile.age} />
            <InfoItem label="بیوگرافی" value={profile.bio} />
            <InfoItem label="آدرس" value={profile.address} />
          </div>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-4">
            اطلاعات اضطراری
          </h3>
          
          <div className="space-y-2">
            <InfoItem label="شخص تماس" value={profile.emergency_contact} />
            <InfoItem label="تلفن تماس" value={profile.emergency_phone} />
          </div>
        </div>
      </div>

      {/* مجوزها */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
          مجوزهای دسترسی
        </h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {user.permissions?.map((perm, index) => (
            <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
              {perm}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between border-b py-2">
    <span className="text-gray-600">{label}:</span>
    <span className="text-gray-800 font-medium">
      {value || <span className="text-gray-400">تعیین نشده</span>}
    </span>
  </div>
);

export default ProfileInfo;