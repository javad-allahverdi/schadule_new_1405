// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import logo from "../assets/images/favicon.png";

// export default function LoginRight() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (username === "admin" && password === "1234") {
//       localStorage.setItem("isLoggedIn", "true");
//       navigate("/");
//     } else {
//       alert("نام کاربری یا رمز عبور اشتباه است!");
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 60 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 1, ease: "easeOut" }}
//       className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-10 md:py-0 bg-transparent md:bg-gray-50"
//     >
//       {/* هدر مخصوص موبایل */}
//       <motion.div
//         initial={{ opacity: 0, y: -15 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 0.2 }}
//         className="flex items-center justify-center gap-3 mb-10 md:hidden"
//       >
//         <span className="text-[17px] mobile:text-xl sm:text-2xl text-text_primary_color font-secondary">
//           سامانه برنامه‌ریزی دانشگاه‌ها
//         </span>
//         <img src={logo} alt="logo" className="w-12 h-12" />
//       </motion.div>

//       <motion.h2
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.7, delay: 0.3 }}
//         className="text-xl md:text-2xl font-box text-gray-800 mb-6"
//       >
//         ورود به سامانه
//       </motion.h2>

//       {/* فرم بدون باکس سفید */}
//       <motion.form
//         onSubmit={handleSubmit}
//         className="w-full max-w-sm flex flex-col gap-4"
//       >
//         <motion.input
//           type="text"
//           placeholder="نام کاربری"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           className="border border-gray-300 rounded-lg px-4 py-2 text-base text-right font-primary focus:outline-none focus:border-blue-500"
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.4 }}
//         />

//         <motion.input
//           type="password"
//           placeholder="رمز عبور"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border border-gray-300 rounded-lg px-4 py-2 text-base text-right font-primary focus:outline-none focus:border-blue-500"
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.55 }}
//         />

//         <motion.button
//           type="submit"
//           className="bg-secondary hover:bg-blue-600 text-white text-base py-2 rounded-lg transition duration-300 font-box"
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.7 }}
//         >
//           ورود
//         </motion.button>
//       </motion.form>
//     </motion.div>
//   );
// }







// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";

// export default function LoginRight() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setIsLoading(true);

//     // شبیه‌سازی درخواست API
//     setTimeout(() => {
//       if (username === "admin" && password === "1234") {
//         localStorage.setItem("isLoggedIn", "true");
//         navigate("/");
//       } else {
//         alert("نام کاربری یا رمز عبور اشتباه است!");
//       }
//       setIsLoading(false);
//     }, 1000);
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 60 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 0.8, ease: "easeOut" }}
//       className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 lg:p-12 bg-white dark:bg-gray-800"
//     >
//       {/* هدر موبایل */}
//       <motion.div
//         initial={{ opacity: 0, y: -15 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, delay: 0.2 }}
//         className="flex flex-col items-center mb-8 lg:hidden"
//       >
//         <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
//           <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
//             <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
//           </svg>
//         </div>
//         <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
//           سامانه برنامه‌ریزی دانشگاه‌ها
//         </h1>
//       </motion.div>

//       {/* هدر دسکتاپ */}
//       <motion.div
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, delay: 0.3 }}
//         className="text-center mb-10 hidden lg:block"
//       >
//         <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
//           خوش آمدید
//         </h2>
//         <p className="text-gray-600 dark:text-gray-300">
//           برای ورود به پنل مدیریت، اطلاعات خود را وارد کنید
//         </p>
//       </motion.div>

//       {/* فرم لاگین */}
//       <motion.form
//         onSubmit={handleSubmit}
//         className="w-full max-w-md space-y-6"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5, delay: 0.4 }}
//       >
//         {/* فیلد نام کاربری */}
//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.5 }}
//         >
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//             نام کاربری
//           </label>
//           <div className="relative">
//             <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//               <FiUser size={20} />
//             </div>
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
//               placeholder="admin یا ایمیل"
//               required
//             />
//           </div>
//         </motion.div>

