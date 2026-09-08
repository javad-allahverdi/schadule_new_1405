// import { motion } from "framer-motion";
// import { FiCheckCircle, FiGlobe, FiUsers, FiShield, FiClock } from "react-icons/fi";

// export default function RegisterLeft() {
//   const features = [
//     {
//       icon: <FiGlobe className="w-6 h-6" />,
//       title: "پشتیبانی ملی",
//       description: "قابل استفاده برای تمام دانشگاه‌ها و موسسات آموزشی کشور"
//     },
//     {
//       icon: <FiUsers className="w-6 h-6" />,
//       title: "مدیریت کاربران",
//       description: "ایجاد و مدیریت کاربران سازمان خودتان"
//     },
//     {
//       icon: <FiShield className="w-6 h-6" />,
//       title: "امنیت بالا",
//       description: "داده‌های شما به صورت کاملاً امن و محرمانه نگهداری می‌شود"
//     },
//     {
//       icon: <FiClock className="w-6 h-6" />,
//       title: "زمان‌بندی هوشمند",
//       description: "استفاده از الگوریتم‌های پیشرفته برای بهینه‌ترین برنامه‌ریزی"
//     }
//   ];

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -80 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 0.8, ease: "easeOut" }}
//       className="hidden lg:flex w-full lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
//     >
//       {/* Gradient Overlay با الگوی هندسی */}
//       <div className="absolute inset-0">
//         <div className="absolute inset-0 bg-gradient-to-tr from-emerald-700/80 via-teal-700/70 to-transparent"></div>
//         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"></div>
        
//         {/* الگوی خطوط */}
//         <div className="absolute inset-0 opacity-10">
//           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
//             <defs>
//               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
//                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
//               </pattern>
//             </defs>
//             <rect width="100%" height="100%" fill="url(#grid)"/>
//           </svg>
//         </div>
//       </div>

//       {/* محتوای اصلی */}
//       <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10">
//         {/* لوگو و عنوان اصلی */}
//         <motion.div
//           initial={{ scale: 0.8, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.8, delay: 0.2 }}
//           className="text-center mb-10"
//         >
//           <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl mx-auto mb-6">
//             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-emerald-100 flex items-center justify-center shadow-inner">
//               <svg className="w-12 h-12 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
//               </svg>
//             </div>
//           </div>
          
//           <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
//             عضویت سازمانی
//           </h1>
//           <div className="h-1 w-40 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full mb-6"></div>
//           <p className="text-xl text-white/90 font-light max-w-lg leading-relaxed">
//             سامانه هوشمند زمان‌بندی درسی برای سازمان‌ها و دانشگاه‌های کشور
//           </p>
//         </motion.div>

//         {/* ویژگی‌ها */}
//         <motion.div
//           initial={{ y: 30, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.6, delay: 0.4 }}
//           className="w-full max-w-xl space-y-6"
//         >
//           {features.map((feature, index) => (
//             <motion.div
//               key={index}
//               initial={{ x: -20, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
//               className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
//             >
//               <div className="p-2 rounded-lg bg-white/20">
//                 <div className="text-white">{feature.icon}</div>
//               </div>
//               <div>
//                 <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
//                 <p className="text-white/80 text-sm">{feature.description}</p>
//               </div>
//             </motion.div>
//           ))}
//         </motion.div>

//         {/* فوتر */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5, delay: 1 }}
//           className="mt-10 pt-6 border-t border-white/20 w-full max-w-xl text-center"
//         >
//           <div className="flex justify-center gap-6 text-white/80 text-sm">
//             <span className="flex items-center gap-2">
//               <FiCheckCircle className="text-emerald-300" />
//               <span>تضمین کیفیت</span>
//             </span>
//             <span className="flex items-center gap-2">
//               <FiCheckCircle className="text-emerald-300" />
//               <span>پشتیبانی 24/7</span>
//             </span>
//             <span className="flex items-center gap-2">
//               <FiCheckCircle className="text-emerald-300" />
//               <span>آموزش رایگان</span>
//             </span>
//           </div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }







import { motion } from "framer-motion";
import { FiCheckCircle, FiGlobe, FiUsers, FiShield, FiClock } from "react-icons/fi";

export default function RegisterLeft() {
  const features = [
    {
      icon: <FiGlobe className="w-6 h-6" />,
      title: "پشتیبانی ملی",
      description: "قابل استفاده برای تمام دانشگاه‌ها و موسسات آموزشی کشور"
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "مدیریت کاربران",
      description: "ایجاد و مدیریت کاربران سازمان خودتان"
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "امنیت بالا",
      description: "داده‌های شما به صورت کاملاً امن و محرمانه نگهداری می‌شود"
    },
    {
      icon: <FiClock className="w-6 h-6" />,
      title: "زمان‌بندی هوشمند",
      description: "استفاده از الگوریتم‌های پیشرفته برای بهینه‌ترین برنامه‌ریزی"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="hidden lg:flex w-full lg:w-1/2 relative overflow-hidden"
    >
      {/* پس‌زمینه گرادینت آبی - هماهنگ با لاگین */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/80 via-blue-600/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"></div>
        
        {/* الگوی خطوط */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>
      </div>

      {/* محتوای اصلی */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10">
        {/* لوگو و عنوان اصلی */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-10"
        >
          <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl mx-auto mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-blue-100 flex items-center justify-center shadow-inner">
              <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            عضویت در سامانه
          </h1>
          <div className="h-1 w-40 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-white/90 font-light max-w-lg leading-relaxed">
            سامانه هوشمند زمان‌بندی درسی دانشگاه‌ها
          </p>
        </motion.div>

        {/* ویژگی‌ها */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-xl space-y-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="p-2 rounded-lg bg-white/20">
                <div className="text-white">{feature.icon}</div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-white/80 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* فوتر */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-10 pt-6 border-t border-white/20 w-full max-w-xl text-center"
        >
          <div className="flex justify-center gap-6 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-300" />
              <span>تضمین کیفیت</span>
            </span>
            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-300" />
              <span>پشتیبانی 24/7</span>
            </span>
            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-300" />
              <span>آموزش رایگان</span>
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}