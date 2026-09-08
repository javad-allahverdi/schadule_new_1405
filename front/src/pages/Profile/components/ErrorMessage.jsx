import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
        <p className="text-red-600 mb-4">{message || 'خطایی رخ داده است'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}
