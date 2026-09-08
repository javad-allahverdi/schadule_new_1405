// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { 
//   FiBriefcase, 
//   FiMail, 
//   FiPhone, 
//   FiUser, 
//   FiLock, 
//   FiGlobe,
//   FiMapPin,
//   FiUsers,
//   FiCheck,
//   FiArrowLeft
// } from "react-icons/fi";

// export default function RegisterRight() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [isLoading, setIsLoading] = useState(false);
  
//   // اطلاعات فرم
//   const [formData, setFormData] = useState({
//     // اطلاعات سازمان
//     organizationName: "",
//     organizationType: "university",
//     organizationEmail: "",
//     organizationPhone: "",
//     organizationWebsite: "",
//     organizationAddress: "",
//     organizationCity: "",
    
//     // اطلاعات مدیر
//     adminName: "",
//     adminEmail: "",
//     adminPhone: "",
//     adminPassword: "",
//     confirmPassword: "",
    
//     // توافق‌نامه
//     termsAccepted: false,
//     newsletter: true
//   });

//   const organizationTypes = [
//     { value: "university", label: "دانشگاه" },
//     { value: "college", label: "دانشکده/کالج" },
//     { value: "institute", label: "موسسه آموزشی" },
//     { value: "school", label: "مدرسه/آموزشگاه" },
//     { value: "other", label: "سایر" }
//   ];

//   const cities = [
//     "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
//     "کرمانشاه", "ارومیه", "رشت", "زاهدان", "کرمان", "همدان", "یزد"
//   ];

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleNextStep = () => {
//     // اعتبارسنجی مرحله 1
//     if (step === 1) {
//       if (!formData.organizationName || !formData.organizationType || !formData.organizationEmail) {
//         alert("لطفاً اطلاعات ضروری سازمان را تکمیل کنید");
//         return;
//       }
//     }
//     // اعتبارسنجی مرحله 2
//     else if (step === 2) {
//       if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
//         alert("لطفاً اطلاعات مدیر سیستم را تکمیل کنید");
//         return;
//       }
//       if (formData.adminPassword !== formData.confirmPassword) {
//         alert("رمز عبور و تأیید آن مطابقت ندارند");
//         return;
//       }
//     }
    
//     setStep(step + 1);
//   };

//   const handlePrevStep = () => {
//     setStep(step - 1);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setIsLoading(true);
    
//     // شبیه‌سازی ارسال اطلاعات
//     setTimeout(() => {
//       alert("درخواست عضویت شما با موفقیت ثبت شد. تیم پشتیبانی طی 24 ساعت با شما تماس خواهد گرفت.");
//       setIsLoading(false);
//       navigate("/login");
//     }, 2000);
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 60 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 0.8, ease: "easeOut" }}
//       className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 lg:p-10 bg-white dark:bg-gray-800 overflow-y-auto"
//     >
//       {/* هدر */}
//       <motion.div
//         initial={{ opacity: 0, y: -15 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, delay: 0.2 }}
//         className="w-full max-w-2xl mb-8"
//       >
//         <div className="flex items-center justify-between mb-6">
//           <button
//             onClick={() => navigate("/login")}
//             className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
//           >
//             <FiArrowLeft />
//             <span>بازگشت به صفحه ورود</span>
//           </button>
          
//           <div className="flex items-center gap-2">
//             <div className="text-sm text-gray-500 dark:text-gray-400">
//               مرحله {step} از 3
//             </div>
//             <div className="flex gap-1">
//               {[1, 2, 3].map((item) => (
//                 <div
//                   key={item}
//                   className={`w-3 h-3 rounded-full transition-all duration-300 ${
//                     item <= step 
//                       ? "bg-emerald-500" 
//                       : "bg-gray-300 dark:bg-gray-600"
//                   } ${item === step ? "scale-125" : ""}`}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>

//         <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
//           ثبت‌نام سازمانی
//         </h2>
//         <p className="text-gray-600 dark:text-gray-300">
//           فرم زیر را برای درخواست عضویت سازمان خود تکمیل کنید
//         </p>
//       </motion.div>

