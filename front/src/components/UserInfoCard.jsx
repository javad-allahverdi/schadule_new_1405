import React from "react";

export default function UserInfoCard({
  profileImage,
  firstName,
  lastName,
  university,
  role,
}) {
  return (
    <div className="relative flex items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-md mx-auto group overflow-hidden">
      {/* افکت پس‌زمینه */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* دکوریشن‌های ظریف */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-blue-200/30 group-hover:bg-blue-300/40 transition-all duration-700"></div>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-purple-200/30 group-hover:bg-purple-300/40 transition-all duration-700"></div>

      {/* عکس پروفایل */}
      <div className="flex-shrink-0 relative z-10">
        <div className="relative">
          <img
            src={
              profileImage || "https://randomuser.me/api/portraits/men/32.jpg"
            }
            alt={`${firstName} ${lastName}`}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
          />
          {/* نشانگر وضعیت آنلاین */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* اطلاعات کاربر */}
      <div className="ml-6 flex flex-col justify-center relative z-10">
        <h2 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
          {firstName} {lastName}
        </h2>

        <div className="flex items-center mt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-500 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-6 0H5m4 0h4m0 0h2m0 0h2M9 7h6m-6 4h6m-6 4h6"
            />
          </svg>
          <p className="text-gray-600 text-sm">{university}</p>
        </div>

        <span className="mt-3 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full shadow-md group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300 transform group-hover:-translate-y-0.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {role}
        </span>
      </div>
    </div>
  );
}
