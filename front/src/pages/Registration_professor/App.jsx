// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import SmallForm from "../../components/SmallForm";

// export default function App() {
//   const [method, setMethod] = useState("manual"); // manual | file
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});

//   // 👇 تعریف همه‌ی فیلدها
//   const employmentTypes = [
//     { value: "1", label: "تمام وقت" },
//     { value: "2", label: "نیمه وقت" },
//     { value: "3", label: "حق التدریس" },
//   ];

//   const fields = [
//     { id: "name", label: "نام" },
//     { id: "last_name", label: "نام خانوادگی" },
//     {
//       id: "gender",
//       label: "جنسیت",
//       type: "select",
//       options: [
//         { value: "man", label: "مرد" },
//         { value: "woman", label: "زن" },
//       ],
//     },
//     {
//       id: "degree",
//       label: "مدرک تحصیلی",
//       type: "select",
//       options: [
//         { value: "expert", label: "لیسانس" },
//         { value: "senior", label: "فوق لیسانس" },
//         { value: "PHD", label: "دکترا" },
//       ],
//     },
//     {
//       id: "employment_type",
//       label: "نوع هیئت علمی",
//       type: "select",
//       options: employmentTypes,
//     },
//     {
//       id: "position",
//       label: "مرتبه استادی",
//       type: "select",
//       options: employmentTypes,
//     },
//     { id: "max_units", label: "حداکثر واحد مجاز", type: "number" },
//     { id: "min_units", label: "حداقل واحد مجاز", type: "number" },
//     {
//       id: "min_unit",
//       label: "زمان های غیر قابل دسترس :",
//       type: "button",
//       modalTitle: "ثبت زمان غیرقابل دسترس",
//       subFields: [
//         { id: "day", label: "روز", type: "select" },
//         { id: "time", label: "زمان", type: "select" },
//       ],
//     },
//     {
//       id: "min_units_2",
//       label: "دروس تدریس شده :",
//       type: "button",
//       modalTitle: "ثبت درس تدریس شده",
//       subFields: [
//         {
//           id: "code",
//           label: "کد درس",
//           type: "select",
//           options: [
//             { value: "expert", label: "لیسانس" },
//             { value: "senior", label: "فوق لیسانس" },
//             { value: "PHD", label: "دکترا" },
//           ],
//         },
//         {
//           id: "name",
//           label: "اسم درس",
//           type: "select",
//           options: [
//             { value: "expert", label: "لیسانس" },
//             { value: "senior", label: "فوق لیسانس" },
//             { value: "PHD", label: "دکترا" },
//           ],
//         },
//       ],
//     },
//   ];

//   const animationProps = {
//     initial: { opacity: 0, y: 20 },
//     animate: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: 20 },
//     transition: { duration: 0.4 },
//   };

//   // 👇 ثبت SmallForm
//   const handleSmallFormSubmit = (key) => {
//     const smallData = smallFormValues[key];
//     console.log(`Submit SmallForm ${key}:`, smallData);

//     // وصل کردن داده‌های فرم کوچک به فرم اصلی
//     setValues((prev) => ({ ...prev, [key]: smallData }));

//     // بستن مودال
//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات اساتید"
//         description="اساتید"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <div className="mt-4">
//         <AnimatePresence mode="wait">
//           {method === "manual" ? (
//             <motion.div key="manual" {...animationProps}>
//               <InformationRegistrationForms
//                 fields={fields}
//                 title="فرم اطلاعات"
//                 values={values}
//                 setValues={setValues}
//                 openButtons={openButtons}
//                 setOpenButtons={setOpenButtons}
//                 onSubmit={(data) => console.log("Submit:", data)}
//                 onCancel={() => console.log("Cancel")}
//               />
//             </motion.div>
//           ) : (
//             <motion.div key="file" {...animationProps}>
//               <UploadFile />
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* SmallFormها */}
//       {Object.keys(openButtons).map((key) => {
//         const field = fields.find((f) => f.id === key);
//         return (
//           openButtons[key] &&
//           field && (
//             <SmallForm
//               key={key}
//               title={field.modalTitle}
//               fields={field.subFields || []}
//               values={smallFormValues[key] || {}}
//               setValues={(vals) =>
//                 setSmallFormValues((prev) => ({ ...prev, [key]: vals }))
//               }
//               isOpen={openButtons[key]}
//               onCancel={() =>
//                 setOpenButtons((prev) => ({ ...prev, [key]: false }))
//               }
//               onSubmit={() => handleSmallFormSubmit(key)}
//             />
//           )
//         );
//       })}

