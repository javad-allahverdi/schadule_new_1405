import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import teacherTitle from "../assets/svg/teachertitle.svg";
import booksTitle from "../assets/svg/bookstitle.svg";
import classTitle from "../assets/svg/classtitle.svg";

export default function Hero() {
  const [stats, setStats] = useState([
    { icon: teacherTitle, number: 0, label: "استاد" },
    { icon: booksTitle, number: 0, label: "درس" },
    { icon: classTitle, number: 0, label: "کلاس" },
  ]);
  const [counts, setCounts] = useState([0, 0, 0]);
  const [loading, setLoading] = useState(true);

  // دریافت آمار از API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/statistics/');
        if (response.data.success) {
          const newStats = [
            { icon: teacherTitle, number: response.data.teachers_count || 10, label: "استاد" },
            { icon: booksTitle, number: response.data.courses_count || 100, label: "درس" },
            { icon: classTitle, number: response.data.classes_count || 15, label: "کلاس" },
          ];
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // استفاده از داده‌های پیش‌فرض در صورت خطا
        setStats([
          { icon: teacherTitle, number: 10, label: "استاد" },
          { icon: booksTitle, number: 100, label: "درس" },
          { icon: classTitle, number: 15, label: "کلاس" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // انیمیشن شمارش
  useEffect(() => {
    if (loading) return;

    const intervals = stats.map((stat, index) => {
      let start = 0;
      const end = stat.number;
      const step = Math.ceil(end / 100);

      return setInterval(() => {
        start += step;
        if (start >= end) {
          start = end;
          clearInterval(intervals[index]);
        }
        setCounts((prev) => {
          const newCounts = [...prev];
          newCounts[index] = start;
          return newCounts;
        });
      }, 20);
    });

    return () => intervals.forEach(clearInterval);
  }, [stats, loading]);

  if (loading) {
    return (
      <section className="relative w-full min-h-[500px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="home"
      className="
        relative w-full min-h-[500px] sm:min-h-[600px] md:min-h-[750px]
        flex flex-col items-center justify-center 
        bg-[url('/src/assets/images/Hero.jpg')] 
        bg-cover bg-center
      "
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-hero/75 backdrop-blur-[2px]" />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
          relative text-white text-[22px] sm:text-3xl lg:text-[50px] text-center
          after:content-[''] after:block after:w-60 sm:after:w-80 md:after:w-[450px] 
          after:h-1 after:bg-secondary lg:after:w-[600px]
          after:mx-auto after:mt-4 sm:after:mt-6 md:after:mt-8 
          font-secondary px-4
        "
      >
        سامانه برنامه ریزی دانشگاه ها
      </motion.h1>

      {/* Stats Section */}
      <div
        className="
          relative mt-10 sm:mt-12 md:mt-16 
          flex
          gap-8 sm:gap-12 md:gap-20 
          text-white text-center
        "
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 * index }}
            className="flex flex-col items-center"
          >
            <img
              src={stat.icon}
              alt={stat.label}
              className="w-8 h-8 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-2"
            />
            <span className="text-xl sm:text-2xl md:text-3xl font-primary">
              {counts[index].toLocaleString()}
              {stat.number > 1000 && "+"}
            </span>
            <span className="text-xs sm:text-sm mt-1 font-primary">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}