//       {/* فرم چند مرحله‌ای */}
//       <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
//         {/* مرحله 1: اطلاعات سازمان */}
//         {step === 1 && (
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             className="space-y-6"
//           >
//             <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
//               <FiBriefcase className="text-emerald-500" />
//               اطلاعات سازمان
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* نام سازمان */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   نام کامل سازمان *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiBriefcase size={20} />
//                   </div>
//                   <input
//                     type="text"
//                     name="organizationName"
//                     value={formData.organizationName}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="مثال: دانشگاه تهران"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* نوع سازمان */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   نوع سازمان *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiUsers size={20} />
//                   </div>
//                   <select
//                     name="organizationType"
//                     value={formData.organizationType}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300 appearance-none"
//                     required
//                   >
//                     {organizationTypes.map(type => (
//                       <option key={type.value} value={type.value}>
//                         {type.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* ایمیل سازمان */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   ایمیل سازمان *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiMail size={20} />
//                   </div>
//                   <input
//                     type="email"
//                     name="organizationEmail"
//                     value={formData.organizationEmail}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="info@example.edu"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* تلفن سازمان */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   تلفن تماس
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiPhone size={20} />
//                   </div>
//                   <input
//                     type="tel"
//                     name="organizationPhone"
//                     value={formData.organizationPhone}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="021-XXXXXXX"
//                   />
//                 </div>
//               </div>

//               {/* شهر */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   شهر
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiMapPin size={20} />
//                   </div>
//                   <select
//                     name="organizationCity"
//                     value={formData.organizationCity}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300 appearance-none"
//                   >
//                     <option value="">انتخاب کنید</option>
//                     {cities.map(city => (
//                       <option key={city} value={city}>{city}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* وبسایت */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   وبسایت
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiGlobe size={20} />
//                   </div>
//                   <input
//                     type="url"
//                     name="organizationWebsite"
//                     value={formData.organizationWebsite}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="https://example.edu"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* آدرس */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                 آدرس
//               </label>
//               <textarea
//                 name="organizationAddress"
//                 value={formData.organizationAddress}
//                 onChange={handleChange}
//                 rows="3"
//                 className="w-full pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300 resize-none"
//                 placeholder="آدرس کامل سازمان"
//               />
//             </div>
//           </motion.div>
//         )}

//         {/* مرحله 2: اطلاعات مدیر سیستم */}
//         {step === 2 && (
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             className="space-y-6"
//           >
//             <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
//               <FiUser className="text-emerald-500" />
//               اطلاعات مدیر سیستم
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* نام کامل مدیر */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   نام کامل مدیر *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiUser size={20} />
//                   </div>
//                   <input
//                     type="text"
//                     name="adminName"
//                     value={formData.adminName}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="نام و نام خانوادگی"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* ایمیل مدیر */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   ایمیل مدیر *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiMail size={20} />
//                   </div>
//                   <input
//                     type="email"
//                     name="adminEmail"
//                     value={formData.adminEmail}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="admin@example.edu"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* رمز عبور */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   رمز عبور *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiLock size={20} />
//                   </div>
//                   <input
//                     type="password"
//                     name="adminPassword"
//                     value={formData.adminPassword}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="حداقل 8 کاراکتر"
//                     required
//                     minLength="8"
//                   />
//                 </div>
//               </div>

//               {/* تأیید رمز عبور */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   تأیید رمز عبور *
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiLock size={20} />
//                   </div>
//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="تکرار رمز عبور"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* تلفن مدیر */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//                   تلفن همراه
//                 </label>
//                 <div className="relative">
//                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                     <FiPhone size={20} />
//                   </div>
//                   <input
//                     type="tel"
//                     name="adminPhone"
//                     value={formData.adminPhone}
//                     onChange={handleChange}
//                     className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-300"
//                     placeholder="09XXXXXXXXX"
//                   />
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* مرحله 3: توافق‌نامه */}
//         {step === 3 && (
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             className="space-y-6"
//           >
//             <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
//               <FiCheck className="text-emerald-500" />
//               توافق‌نامه و قوانین
//             </h3>