//       <Footer />
//     </>
//   );
// }
















// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import SmallForm from "../../components/SmallForm";

// export default function ProfessorForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});

//   const fields = [
//     { id: "name", label: "نام" },
//     { id: "last_name", label: "نام خانوادگی" },

//     {
//       id: "gender",
//       label: "جنسیت",
//       type: "select",
//       options: [
//         { value: "man", label: "مرد" },
//         { value: "woman", label: "زن" },
//       ],
//     },

//     {
//       id: "degree",
//       label: "مدرک تحصیلی",
//       type: "select",
//       options: [
//         { value: "bachelor", label: "لیسانس" },
//         { value: "master", label: "فوق لیسانس" },
//         { value: "phd", label: "دکترا" },
//       ],
//     },

//     {
//       id: "employment_type",
//       label: "نوع همکاری",
//       type: "select",
//       options: [
//         { value: "full_time", label: "تمام وقت" },
//         { value: "part_time", label: "نیمه وقت" },
//         { value: "hourly", label: "حق التدریس" },
//       ],
//     },

//     {
//       id: "position",
//       label: "مرتبه علمی",
//       type: "select",
//       options: [
//         { value: "assistant_professor", label: "استادیار" },
//         { value: "associate_professor", label: "دانشیار" },
//         { value: "professor", label: "استاد" },
//       ],
//     },

//     { id: "min_units", label: "حداقل واحد مجاز", type: "number" },
//     { id: "max_units", label: "حداکثر واحد مجاز", type: "number" },

//     {
//       id: "unavailable_times",
//       label: "زمان‌های غیرقابل دسترس",
//       type: "button",
//       modalTitle: "ثبت زمان غیرقابل دسترس",
//       subFields: [
//         {
//           id: "day",
//           label: "روز",
//           type: "select",
//           options: [
//             { value: "saturday", label: "شنبه" },
//             { value: "sunday", label: "یکشنبه" },
//             { value: "monday", label: "دوشنبه" },
//             { value: "tuesday", label: "سه‌شنبه" },
//             { value: "wednesday", label: "چهارشنبه" },
//           ],
//         },
//         {
//           id: "time",
//           label: "بازه زمانی",
//           type: "select",
//           options: [
//             { value: "8-10", label: "۸ تا ۱۰" },
//             { value: "10-12", label: "۱۰ تا ۱۲" },
//             { value: "14-16", label: "۱۴ تا ۱۶" },
//           ],
//         },
//         {
//           id: "is_hard",
//           label: "محدودیت الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },

//     {
//       id: "courses",
//       label: "دروس قابل تدریس",
//       type: "button",
//       modalTitle: "ثبت درس",
//       subFields: [
//         { id: "code", label: "کد درس" },
//         { id: "name", label: "نام درس" },
//         {
//           id: "is_hard",
//           label: "الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },
//   ];

//   // ثبت داده‌های SmallForm به‌صورت array
//   const handleSmallFormSubmit = (key) => {
//     const newItem = smallFormValues[key];

//     setValues((prev) => ({
//       ...prev,
//       [key]: [...(prev[key] || []), newItem],
//     }));

//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات اساتید"
//         description="اساتید"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div
//             key="manual"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//           >
//             <InformationRegistrationForms
//               fields={fields}
//               title="فرم اطلاعات استاد"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               apiUrl="http://127.0.0.1:8000/scheduling/api/teachers/"  
//             />
//           </motion.div>
//         ) : (
//           <UploadFile />
//         )}
//       </AnimatePresence>

//       {Object.keys(openButtons).map((key) => {
//         const field = fields.find((f) => f.id === key);
//         return (
//           openButtons[key] &&
//           field && (
//             <SmallForm
//               key={key}
//               title={field.modalTitle}
//               fields={field.subFields}
//               values={smallFormValues[key] || {}}
//               setValues={(vals) =>
//                 setSmallFormValues((prev) => ({ ...prev, [key]: vals }))
//               }
//               onCancel={() =>
//                 setOpenButtons((prev) => ({ ...prev, [key]: false }))
//               }
//               onSubmit={() => handleSmallFormSubmit(key)}
//             />
//           )
//         );
//       })}