//         {/* فیلد رمز عبور */}
//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.6 }}
//         >
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
//             رمز عبور
//           </label>
//           <div className="relative">
//             <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//               <FiLock size={20} />
//             </div>
//             <input
//               type={showPassword ? "text" : "password"}
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
//               placeholder="••••••••"
//               required
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute left-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//             >
//               {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
//             </button>
//           </div>
//         </motion.div>

//         {/* دکمه‌های اختیاری */}
//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.7 }}
//           className="flex items-center justify-between text-sm"
//         >
//           <label className="flex items-center cursor-pointer">
//             <input type="checkbox" className="ml-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
//             <span className="text-gray-600 dark:text-gray-400">مرا به خاطر بسپار</span>
//           </label>
//           <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
//             فراموشی رمز عبور؟
//           </a>
//         </motion.div>

//         {/* دکمه ورود */}
//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.8 }}
//         >
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
//           >
//             {isLoading ? (
//               <>
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 <span>در حال ورود...</span>
//               </>
//             ) : (
//               <>
//                 <span>ورود به پنل</span>
//                 <FiLogIn size={20} className="group-hover:translate-x-1 transition-transform" />
//               </>
//             )}
//           </button>
//         </motion.div>
//       </motion.form>

//       {/* فوتر */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5, delay: 1 }}
//         className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 w-full max-w-md text-center"
//       >
//         <p className="text-gray-500 dark:text-gray-400 text-sm">
//           حساب کاربری ندارید؟{' '}
//           <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors">
//             درخواست دسترسی
//           </a>
//         </p>
//         <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
//           © 2024 سامانه هوشمند زمان‌بندی دانشگاهی. تمامی حقوق محفوظ است.
//         </p>
//       </motion.div>
//     </motion.div>
//   );
// }







import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import logo from "../assets/images/favicon.png";

export default function LoginRight() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // شبیه‌سازی درخواست API
    setTimeout(() => {
      if (username === "admin" && password === "1234") {
        localStorage.setItem("isLoggedIn", "true");
        navigate("/");
      } else {
        alert("نام کاربری یا رمز عبور اشتباه است!");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleRegisterClick = () => {
    // انیمیشن خاص برای رفتن به صفحه ثبت‌نام
    navigate("/register");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 lg:p-12 bg-white dark:bg-gray-800"
    >
      {/* هدر موبایل */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col items-center mb-8 lg:hidden"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-4">
          <img src={logo} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
          سامانه برنامه‌ریزی دانشگاه‌ها
        </h1>
      </motion.div>

      {/* هدر دسکتاپ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-center mb-8 hidden lg:block"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3 mt-3">
          خوش آمدید
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          برای ورود به پنل مدیریت، اطلاعات خود را وارد کنید
        </p>
      </motion.div>

      {/* فرم لاگین */}
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* فیلد نام کاربری */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
            نام کاربری
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiUser size={20} />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
              placeholder="admin یا ایمیل"
              required
            />
          </div>
        </motion.div>

        {/* فیلد رمز عبور */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
            رمز عبور
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiLock size={20} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-4 pl-12 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-right text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
        </motion.div>

        {/* دکمه‌های اختیاری */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-between text-sm"
        >
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="ml-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">مرا به خاطر بسپار</span>
          </label>
          <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            فراموشی رمز عبور؟
          </a>
        </motion.div>

        {/* دکمه ورود */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>در حال ورود...</span>
              </>
            ) : (
              <>
                <span>ورود به پنل</span>
                <FiLogIn size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.div>
      </motion.form>

      {/* دکمه ثبت‌نام جدید با انیمیشن */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-8 w-full max-w-md"
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              یا
            </span>
          </div>
        </div>
        
        <button
          onClick={handleRegisterClick}
          className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-500/30 dark:border-blue-400/30 hover:border-blue-500 dark:hover:border-blue-400 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="relative overflow-hidden">
              ایجاد حساب سازمانی جدید
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </span>
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </button>
      </motion.div>

      {/* فوتر */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 w-full max-w-md text-center"
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          حساب سازمانی دارید؟{' '}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            وارد شوید
          </button>
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">
          © 2024 سامانه هوشمند زمان‌بندی دانشگاهی. تمامی حقوق محفوظ است.
        </p>
      </motion.div>
    </motion.div>
  );
}