//             {/* متن توافق‌نامه */}
//             <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 max-h-80 overflow-y-auto">
//               <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
//                 قوانین و شرایط استفاده از سامانه
//               </h4>
              
//               <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
//                 <p>با تکمیل این فرم، شما به عنوان نماینده رسمی سازمان خود موارد زیر را تأیید می‌کنید:</p>
                
//                 <ul className="space-y-3 pr-4">
//                   <li className="flex gap-2">
//                     <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
//                     <span>اطلاعات ارائه شده صحیح و به‌روز هستند.</span>
//                   </li>
//                   <li className="flex gap-2">
//                     <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
//                     <span>سامانه تنها برای اهداف آموزشی و برنامه‌ریزی درسی استفاده خواهد شد.</span>
//                   </li>
//                   <li className="flex gap-2">
//                     <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
//                     <span>مسئولیت حفظ امنیت حساب کاربری بر عهده سازمان است.</span>
//                   </li>
//                   <li className="flex gap-2">
//                     <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
//                     <span>داده‌های وارد شده مطابق با قوانین حریم خصوصی محافظت می‌شوند.</span>
//                   </li>
//                   <li className="flex gap-2">
//                     <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
//                     <span>در صورت سوءاستفاده از سامانه، حساب کاربری مسدود خواهد شد.</span>
//                   </li>
//                 </ul>
                
//                 <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
//                   <strong>توجه:</strong> پس از ثبت درخواست، تیم پشتیبانی طی 24 ساعت کاری با شما تماس خواهد گرفت 
//                   تا فرآیند فعال‌سازی حساب را تکمیل کند. دسترسی کامل پس از تأیید نهایی فعال می‌شود.
//                 </p>
//               </div>
//             </div>

//             {/* چک‌باکس‌ها */}
//             <div className="space-y-4">
//               <label className="flex items-start gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="termsAccepted"
//                   checked={formData.termsAccepted}
//                   onChange={handleChange}
//                   className="mt-1 w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
//                   required
//                 />
//                 <span className="text-gray-700 dark:text-gray-300 text-sm">
//                   <span className="font-medium">شرایط و قوانین</span> فوق را مطالعه کرده‌ام و با تمامی بندهای آن موافقم.
//                   <span className="text-red-500 mr-1">*</span>
//                 </span>
//               </label>

//               <label className="flex items-start gap-3 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="newsletter"
//                   checked={formData.newsletter}
//                   onChange={handleChange}
//                   className="mt-1 w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
//                 />
//                 <span className="text-gray-700 dark:text-gray-300 text-sm">
//                   مایل به دریافت خبرنامه، به‌روزرسانی‌ها و اطلاعات آموزشی از طریق ایمیل هستم.
//                 </span>
//               </label>
//             </div>
//           </motion.div>
//         )}

//         {/* دکمه‌های ناوبری */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.3 }}
//           className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
//         >
//           {step > 1 ? (
//             <button
//               type="button"
//               onClick={handlePrevStep}
//               className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 font-medium"
//             >
//               مرحله قبل
//             </button>
//           ) : (
//             <div></div>
//           )}

//           {step < 3 ? (
//             <button
//               type="button"
//               onClick={handleNextStep}
//               className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium flex items-center gap-2"
//             >
//               ادامه
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//               </svg>
//             </button>
//           ) : (
//             <button
//               type="submit"
//               disabled={isLoading || !formData.termsAccepted}
//               className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 font-medium flex items-center gap-2 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                   در حال ثبت درخواست...
//                 </>
//               ) : (
//                 <>
//                   <FiCheck className="w-5 h-5" />
//                   ثبت نهایی درخواست
//                 </>
//               )}
//             </button>
//           )}
//         </motion.div>
//       </form>

//       {/* فوتر */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5, delay: 0.8 }}
//         className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 w-full max-w-2xl text-center"
//       >
//         <p className="text-gray-500 dark:text-gray-400 text-sm">
//           قبلاً حساب سازمانی دارید؟{' '}
//           <button
//             onClick={() => navigate("/login")}
//             className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors"
//           >
//             وارد شوید
//           </button>
//         </p>
//         <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
//           پشتیبانی: 021-XXXXXXX | info@university-scheduler.ir
//         </p>
//       </motion.div>
//     </motion.div>
//   );
// }