//       <Footer />
//     </>
//   );
// }








// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import SmallForm from "../../components/SmallForm";
// import teacherService from "../../services/teacherService";

// export default function ProfessorForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});
//   const [loading, setLoading] = useState(false);

//   const fields = [
//     { id: "code", label: "کد استاد" },
//     { id: "name", label: "نام" },
//     { id: "last_name", label: "نام خانوادگی" },
//     { id: "email", label: "ایمیل", type: "email" },

//     {
//       id: "gender",
//       label: "جنسیت",
//       type: "select",
//       options: [
//         { value: "man", label: "مرد" },
//         { value: "woman", label: "زن" },
//       ],
//     },

//     {
//       id: "degree",
//       label: "مدرک تحصیلی",
//       type: "select",
//       options: [
//         { value: "bachelor", label: "لیسانس" },
//         { value: "master", label: "فوق لیسانس" },
//         { value: "phd", label: "دکترا" },
//       ],
//     },

//     {
//       id: "employment_type",
//       label: "نوع همکاری",
//       type: "select",
//       options: [
//         { value: "full_time", label: "تمام وقت" },
//         { value: "part_time", label: "نیمه وقت" },
//         { value: "hourly", label: "حق التدریس" },
//       ],
//     },

//     {
//       id: "position",
//       label: "مرتبه علمی",
//       type: "select",
//       options: [
//         { value: "assistant_professor", label: "استادیار" },
//         { value: "associate_professor", label: "دانشیار" },
//         { value: "professor", label: "استاد" },
//       ],
//     },

//     { id: "min_units", label: "حداقل واحد مجاز", type: "number" },
//     { id: "max_units", label: "حداکثر واحد مجاز", type: "number" },

//     {
//       id: "unavailable_times",
//       label: "زمان‌های غیرقابل دسترس",
//       type: "button",
//       modalTitle: "ثبت زمان غیرقابل دسترس",
//       subFields: [
//         {
//           id: "day",
//           label: "روز",
//           type: "select",
//           options: [
//             { value: "saturday", label: "شنبه" },
//             { value: "sunday", label: "یکشنبه" },
//             { value: "monday", label: "دوشنبه" },
//             { value: "tuesday", label: "سه‌شنبه" },
//             { value: "wednesday", label: "چهارشنبه" },
//           ],
//         },
//         {
//           id: "time",
//           label: "بازه زمانی",
//           type: "select",
//           options: [
//             { value: "8-10", label: "۸ تا ۱۰" },
//             { value: "10-12", label: "۱۰ تا ۱۲" },
//             { value: "14-16", label: "۱۴ تا ۱۶" },
//           ],
//         },
//         {
//           id: "is_hard",
//           label: "محدودیت الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },

//     {
//       id: "courses",
//       label: "دروس قابل تدریس",
//       type: "button",
//       modalTitle: "ثبت درس",
//       subFields: [
//         { id: "code", label: "کد درس" },
//         { id: "name", label: "نام درس" },
//         {
//           id: "is_hard",
//           label: "الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },
//   ];

//   const handleSmallFormSubmit = (key) => {
//     const newItem = smallFormValues[key];
//     setValues((prev) => ({
//       ...prev,
//       [key]: [...(prev[key] || []), newItem],
//     }));
//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//     setSmallFormValues((prev) => ({ ...prev, [key]: {} }));
//   };

//   const handleSubmit = async (formValues) => {
//     setLoading(true);

//     try {
//       const result = await teacherService.create(formValues);
//       console.log('پاسخ سرور:', result);
//       alert('استاد با موفقیت ثبت شد');
//       setValues({});
//     } catch (error) {
//       alert(error.message || 'خطا در ثبت استاد');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (window.confirm('آیا مطمئن هستید؟')) {
//       setValues({});
//       setSmallFormValues({});
//       setOpenButtons({});
//     }
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات اساتید"
//         description="اساتید"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div
//             key="manual"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//           >
//             <InformationRegistrationForms
//               fields={fields}
//               title="فرم اطلاعات استاد"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               onSubmit={handleSubmit}
//               onCancel={handleCancel}
//               loading={loading}
//             />
//           </motion.div>
//         ) : (
//           <UploadFile />
//         )}
//       </AnimatePresence>

