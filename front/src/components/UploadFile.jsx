import React, { useState, useRef } from "react";
import Button from "./Button";

export default function UploadFile({
  onSubmit,
  onCancel,
  guideFileUrl,
  apiUrl,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      onSubmit && onSubmit(selectedFile); // فقط فایل ارسال شده رو پاس میده
    } catch (error) {
      console.error("مشکل در ارسال فایل:", error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-[calc(100%-32px)]
      sm:w-full
      sm:max-w-[610px]
      md:max-w-[700px]
      lg:max-w-[1000px]
      xl:max-w-[1200px]
      mx-auto
      p-12
      border border-line_color
      rounded-lg
      bg-white"
    >
      <p className="mb-4 text-text_primary_color font-primary text-[18px]">
        لطفاً فایل اکسل را مطابق با ساختار تعریف‌شده در پی‌دی‌اف پیوست تنظیم
        کرده و سپس در سایت بارگذاری نمایید.
      </p>

      <a
        href={guideFileUrl}
        download
        className="inline-block mt-5 px-5 py-[10px] bg-secondary text-[14px] text-white rounded-md hover:bg-blue-700 font-primary mr-7"
      >
        دانلود فایل راهنما
      </a>
      <div className="mt-24">
        <h2 className="text-lg text-text_primary_color font-secondary mb-10 border-b border-line_color p-2">
          بارگذاری فایل
        </h2>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv, .xlsx, .xls, .json"
        />
        <Button type="button" onClick={handleUploadClick} className="mr-5">
          {selectedFile ? selectedFile.name : "بارگذاری فایل"}
        </Button>

        <div className="flex justify-center gap-4 mt-28">
          <Button
            type="button"
            className="bg-gray-300 text-gray-700 hover:bg-gray-400"
            onClick={onCancel}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={!selectedFile}>
            ثبت
          </Button>
        </div>
      </div>
    </form>
  );
}
