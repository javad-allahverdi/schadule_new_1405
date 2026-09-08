import React from 'react';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
      <h3 className="font-bold mb-2">خطا!</h3>
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;