//       {Object.keys(openButtons).map((key) => {
//         const field = fields.find((f) => f.id === key);
//         return (
//           openButtons[key] &&
//           field && (
//             <SmallForm
//               key={key}
//               title={field.modalTitle}
//               fields={field.subFields}
//               values={smallFormValues[key] || {}}
//               setValues={(vals) =>
//                 setSmallFormValues((prev) => ({ ...prev, [key]: vals }))
//               }
//               onCancel={() =>
//                 setOpenButtons((prev) => ({ ...prev, [key]: false }))
//               }
//               onSubmit={() => handleSmallFormSubmit(key)}
//             />
//           )
//         );
//       })}

//       <Footer />
//     </>
//   );
// }










// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import SmallForm from "../../components/SmallForm";
// import teacherService from "../../services/teacherService";

// export default function ProfessorForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});
//   const [loading, setLoading] = useState(false);

//   const fields = [
//     { id: "code", label: "کد استاد" },
//     { id: "name", label: "نام" },
//     { id: "last_name", label: "نام خانوادگی" },
//     { id: "email", label: "ایمیل", type: "email" },

//     {
//       id: "gender",
//       label: "جنسیت",
//       type: "select",
//       options: [
//         { value: "man", label: "مرد" },
//         { value: "woman", label: "زن" },
//       ],
//     },

//     {
//       id: "degree",
//       label: "مدرک تحصیلی",
//       type: "select",
//       options: [
//         { value: "bachelor", label: "لیسانس" },
//         { value: "master", label: "فوق لیسانس" },
//         { value: "phd", label: "دکترا" },
//       ],
//     },

//     {
//       id: "employment_type",
//       label: "نوع همکاری",
//       type: "select",
//       options: [
//         { value: "full_time", label: "تمام وقت" },
//         { value: "part_time", label: "نیمه وقت" },
//         { value: "hourly", label: "حق التدریس" },
//       ],
//     },

//     {
//       id: "position",
//       label: "مرتبه علمی",
//       type: "select",
//       options: [
//         { value: "assistant_professor", label: "استادیار" },
//         { value: "associate_professor", label: "دانشیار" },
//         { value: "professor", label: "استاد" },
//       ],
//     },

//     { id: "min_units", label: "حداقل واحد مجاز", type: "number" },
//     { id: "max_units", label: "حداکثر واحد مجاز", type: "number" },

//     {
//       id: "unavailable_times",
//       label: "زمان‌های غیرقابل دسترس",
//       type: "button",
//       modalTitle: "ثبت زمان غیرقابل دسترس",
//       subFields: [
//         {
//           id: "day",
//           label: "روز",
//           type: "select",
//           options: [
//             { value: "saturday", label: "شنبه" },
//             { value: "sunday", label: "یکشنبه" },
//             { value: "monday", label: "دوشنبه" },
//             { value: "tuesday", label: "سه‌شنبه" },
//             { value: "wednesday", label: "چهارشنبه" },
//           ],
//         },
//         {
//           id: "time",
//           label: "بازه زمانی",
//           type: "select",
//           options: [
//             { value: "8-10", label: "۸ تا ۱۰" },
//             { value: "10-12", label: "۱۰ تا ۱۲" },
//             { value: "14-16", label: "۱۴ تا ۱۶" },
//           ],
//         },
//         {
//           id: "is_hard",
//           label: "محدودیت الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },

//     {
//       id: "courses",
//       label: "دروس قابل تدریس",
//       type: "button",
//       modalTitle: "ثبت درس",
//       subFields: [
//         { id: "code", label: "کد درس" },
//         { id: "name", label: "نام درس" },
//         {
//           id: "is_hard",
//           label: "الزامی است؟",
//           type: "select",
//           options: [
//             { value: true, label: "بله" },
//             { value: false, label: "خیر" },
//           ],
//         },
//       ],
//     },
//   ];

//   const handleSmallFormSubmit = (key) => {
//     const newItem = smallFormValues[key];
//     setValues((prev) => ({
//       ...prev,
//       [key]: [...(prev[key] || []), newItem],
//     }));
//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//     setSmallFormValues((prev) => ({ ...prev, [key]: {} }));
//   };

