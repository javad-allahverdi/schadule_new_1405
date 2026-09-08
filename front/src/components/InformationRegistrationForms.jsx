// import InputField from "./InputField";
// import Button from "./Button";

// export default function InformationRegistrationForms({
//   fields = [],
//   onSubmit,
//   onCancel,
//   title,
//   values,
//   setValues,
//   setOpenButtons, // 👈 آپدیت از بیرون
//   apiUrl,
// }) {
//   // تابع کمکی برای باز/بستن هر دکمه
//   const toggleButton = (id) => {
//     setOpenButtons((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   // تابع ارسال به بک‌اند جنگو
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(values),
//       });

//       if (!response.ok) {
//         throw new Error("خطا در ارسال اطلاعات");
//       }

//       const data = await response.json();
//       console.log("پاسخ بک‌اند:", data);

//       onSubmit && onSubmit(values); // 👈 اگه از بیرون هم تابع پاس دادن اجرا بشه
//     } catch (error) {
//       console.error("مشکل در ارسال:", error);
//     }
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="w-[calc(100%-32px)]
//       sm:w-full
//       sm:max-w-[610px]
//       md:max-w-[700px]
//       lg:max-w-[1000px]
//       xl:max-w-[1200px]
//       mx-auto
//       p-4
//       pb-12
//       border border-line_color
//       rounded-lg
//       bg-white"
//     >
//       <h2 className="text-lg font-secondary text-text_primary_color mb-12 border-b border-line_color p-2">
//         {title}
//       </h2>

//       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 mb-4 justify-items-center items-center">
//         {fields.map(
//           ({
//             id,
//             label,
//             type = "text",
//             options,
//             className = "mobile:w-80 sm:w-[270px]",
//           }) => (
//             <div key={id}>
//               {type === "button" ? (
//                 <div className="flex items-center justify-center gap-2">
//                   <span className="font-primary text-[14px] text-text_primary_color">
//                     {label}
//                   </span>
//                   <Button
//                     type="button"
//                     className={
//                       "bg-primary text-secondary border border-secondary w-[120px] h-[27px] text-[12px]"
//                     }
//                     onClick={() => toggleButton(id)}
//                   >
//                     اضافه کنید
//                   </Button>
//                 </div>
//               ) : (
//                 <InputField
//                   id={id}
//                   label={label}
//                   type={type}
//                   value={values[id] || ""}
//                   onChange={(e) =>
//                     setValues({ ...values, [id]: e.target.value })
//                   }
//                   options={options}
//                   className={className}
//                 />
//               )}
//             </div>
//           )
//         )}
//       </div>

//       <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 mt-20">
//         <Button
//           type="button"
//           className="bg-primary text-secondary hover:bg- border border-secondary w-full sm:w-[143px]"
//           onClick={onCancel}
//         >
//           انصراف
//         </Button>
//         <Button type="submit" className="w-full sm:w-[143px]">
//           ثبت
//         </Button>
//       </div>
//     </form>
//   );
// }


















// import InputField from "./InputField";
// import Button from "./Button";

// export default function InformationRegistrationForms({
//   fields = [],
//   onSubmit,
//   onCancel,
//   title,
//   values,
//   setValues,
//   setOpenButtons,
//   loading = false,
// }) {
//   // تابع کمکی برای باز/بستن هر دکمه
//   const toggleButton = (id) => {
//     setOpenButtons((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   // تابع ارسال فرم - حذف apiUrl و استفاده از onSubmit
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // اعتبارسنجی ساده
//     const requiredFields = fields
//       .filter(f => f.type !== 'button')
//       .map(f => f.id);
    
//     const missingFields = requiredFields.filter(id => !values[id] && values[id] !== 0);
    
//     if (missingFields.length > 0) {
//       alert(`لطفاً فیلدهای الزامی را پر کنید`);
//       return;
//     }
    
//     // ارسال به والد (ProfessorForm)
//     onSubmit && onSubmit(values);
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="w-[calc(100%-32px)]
//       sm:w-full
//       sm:max-w-[610px]
//       md:max-w-[700px]
//       lg:max-w-[1000px]
//       xl:max-w-[1200px]
//       mx-auto
//       p-4
//       pb-12
//       border border-line_color
//       rounded-lg
//       bg-white"
//     >
//       <h2 className="text-lg font-secondary text-text_primary_color mb-12 border-b border-line_color p-2">
//         {title}
//       </h2>

