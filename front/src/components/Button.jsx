// import * as React from "react";

// export default function Button({
//   children,
//   onClick,
//   disabled = false,
//   className = "",
// }) {
//   const hasBgClass = /\bbg-/.test(className);
//   const hasTextClass = /\btext-/.test(className);
//   const hasWidthClass = /\bw-/.test(className);
//   const hasHeightClass = /\bh-/.test(className);
//   const hasTextSizeClass = /\btext-/.test(className);

//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={`
//         ${className} 
//         ${hasBgClass ? "" : "bg-secondary"} 
//         ${hasTextClass ? "" : "text-white"} 
//         ${hasWidthClass ? "" : "w-[143px]"} 
//         ${hasHeightClass ? "" : "h-[37px]"} 
//         ${hasTextSizeClass ? "" : "text-[15px]"} 
//         rounded-md 
//         hover:bg-blue-600 transition-all duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed 
//         font-primary
//       `}
//     >
//       {children}
//     </button>
//   );
// }






import * as React from "react";

export default function Button({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button", // اضافه کردن type با مقدار پیش‌فرض "button"
}) {
  const hasBgClass = /\bbg-/.test(className);
  const hasTextClass = /\btext-/.test(className);
  const hasWidthClass = /\bw-/.test(className);
  const hasHeightClass = /\bh-/.test(className);
  const hasTextSizeClass = /\btext-/.test(className);

  return (
    <button
      type={type} // استفاده از type
      onClick={onClick}
      disabled={disabled}
      className={`
        ${className} 
        ${hasBgClass ? "" : "bg-secondary"} 
        ${hasTextClass ? "" : "text-white"} 
        ${hasWidthClass ? "" : "w-[143px]"} 
        ${hasHeightClass ? "" : "h-[37px]"} 
        ${hasTextSizeClass ? "" : "text-[15px]"} 
        rounded-md 
        hover:bg-blue-600 transition-all duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed 
        font-primary
      `}
    >
      {children}
    </button>
  );
}