import * as React from "react";
import chevron from "../assets/svg/chevron.svg";

export default function InputField({
  id = "input",
  label = "نام",
  value,
  onChange,
  type = "text",
  className = "",
  options = [], // برای select
  ...props
}) {
  const [focused, setFocused] = React.useState(false);

  // وضعیت شناور بودن لیبل
  const isFloating = focused || (value && !(type === "select" && value === ""));

  return (
    <div className={`relative w-64 text-right ${className}`}>
      <label
        htmlFor={id}
        className={`absolute right-3 text-gray-500 text-[13px] transition-all pointer-events-none font-primary
          ${
            isFloating
              ? "text-xs top-[-8px] px-1 bg-primary"
              : "top-1/2 translate-y-[-50%]"
          }`}
      >
        {label}
      </label>

      {type === "select" ? (
        <div className="w-full">
          <select
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full h-12 px-3 pl-10 border border-gray-400 rounded-lg
               focus:ring-1 focus:ring-secondary bg-transparent outline-none
               text-right text-gray-700 text-[14px] font-primary cursor-pointer
               transition-all duration-200 appearance-none"
          >
            <option value="" disabled hidden />
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="font-primary text-[14px] text-gray-700"
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* آیکن chevron در سمت چپ */}
          <img
            src={chevron}
            alt=""
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4"
          />
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-[50px] border text-[14px] border-gray-400 rounded-md px-3 pt-[10px] pb-[10px] focus:outline-none focus:ring-1 focus:ring-secondary text-right font-primary"
          {...props}
        />
      )}
    </div>
  );
}