//   const handleSubmit = async (formValues) => {
//     setLoading(true);

//     try {
//       const result = await teacherService.create(formValues);
//       console.log('پاسخ سرور:', result);
//       alert('استاد با موفقیت ثبت شد');
//       setValues({});
//     } catch (error) {
//       alert(error.message || 'خطا در ثبت استاد');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (window.confirm('آیا مطمئن هستید؟')) {
//       setValues({});
//       setSmallFormValues({});
//       setOpenButtons({});
//     }
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات اساتید"
//         description="اساتید"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div
//             key="manual"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//           >
//             <InformationRegistrationForms
//               fields={fields}
//               title="فرم اطلاعات استاد"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               onSubmit={handleSubmit}
//               onCancel={handleCancel}
//               loading={loading}
//             />
//           </motion.div>
//         ) : (
//           <UploadFile />
//         )}
//       </AnimatePresence>

//       {Object.keys(openButtons).map((key) => {
//         const field = fields.find((f) => f.id === key);
//         return (
//           openButtons[key] &&
//           field && (
//             <SmallForm
//               key={key}
//               title={field.modalTitle}
//               fields={field.subFields}
//               values={smallFormValues[key] || {}}
//               setValues={(vals) =>
//                 setSmallFormValues((prev) => ({ ...prev, [key]: vals }))
//               }
//               isOpen={openButtons[key]}  // ✅ اضافه شد
//               onCancel={() =>
//                 setOpenButtons((prev) => ({ ...prev, [key]: false }))
//               }
//               onSubmit={() => handleSmallFormSubmit(key)}
//             />
//           )
//         );
//       })}

//       <Footer />
//     </>
//   );
// }











// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import DynamicList from "../../components/DynamicList";
// import teacherService from "../../services/teacherService";
// import courseService from "../../services/courseService";
// import universityService from "../../services/universityService";

// export default function ProfessorForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({
//     code: "",
//     name: "",
//     last_name: "",
//     email: "",
//     gender: "",
//     degree: "",
//     employment_type: "",
//     position: "",
//     min_units: "",
//     max_units: "",
//     unavailable_times: [],
//     courses: [],
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [coursesList, setCoursesList] = useState([]);
//   const [timeSlots, setTimeSlots] = useState([]);
//   const [universityId, setUniversityId] = useState(1); // بعداً از localStorage میاد

//   // دریافت لیست دروس و بازه‌های زمانی از API
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // دریافت لیست دروس
//         const coursesResponse = await courseService.getAll(universityId);
//         if (coursesResponse.success) {
//           setCoursesList(coursesResponse.data || []);
//         }

//         // دریافت بازه‌های زمانی از پیکربندی دانشگاه
//         const universityResponse = await universityService.getById(universityId);
//         if (universityResponse.success) {
//           setTimeSlots(universityResponse.data.time_slots || []);
//         }
//       } catch (error) {
//         console.error("خطا در دریافت اطلاعات:", error);
//       }
//     };

//     fetchData();
//   }, [universityId]);

//   // فیلدهای فرم اصلی
//   const fields = [
//     { id: "code", label: "کد استاد", required: true },
//     { id: "name", label: "نام", required: true },
//     { id: "last_name", label: "نام خانوادگی", required: true },
//     { id: "email", label: "ایمیل", type: "email", required: true },

//     {
//       id: "gender",
//       label: "جنسیت",
//       type: "select",
//       required: true,
//       options: [
//         { value: "man", label: "مرد" },
//         { value: "woman", label: "زن" },
//       ],
//     },

//     {
//       id: "degree",
//       label: "مدرک تحصیلی",
//       type: "select",
//       required: true,
//       options: [
//         { value: "bachelor", label: "لیسانس" },
//         { value: "master", label: "فوق لیسانس" },
//         { value: "phd", label: "دکترا" },
//       ],
//     },

//     {
//       id: "employment_type",
//       label: "نوع همکاری",
//       type: "select",
//       required: true,
//       options: [
//         { value: "full_time", label: "تمام وقت" },
//         { value: "part_time", label: "نیمه وقت" },
//         { value: "hourly", label: "حق التدریس" },
//       ],
//     },

