// import { useState } from "react";
// import TableReport from "../../components/TableReport";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";

// export default function App() {
//   const [teachersData, setTeachersData] = useState([
//     {
//       id: 1,
//       نام: "رضا",
//       "نام خانوادگی": "احمدی",
//       مدرک: "لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 14,
//       "حداقل واحد": 5,
//     },
//     {
//       id: 2,
//       نام: "مرتضی",
//       "نام خانوادگی": "پورحسینی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "تمام وقت",
//       "مرتبه استادی": "استاد",
//       "حداکثر واحد": 12,
//       "حداقل واحد": 3,
//     },
//     {
//       id: 3,
//       نام: "مریم",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 5,
//       "حداقل واحد": 1,
//     },
//     {
//       id: 4,
//       نام: "مینا",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 5,
//       نام: "مهناز",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 6,
//       نام: "امیر",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 7,
//       نام: "سبحان",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 8,
//       نام: "علی",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 9,
//       نام: "المیرا",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 10,
//       نام: "نوشین",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//     {
//       id: 11,
//       نام: "زهرا",
//       "نام خانوادگی": "احمدی",
//       مدرک: "فوق لیسانس",
//       "نوع هیئت علمی": "نیمه وقت",
//       "مرتبه استادی": "دانشیار",
//       "حداکثر واحد": 4,
//       "حداقل واحد": 2,
//     },
//   ]);

//   const handleDeleteTeacher = (id) => {
//     if (!window.confirm("آیا مطمئن هستید می‌خواهید این استاد را حذف کنید؟"))
//       return;
//     setTeachersData((prev) => prev.filter((teacher) => teacher.id !== id));
//   };

//   const columns = [
//     "نام",
//     "نام خانوادگی",
//     "مدرک",
//     "نوع هیئت علمی",
//     "مرتبه استادی",
//     "حداکثر واحد",
//     "حداقل واحد",
//     "عملیات",
//   ];

//   return (
//     <>
//       <Header />
//       <TableReport
//         title="گزارش اساتید (داده تستی)"
//         columns={columns}
//         data={teachersData}
//         onDelete={handleDeleteTeacher}
//       />
//       <Footer />
//     </>
//   );
// }







import { useState, useEffect } from "react";
import TableReport from "../../components/TableReport";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import teacherService from "../../services/teacherService";

export default function TeacherReport() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    "کد استاد",
    "نام",
    "نام خانوادگی",
    "ایمیل",
    "جنسیت",
    "مدرک",
    "نوع همکاری",
    "مرتبه علمی",
    "حداقل واحد",
    "حداکثر واحد",
    "تعداد دروس",
    "عملیات",
  ];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const result = await teacherService.getAll();
      if (result.success) {
        const formattedData = result.data.map((teacher) => ({
          id: teacher.id,
          "کد استاد": teacher.code || "-",
          "نام": teacher.name || teacher.full_name?.split(' ')[0] || "-",
          "نام خانوادگی": teacher.last_name || teacher.full_name?.split(' ').slice(1).join(' ') || "-",
          "ایمیل": teacher.email || "-",
          "جنسیت": teacher.gender === 1 ? "مرد" : teacher.gender === 2 ? "زن" : "-",
          "مدرک": 
            teacher.degree === 1 ? "لیسانس" : 
            teacher.degree === 2 ? "فوق لیسانس" : 
            teacher.degree === 3 ? "دکترا" : "-",
          "نوع همکاری": 
            teacher.employment_type === 1 ? "تمام وقت" : 
            teacher.employment_type === 2 ? "نیمه وقت" : 
            teacher.employment_type === 3 ? "حق التدریس" : "-",
          "مرتبه علمی": 
            teacher.position === 1 ? "استادیار" : 
            teacher.position === 2 ? "دانشیار" : 
            teacher.position === 3 ? "استاد" : "-",
          "حداقل واحد": teacher.min_units || 0,
          "حداکثر واحد": teacher.max_units || 0,
          "تعداد دروس": teacher.courses?.length || 0,
        }));
        setTeachers(formattedData);
      }
    } catch (error) {
      console.error("خطا در دریافت لیست اساتید:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("آیا مطمئن هستید می‌خواهید این استاد را حذف کنید؟"))
      return;

    try {
      const result = await teacherService.delete(id);
      if (result.success) {
        alert("استاد با موفقیت حذف شد");
        fetchTeachers();
      } else {
        alert(result.message || "خطا در حذف استاد");
      }
    } catch (error) {
      alert("خطا در حذف استاد");
    }
  };

  const handleEditTeacher = (id) => {
    // استفاده از window.location به جای useNavigate
    window.location.href = `/professors/edit/${id}`;
  };

  const handleViewTeacher = (id) => {
    window.location.href = `/professors/view/${id}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-Vazirmatn">در حال بارگذاری اطلاعات...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <TableReport
        title="گزارش اساتید"
        subtitle="مدیریت و مشاهده اطلاعات اساتید دانشگاه"
        columns={columns}
        data={teachers}
        onDelete={handleDeleteTeacher}
        onEdit={handleEditTeacher}
        onView={handleViewTeacher}
        enableFilters={true}
        enableExport={true}
        enableSearch={true}
        itemsPerPageOptions={[5, 10, 25, 50, 100]}
        actions={["view", "edit", "delete"]}
      />
      <Footer />
    </>
  );
}