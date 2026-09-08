// import { motion } from "framer-motion";
// import loginImage from "../assets/images/LoginPage.jpg";

// export default function LoginLeft() {
//   return (
//     <motion.div
//       initial={{ opacity: 0, x: -80 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 1, ease: "easeOut" }}
//       className="hidden md:flex w-1/2 bg-cover bg-center relative"
//       style={{ backgroundImage: `url(${loginImage})` }}
//     >
//       <div className="absolute inset-0 bg-hero/75 flex items-center justify-center">
//         <motion.h1
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
//           className="text-[27px] lg:text-4xl font-secondary text-white text-center px-6 leading-relaxed"
//         >
//           سامانه برنامه ریزی دانشگاه ها
//         </motion.h1>
//       </div>
//     </motion.div>
//   );
// }






import { motion } from "framer-motion";
import loginImage from "../assets/images/LoginPage.jpg";
import logo from "../assets/images/favicon.png";


export default function LoginLeft() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="hidden lg:flex w-full lg:w-1/2 relative overflow-hidden"
    >
      {/* عکس پس‌زمینه با افکت‌های زیبا */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginImage})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/90 via-secondary/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
        
        {/* الگوی هندسی */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div className="grid grid-cols-10 gap-2 absolute inset-10">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-white/5 rounded"></div>
            ))}
          </div>
        </div>
      </div>

      {/* محتوای روی عکس */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        {/* لوگو */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-blue-100 flex items-center justify-center shadow-inner">
              <img src={logo} />
            </div>
          </div>
        </motion.div>

        {/* عنوان */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            سامانه هوشمند<br />زمان‌بندی دانشگاهی
          </h1>
          
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full"></div>
          
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-lg lg:text-xl text-white/90 font-light max-w-md leading-relaxed"
          >
            به‌کارگیری هوش مصنوعی برای ایجاد برنامه‌های درسی بهینه
          </motion.p>
        </motion.div>

        {/* ویژگی‌ها */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 grid grid-cols-2 gap-4 max-w-sm"
        >
          {[
            "زمان‌بندی هوشمند",
            "بدون تداخل",
            "بهینه‌سازی منابع",
            "پشتیبانی سریع"
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/70"></div>
              <span className="text-white/80 text-sm">{feature}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}