//     {
//       id: "position",
//       label: "مرتبه علمی",
//       type: "select",
//       required: true,
//       options: [
//         { value: "assistant_professor", label: "استادیار" },
//         { value: "associate_professor", label: "دانشیار" },
//         { value: "professor", label: "استاد" },
//       ],
//     },

//     { id: "min_units", label: "حداقل واحد مجاز", type: "number", required: true },
//     { id: "max_units", label: "حداکثر واحد مجاز", type: "number", required: true },
//   ];

//   // فیلدهای مربوط به زمان غیرقابل دسترس
//   const timeFields = [
//     {
//       id: "day",
//       label: "روز هفته",
//       type: "select",
//       required: true,
//       options: [
//         { value: "saturday", label: "شنبه" },
//         { value: "sunday", label: "یکشنبه" },
//         { value: "monday", label: "دوشنبه" },
//         { value: "tuesday", label: "سه‌شنبه" },
//         { value: "wednesday", label: "چهارشنبه" },
//       ],
//     },
//     {
//       id: "time_slot",
//       label: "بازه زمانی",
//       type: "select",
//       required: true,
//       options: timeSlots.map((slot, index) => ({
//         value: slot.id || index,
//         label: `${slot.start} - ${slot.end}`,
//       })),
//     },
//     {
//       id: "is_hard",
//       label: "نوع محدودیت",
//       type: "select",
//       required: true,
//       options: [
//         { value: true, label: "الزامی (حتماً خالی باشد)" },
//         { value: false, label: "ترجیحی (در صورت امکان)" },
//       ],
//     },
//   ];

//   // فیلدهای مربوط به دروس قابل تدریس
//   const courseFields = [
//     {
//       id: "course_id",
//       label: "انتخاب درس",
//       type: "search",
//       required: true,
//       options: coursesList.map(course => ({
//         id: course.id,
//         code: course.code,
//         name: course.name,
//         units: course.units,
//         displayName: `${course.name} (${course.code}) - ${course.units} واحد`,
//       })),
//       displayField: "displayName",
//       valueField: "id",
//       placeholder: "نام درس یا کد درس را وارد کنید...",
//     },
//     {
//       id: "is_hard",
//       label: "نوع",
//       type: "select",
//       required: true,
//       options: [
//         { value: true, label: "الزامی (حتماً تدریس شود)" },
//         { value: false, label: "اختیاری (در صورت امکان)" },
//       ],
//     },
//   ];

//   // هندلرهای زمان‌های غیرقابل دسترس
//   const handleAddTime = (newTime) => {
//     setValues({
//       ...values,
//       unavailable_times: [...values.unavailable_times, newTime],
//     });
//   };

//   const handleRemoveTime = (index) => {
//     setValues({
//       ...values,
//       unavailable_times: values.unavailable_times.filter((_, i) => i !== index),
//     });
//   };

//   // هندلرهای دروس قابل تدریس
//   const handleAddCourse = (newCourse) => {
//     // پیدا کردن اطلاعات کامل درس برای نمایش
//     const selectedCourse = coursesList.find(c => c.id === parseInt(newCourse.course_id));
    
//     setValues({
//       ...values,
//       courses: [
//         ...values.courses,
//         {
//           ...newCourse,
//           course_code: selectedCourse?.code,
//           course_name: selectedCourse?.name,
//           units: selectedCourse?.units,
//         }
//       ],
//     });
//   };

//   const handleRemoveCourse = (index) => {
//     setValues({
//       ...values,
//       courses: values.courses.filter((_, i) => i !== index),
//     });
//   };

//   // هندلر ارسال فرم
//   const handleSubmit = async (formValues) => {
//     setLoading(true);

//     try {
//       // ترکیب اطلاعات اصلی با لیست‌ها
//       const finalData = {
//         ...formValues,
//         unavailable_times: values.unavailable_times,
//         courses: values.courses.map(c => ({
//           course_id: c.course_id,
//           is_hard: c.is_hard,
//         })),
//         university_config: universityId,
//       };

//       const result = await teacherService.create(finalData);
      