//       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 mb-4 justify-items-center items-center">
//         {fields.map(
//           ({
//             id,
//             label,
//             type = "text",
//             options,
//             className = "mobile:w-80 sm:w-[270px]",
//           }) => (
//             <div key={id}>
//               {type === "button" ? (
//                 <div className="flex items-center justify-center gap-2">
//                   <span className="font-primary text-[14px] text-text_primary_color">
//                     {label}
//                   </span>
//                   <Button
//                     type="button"
//                     className={
//                       "bg-primary text-secondary border border-secondary w-[120px] h-[27px] text-[12px]"
//                     }
//                     onClick={() => toggleButton(id)}
//                   >
//                     اضافه کنید
//                   </Button>
//                 </div>
//               ) : (
//                 <InputField
//                   id={id}
//                   label={label}
//                   type={type}
//                   value={values[id] || ""}
//                   onChange={(e) =>
//                     setValues({ ...values, [id]: e.target.value })
//                   }
//                   options={options}
//                   className={className}
//                 />
//               )}
//             </div>
//           )
//         )}
//       </div>

//       <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 mt-20">
//         <Button
//           type="button"
//           className="bg-primary text-secondary hover:bg- border border-secondary w-full sm:w-[143px]"
//           onClick={onCancel}
//           disabled={loading}
//         >
//           انصراف
//         </Button>
//         <Button 
//           type="submit" 
//           className="w-full sm:w-[143px]"
//           disabled={loading}
//         >
//           {loading ? 'در حال ثبت...' : 'ثبت'}
//         </Button>
//       </div>
//     </form>
//   );
// }









import InputField from "./InputField";
import Button from "./Button";
import DynamicList from "./DynamicList";

export default function InformationRegistrationForms({
  fields = [],
  dynamicSections = [], // بخش‌های داینامیک (زمان‌ها و دروس)
  onSubmit,
  onCancel,
  title,
  values,
  setValues,
  loading = false,
}) {
  // تابع ارسال فرم
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // اعتبارسنجی ساده
    const requiredFields = fields
      .filter(f => f.required !== false)
      .map(f => f.id);
    
    const missingFields = requiredFields.filter(id => !values[id] && values[id] !== 0);
    
    if (missingFields.length > 0) {
      alert(`لطفاً فیلدهای الزامی را پر کنید`);
      return;
    }
    
    onSubmit && onSubmit(values);
  };

  // هندلر تغییر فیلدها
  const handleChange = (id, value) => {
    setValues({ ...values, [id]: value });
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
      p-4
      pb-12
      border border-line_color
      rounded-lg
      bg-white"
    >
      <h2 className="text-lg font-secondary text-text_primary_color mb-12 border-b border-line_color p-2">
        {title}
      </h2>

      {/* فیلدهای اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 mb-8 justify-items-center items-center">
        {fields.map((field) => (
          <div key={field.id} className="w-full">
            <InputField
              id={field.id}
              label={field.label}
              type={field.type || "text"}
              value={values[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              options={field.options}
              required={field.required}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* بخش‌های داینامیک */}
      {dynamicSections.map((section, index) => (
        <div key={index} className="mt-8 pt-6 border-t border-line_color">
          <DynamicList
            items={values[section.key] || []}
            onAdd={(newItem) => {
              setValues({
                ...values,
                [section.key]: [...(values[section.key] || []), newItem]
              });
            }}
            onRemove={(itemIndex) => {
              setValues({
                ...values,
                [section.key]: (values[section.key] || []).filter((_, i) => i !== itemIndex)
              });
            }}
            title={section.title}
            addButtonText={section.addButtonText}
            fields={section.fields}
            emptyMessage={section.emptyMessage}
          />
        </div>
      ))}

      {/* دکمه‌ها */}
      <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 mt-12">
        <Button
          type="button"
          className="bg-primary text-secondary border border-secondary w-full sm:w-[143px]"
          onClick={onCancel}
          disabled={loading}
        >
          انصراف
        </Button>
        <Button 
          type="submit" 
          className="w-full sm:w-[143px]"
          disabled={loading}
        >
          {loading ? 'در حال ثبت...' : 'ثبت'}
        </Button>
      </div>
    </form>
  );
}