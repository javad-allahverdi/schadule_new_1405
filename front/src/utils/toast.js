// src/utils/toast.js
// یک سیستم Toast ساده بدون وابستگی

const toast = {
  success: (message) => {
    showToast(message, 'success');
  },
  error: (message) => {
    showToast(message, 'error');
  },
  info: (message) => {
    showToast(message, 'info');
  },
  warning: (message) => {
    showToast(message, 'warning');
  }
};

const showToast = (message, type = 'info') => {
  // حذف toast قبلی
  const existingToast = document.querySelector('.custom-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'custom-toast fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white max-w-md transform transition-all duration-300 ease-in-out';
  
  // رنگ‌ها
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };
  
  toastEl.classList.add(colors[type] || colors.info);
  toastEl.textContent = message;
  
  // انیمیشن ورود
  toastEl.style.transform = 'translateX(100%)';
  toastEl.style.opacity = '0';
  
  document.body.appendChild(toastEl);
  
  // نمایش با انیمیشن
  requestAnimationFrame(() => {
    toastEl.style.transform = 'translateX(0)';
    toastEl.style.opacity = '1';
  });
  
  // حذف خودکار
  setTimeout(() => {
    toastEl.style.transform = 'translateX(100%)';
    toastEl.style.opacity = '0';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.remove();
      }
    }, 300);
  }, 3000);
};

export default toast;