//       if (result.success) {
//         alert('استاد با موفقیت ثبت شد');
//         // پاک کردن فرم
//         setValues({
//           code: "",
//           name: "",
//           last_name: "",
//           email: "",
//           gender: "",
//           degree: "",
//           employment_type: "",
//           position: "",
//           min_units: "",
//           max_units: "",
//           unavailable_times: [],
//           courses: [],
//         });
//       } else {
//         alert(result.message || 'خطا در ثبت استاد');
//       }
//     } catch (error) {
//       alert(error.message || 'خطا در ثبت استاد');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (window.confirm('آیا مطمئن هستید؟ اطلاعات وارد شده ذخیره نخواهند شد.')) {
//       setValues({
//         code: "",
//         name: "",
//         last_name: "",
//         email: "",
//         gender: "",
//         degree: "",
//         employment_type: "",
//         position: "",
//         min_units: "",
//         max_units: "",
//         unavailable_times: [],
//         courses: [],
//       });
//     }
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات اساتید"
//         description="اساتید"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div
//             key="manual"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//             className="space-y-8"
//           >
//             {/* فرم اصلی */}
//             <InformationRegistrationForms
//               fields={fields}
//               title="فرم اطلاعات استاد"
//               values={values}
//               setValues={setValues}
//               onSubmit={handleSubmit}
//               onCancel={handleCancel}
//               loading={loading}
//             />

//             {/* بخش زمان‌های غیرقابل دسترس */}
//             <div className="w-full max-w-[1200px] mx-auto px-4">
//               <DynamicList
//                 items={values.unavailable_times}
//                 onAdd={handleAddTime}
//                 onRemove={handleRemoveTime}
//                 title="⏰ زمان‌های غیرقابل دسترس"
//                 addButtonText="+ افزودن زمان جدید"
//                 fields={timeFields}
//                 emptyMessage="هیچ زمان غیرقابل دسترسی ثبت نشده است"
//               />
//             </div>

//             {/* بخش دروس قابل تدریس */}
//             <div className="w-full max-w-[1200px] mx-auto px-4">
//               <DynamicList
//                 items={values.courses}
//                 onAdd={handleAddCourse}
//                 onRemove={handleRemoveCourse}
//                 title="📚 دروس قابل تدریس"
//                 addButtonText="+ افزودن درس جدید"
//                 fields={courseFields}
//                 emptyMessage="هیچ درسی برای تدریس انتخاب نشده است"
//               />
//             </div>
//           </motion.div>
//         ) : (
//           <UploadFile 
//             uploadUrl="http://127.0.0.1:8000/scheduling/upload/excel/"
//             entityType="teachers"
//           />
//         )}
//       </AnimatePresence>

//       <Footer />
//     </>
//   );
// }




import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import InformationRegistrationForms from "../../components/InformationRegistrationForms";
import UploadFile from "../../components/UploadFile";
import RegistrationHeader from "../../components/RegistrationHeader";
import teacherService from "../../services/teacherService";
import courseService from "../../services/courseService";
import universityService from "../../services/universityService";