import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiBriefcase, 
  FiMail, 
  FiPhone, 
  FiUser, 
  FiLock, 
  FiGlobe,
  FiMapPin,
  FiUsers,
  FiCheck,
  FiArrowLeft
} from "react-icons/fi";

export default function RegisterRight() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // اطلاعات فرم
  const [formData, setFormData] = useState({
    // اطلاعات سازمان
    organizationName: "",
    organizationType: "university",
    organizationEmail: "",
    organizationPhone: "",
    organizationWebsite: "",
    organizationAddress: "",
    organizationCity: "",
    
    // اطلاعات مدیر
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
    
    // توافق‌نامه
    termsAccepted: false,
    newsletter: true
  });

  const organizationTypes = [
    { value: "university", label: "دانشگاه" },
    { value: "college", label: "دانشکده/کالج" },
    { value: "institute", label: "موسسه آموزشی" },
    { value: "school", label: "مدرسه/آموزشگاه" },
    { value: "other", label: "سایر" }
  ];

  const cities = [
    "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "کرمانشاه", "ارومیه", "رشت", "زاهدان", "کرمان", "همدان", "یزد"
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNextStep = () => {
    // اعتبارسنجی مرحله 1
    if (step === 1) {
      if (!formData.organizationName || !formData.organizationType || !formData.organizationEmail) {
        alert("لطفاً اطلاعات ضروری سازمان را تکمیل کنید");
        return;
      }
    }
    // اعتبارسنجی مرحله 2
    else if (step === 2) {
      if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
        alert("لطفاً اطلاعات مدیر سیستم را تکمیل کنید");
        return;
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        alert("رمز عبور و تأیید آن مطابقت ندارند");
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // شبیه‌سازی ارسال اطلاعات
    setTimeout(() => {
      alert("درخواست عضویت شما با موفقیت ثبت شد. تیم پشتیبانی طی 24 ساعت با شما تماس خواهد گرفت.");
      setIsLoading(false);
      navigate("/login");
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 lg:p-10 bg-white dark:bg-gray-800 overflow-y-auto"
    >
      {/* هدر */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>بازگشت به صفحه ورود</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              مرحله {step} از 3
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    item <= step 
                      ? "bg-blue-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                  } ${item === step ? "scale-125" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          ثبت‌نام سازمانی
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          فرم زیر را برای درخواست عضویت سازمان خود تکمیل کنید
        </p>
      </motion.div>

      {/* فرم چند مرحله‌ای */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
        {/* مرحله 1: اطلاعات سازمان */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
              <FiBriefcase className="text-blue-500" />
              اطلاعات سازمان
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* نام سازمان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  نام کامل سازمان *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiBriefcase size={20} />
                  </div>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="مثال: دانشگاه تهران"
                    required
                  />
                </div>
              </div>

              {/* نوع سازمان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  نوع سازمان *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiUsers size={20} />
                  </div>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 appearance-none"
                    required
                  >
                    {organizationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ایمیل سازمان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  ایمیل سازمان *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiMail size={20} />
                  </div>
                  <input
                    type="email"
                    name="organizationEmail"
                    value={formData.organizationEmail}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="info@example.edu"
                    required
                  />
                </div>
              </div>

              {/* تلفن سازمان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  تلفن تماس
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiPhone size={20} />
                  </div>
                  <input
                    type="tel"
                    name="organizationPhone"
                    value={formData.organizationPhone}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="021-XXXXXXX"
                  />
                </div>
              </div>

              {/* شهر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  شهر
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiMapPin size={20} />
                  </div>
                  <select
                    name="organizationCity"
                    value={formData.organizationCity}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 appearance-none"
                  >
                    <option value="">انتخاب کنید</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* وبسایت */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  وبسایت
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiGlobe size={20} />
                  </div>
                  <input
                    type="url"
                    name="organizationWebsite"
                    value={formData.organizationWebsite}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="https://example.edu"
                  />
                </div>
              </div>
            </div>

            {/* آدرس */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                آدرس
              </label>
              <textarea
                name="organizationAddress"
                value={formData.organizationAddress}
                onChange={handleChange}
                rows="3"
                className="w-full pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 resize-none"
                placeholder="آدرس کامل سازمان"
              />
            </div>
          </motion.div>
        )}

        {/* مرحله 2: اطلاعات مدیر سیستم */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
              <FiUser className="text-blue-500" />
              اطلاعات مدیر سیستم
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* نام کامل مدیر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  نام کامل مدیر *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiUser size={20} />
                  </div>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="نام و نام خانوادگی"
                    required
                  />
                </div>
              </div>

              {/* ایمیل مدیر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  ایمیل مدیر *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiMail size={20} />
                  </div>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="admin@example.edu"
                    required
                  />
                </div>
              </div>

              {/* رمز عبور */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  رمز عبور *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiLock size={20} />
                  </div>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="حداقل 8 کاراکتر"
                    required
                    minLength="8"
                  />
                </div>
              </div>

              {/* تأیید رمز عبور */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  تأیید رمز عبور *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiLock size={20} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="تکرار رمز عبور"
                    required
                  />
                </div>
              </div>

              {/* تلفن مدیر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                  تلفن همراه
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiPhone size={20} />
                  </div>
                  <input
                    type="tel"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* مرحله 3: توافق‌نامه */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
              <FiCheck className="text-blue-500" />
              توافق‌نامه و قوانین
            </h3>

            {/* متن توافق‌نامه */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 max-h-80 overflow-y-auto">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                قوانین و شرایط استفاده از سامانه
              </h4>
              
              <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                <p>با تکمیل این فرم، شما به عنوان نماینده رسمی سازمان خود موارد زیر را تأیید می‌کنید:</p>
                
                <ul className="space-y-3 pr-4">
                  <li className="flex gap-2">
                    <FiCheck className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>اطلاعات ارائه شده صحیح و به‌روز هستند.</span>
                  </li>
                  <li className="flex gap-2">
                    <FiCheck className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>سامانه تنها برای اهداف آموزشی و برنامه‌ریزی درسی استفاده خواهد شد.</span>
                  </li>
                  <li className="flex gap-2">
                    <FiCheck className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>مسئولیت حفظ امنیت حساب کاربری بر عهده سازمان است.</span>
                  </li>
                  <li className="flex gap-2">
                    <FiCheck className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>داده‌های وارد شده مطابق با قوانین حریم خصوصی محافظت می‌شوند.</span>
                  </li>
                  <li className="flex gap-2">
                    <FiCheck className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>در صورت سوءاستفاده از سامانه، حساب کاربری مسدود خواهد شد.</span>
                  </li>
                </ul>
                
                <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <strong>توجه:</strong> پس از ثبت درخواست، تیم پشتیبانی طی 24 ساعت کاری با شما تماس خواهد گرفت 
                  تا فرآیند فعال‌سازی حساب را تکمیل کند. دسترسی کامل پس از تأیید نهایی فعال می‌شود.
                </p>
              </div>
            </div>

            {/* چک‌باکس‌ها */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  <span className="font-medium">شرایط و قوانین</span> فوق را مطالعه کرده‌ام و با تمامی بندهای آن موافقم.
                  <span className="text-red-500 mr-1">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  مایل به دریافت خبرنامه، به‌روزرسانی‌ها و اطلاعات آموزشی از طریق ایمیل هستم.
                </span>
              </label>
            </div>
          </motion.div>
        )}

        {/* دکمه‌های ناوبری */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 font-medium"
            >
              مرحله قبل
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium flex items-center gap-2 group"
            >
              ادامه
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !formData.termsAccepted}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 font-medium flex items-center gap-2 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  در حال ثبت درخواست...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ثبت نهایی درخواست
                </>
              )}
            </button>
          )}
        </motion.div>
      </form>

      {/* فوتر */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 w-full max-w-2xl text-center"
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          قبلاً حساب سازمانی دارید؟{' '}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            وارد شوید
          </button>
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
          پشتیبانی: 021-XXXXXXX | info@university-scheduler.ir
        </p>
      </motion.div>
    </motion.div>
  );
}