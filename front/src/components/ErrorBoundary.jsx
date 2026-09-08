// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // در کنسول لاگ کامل نمایش داده می‌شود تا اشکال‌زدایی ساده باشد
    console.error("خطای غیرمنتظره در رابط کاربری:", error, info);
    this.setState({ info });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
        >
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">
              متأسفانه خطایی رخ داد
            </h1>
            <p className="text-gray-600 mb-4">
              در نمایش این صفحه مشکلی پیش آمد. لطفاً صفحه را مجدداً بارگذاری
              کنید. اگر مشکل ادامه داشت، جزئیات فنی زیر را برای پشتیبانی ارسال
              کنید.
            </p>
            <button
              onClick={this.handleReload}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-4"
            >
              بارگذاری مجدد صفحه
            </button>
            {this.state.error && (
              <details className="text-right bg-gray-50 rounded-lg p-3 mt-2 text-xs text-gray-500 whitespace-pre-wrap break-words" dir="ltr">
                <summary className="cursor-pointer text-gray-600 mb-1" dir="rtl">
                  جزئیات فنی
                </summary>
                {String(this.state.error?.message || this.state.error)}
                {this.state.info?.componentStack ? `\n${this.state.info.componentStack}` : ""}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