export default function ProfessorForm() {
  const [method, setMethod] = useState("manual");
  const [values, setValues] = useState({
    code: "",
    name: "",
    last_name: "",
    email: "",
    gender: "man",
    degree: "bachelor",
    employment_type: "full_time",
    position: "assistant_professor",
    min_units: "",
    max_units: "",
    unavailable_times: [],
    courses: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [universityId] = useState(1); // بعداً از localStorage میاد

  // دریافت لیست دروس و بازه‌های زمانی
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, uniRes] = await Promise.all([
          courseService.getAll(universityId),
          universityService.getById(universityId)
        ]);
        
        if (coursesRes.success) setCoursesList(coursesRes.data || []);
        if (uniRes.success) setTimeSlots(uniRes.data.time_slots || []);
      } catch (error) {
        console.error("خطا در دریافت اطلاعات:", error);
      }
    };

    fetchData();
  }, [universityId]);

  // فیلدهای اصلی
  const fields = [
    { id: "code", label: "کد استاد", required: true },
    { id: "name", label: "نام", required: true },
    { id: "last_name", label: "نام خانوادگی", required: true },
    { id: "email", label: "ایمیل", type: "email", required: true },
    {
      id: "gender",
      label: "جنسیت",
      type: "select",
      options: [
        { value: "man", label: "مرد" },
        { value: "woman", label: "زن" },
      ],
    },
    {
      id: "degree",
      label: "مدرک تحصیلی",
      type: "select",
      options: [
        { value: "bachelor", label: "لیسانس" },
        { value: "master", label: "فوق لیسانس" },
        { value: "phd", label: "دکترا" },
      ],
    },
    {
      id: "employment_type",
      label: "نوع همکاری",
      type: "select",
      options: [
        { value: "full_time", label: "تمام وقت" },
        { value: "part_time", label: "نیمه وقت" },
        { value: "hourly", label: "حق التدریس" },
      ],
    },
    {
      id: "position",
      label: "مرتبه علمی",
      type: "select",
      options: [
        { value: "assistant_professor", label: "استادیار" },
        { value: "associate_professor", label: "دانشیار" },
        { value: "professor", label: "استاد" },
      ],
    },
    { id: "min_units", label: "حداقل واحد مجاز", type: "number" },
    { id: "max_units", label: "حداکثر واحد مجاز", type: "number" },
  ];

  // فیلدهای زمان غیرقابل دسترس
  const timeFields = [
    {
      id: "day",
      label: "روز",
      type: "select",
      options: [
        { value: "saturday", label: "شنبه" },
        { value: "sunday", label: "یکشنبه" },
        { value: "monday", label: "دوشنبه" },
        { value: "tuesday", label: "سه‌شنبه" },
        { value: "wednesday", label: "چهارشنبه" },
      ],
    },
    {
      id: "time_slot",
      label: "بازه زمانی",
      type: "select",
      options: timeSlots.map((slot, index) => ({
        value: slot.id || index,
        label: `${slot.start} - ${slot.end}`,
      })),
    },
    {
      id: "is_hard",
      label: "الزامی",
      type: "select",
      options: [
        { value: true, label: "بله" },
        { value: false, label: "خیر" },
      ],
    },
  ];

  // فیلدهای دروس قابل تدریس
  const courseFields = [
    {
      id: "course_id",
      label: "درس",
      type: "search",
      options: coursesList.map(c => ({
        id: c.id,
        name: `${c.name} (${c.code})`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی درس...",
    },
    {
      id: "is_hard",
      label: "الزامی",
      type: "select",
      options: [
        { value: true, label: "بله" },
        { value: false, label: "خیر" },
      ],
    },
  ];

  // بخش‌های داینامیک
  const dynamicSections = [
    {
      key: "unavailable_times",
      title: "زمان‌های غیرقابل دسترس",
      addButtonText: "+ افزودن زمان",
      fields: timeFields,
      emptyMessage: "زمانی اضافه نشده",
    },
    {
      key: "courses",
      title: "دروس قابل تدریس",
      addButtonText: "+ افزودن درس",
      fields: courseFields,
      emptyMessage: "درسی اضافه نشده",
    },
  ];

  const handleSubmit = async (formValues) => {
    setLoading(true);
    try {
      const result = await teacherService.create({
        ...formValues,
        university_config: universityId,
      });
      
      if (result.success) {
        alert('استاد با موفقیت ثبت شد');
        setValues({
          code: "", name: "", last_name: "", email: "",
          gender: "man", degree: "bachelor", 
          employment_type: "full_time", position: "assistant_professor",
          min_units: "", max_units: "",
          unavailable_times: [], courses: [],
        });
      }
    } catch (error) {
      alert(error.message || 'خطا در ثبت استاد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <RegistrationHeader
        title="ثبت اطلاعات اساتید"
        description="اساتید"
        selectedMethod={method}
        onSelectManual={() => setMethod("manual")}
        onSelectFile={() => setMethod("file")}
      />

      <AnimatePresence mode="wait">
        {method === "manual" ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <InformationRegistrationForms
              fields={fields}
              dynamicSections={dynamicSections}
              title="فرم اطلاعات استاد"
              values={values}
              setValues={setValues}
              onSubmit={handleSubmit}
              onCancel={() => {
                if (window.confirm('آیا مطمئن هستید؟')) {
                  setValues({
                    code: "", name: "", last_name: "", email: "",
                    gender: "man", degree: "bachelor", 
                    employment_type: "full_time", position: "assistant_professor",
                    min_units: "", max_units: "",
                    unavailable_times: [], courses: [],
                  });
                }
              }}
              loading={loading}
            />
          </motion.div>
        ) : (
          <UploadFile />
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
}