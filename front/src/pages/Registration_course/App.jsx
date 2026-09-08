// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Header from "../../components/Header";
// import Footer from "../../components/Footer";
// import InformationRegistrationForms from "../../components/InformationRegistrationForms";
// import UploadFile from "../../components/UploadFile";
// import RegistrationHeader from "../../components/RegistrationHeader";
// import SmallForm from "../../components/SmallForm"; // 👈 اضافه شد

// export default function App() {
//   const [method, setMethod] = useState("manual"); // manual | file
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({}); // 👈 مقادیر فرم کوچک

// const fields = [
//   {
//     id: "name",
//     label: "نام درس",
//   },
//   {
//     id: "type",
//     label: "نوع درس",
//     type: "select",
//     options: [
//       { value: "تئوری", label: "تئوری" },
//       { value: "عملی", label: "عملی" },
//       { value: "آزمایشگاهی", label: "آزمایشگاهی" },
//     ],
//   },
//   {
//     id: "unit_type",
//     label: "نوع واحد",
//     type: "select",
//     options: [
//       { value: "اصلی", label: "اصلی" },
//       { value: "پایه", label: "پایه" },
//       { value: "جبرانی", label: "جبرانی" },
//       { value: "اختیاری", label: "اختیاری" },
//     ],
//   },
//   {
//     id: "units",
//     label: "تعداد واحد",
//     type: "number",
//   },
//   {
//     id: "gender",
//     label: "محدودیت جنسیتی",
//     type: "select",
//     options: [
//       { value: 0, label: "هر دو جنسیت" },
//       { value: 1, label: "مرد" },
//       { value: 2, label: "زن" },
//     ],
//   },
//   {
//     id: "required_place_type",
//     label: "نوع فضای مورد نیاز",
//     type: "select",
//     options: [
//       { value: "کلاس تئوری", label: "کلاس تئوری" },
//       { value: "آزمایشگاه", label: "آزمایشگاه" },
//       { value: "سالن", label: "سالن" },
//     ],
//   },
//   {
//     id: "expected_students",
//     label: "تعداد دانشجویان پیش‌بینی‌شده",
//     type: "number",
//   },
//   {
//     id: "prerequisites",
//     label: "دروس پیش‌نیاز",
//     type: "button",
//   },
//   {
//     id: "corequisites",
//     label: "دروس هم‌نیاز",
//     type: "button",
//   },
//   {
//     id: "teachers",
//     label: "اساتید ارائه‌دهنده",
//     type: "button",
//   },
// ];


//   const animationProps = {
//     initial: { opacity: 0, y: 20 },
//     animate: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: 20 },
//     transition: { duration: 0.4 },
//   };

//   // مقادیر و فیلدهای فرم کوچک (برای هر دکمه)
//   const smallFormFields = {
//     min_unit: [
//       { id: "day", label: "روز", type: "select" },
//       { id: "time", label: "زمان", type: "select" },
//     ],
//     min_units_2: [
//       { id: "code", label: "کد درس", type: "select" },
//       { id: "name", label: "اسم درس", type: "select" },
//     ],
//   };

//   const handleSmallFormSubmit = (key) => {
//     console.log(`Submit SmallForm ${key}:`, smallFormValues[key]);
//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات دروس"
//         description="دروس"
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
//                 title="اطلاعات درس"
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
//       {Object.keys(openButtons).map(
//         (key) =>
//           openButtons[key] && (
//             <SmallForm
//               key={key}
//               title={`فرم مربوط به ${key}`}
//               fields={smallFormFields[key]}
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
//       )}

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

// export default function CourseForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});

//   const fields = [
//     { id: "name", label: "نام درس" },
//     {
//       id: "type",
//       label: "نوع درس",
//       type: "select",
//       options: [
//         { value: "تئوری", label: "تئوری" },
//         { value: "عملی", label: "عملی" },
//         { value: "آزمایشگاهی", label: "آزمایشگاهی" },
//       ],
//     },
//     {
//       id: "unit_type",
//       label: "نوع واحد",
//       type: "select",
//       options: [
//         { value: "اصلی", label: "اصلی" },
//         { value: "پایه", label: "پایه" },
//         { value: "جبرانی", label: "جبرانی" },
//         { value: "اختیاری", label: "اختیاری" },
//       ],
//     },
//     { id: "units", label: "تعداد واحد", type: "number" },
//     {
//       id: "gender",
//       label: "محدودیت جنسیتی",
//       type: "select",
//       options: [
//         { value: 0, label: "هر دو جنسیت" },
//         { value: 1, label: "مرد" },
//         { value: 2, label: "زن" },
//       ],
//     },
//     {
//       id: "required_place_type",
//       label: "نوع فضای مورد نیاز",
//       type: "select",
//       options: [
//         { value: "کلاس تئوری", label: "کلاس تئوری" },
//         { value: "آزمایشگاه", label: "آزمایشگاه" },
//         { value: "سالن", label: "سالن" },
//       ],
//     },
//     { id: "expected_students", label: "تعداد دانشجویان پیش‌بینی‌شده", type: "number" },
//     { id: "prerequisites", label: "دروس پیش‌نیاز", type: "button" },
//     { id: "corequisites", label: "دروس هم‌نیاز", type: "button" },
//     { id: "teachers", label: "اساتید ارائه‌دهنده", type: "button" },
//   ];

//   const smallFormFields = {
//     prerequisites: [
//       { id: "code", label: "کد درس" },
//       { id: "name", label: "نام درس" },
//     ],
//     corequisites: [
//       { id: "code", label: "کد درس" },
//       { id: "name", label: "نام درس" },
//     ],
//     teachers: [
//       { id: "id", label: "کد استاد" },
//       { id: "name", label: "نام استاد" },
//     ],
//   };

//   const handleSmallFormSubmit = (key) => {
//     const newItem = smallFormValues[key];
//     if (!newItem) return;

//     setValues((prev) => ({
//       ...prev,
//       [key]: [...(prev[key] || []), newItem],
//     }));

//     // ریست فرم کوچک
//     setSmallFormValues((prev) => ({ ...prev, [key]: {} }));

//     setOpenButtons((prev) => ({ ...prev, [key]: false }));
//   };

//   const animationProps = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 }, transition: { duration: 0.4 } };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات دروس"
//         description="دروس"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div key="manual" {...animationProps}>
//             <InformationRegistrationForms
//               fields={fields}
//               title="اطلاعات درس"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               apiUrl="http://127.0.0.1:8000/scheduling/api/courses/"  
//             />
//           </motion.div>
//         ) : (
//           <motion.div key="file" {...animationProps}>
//             <UploadFile />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {Object.keys(openButtons).map(
//         (key) =>
//           openButtons[key] && (
//             <SmallForm
//               key={key}
//               title={`فرم ${key}`}
//               fields={smallFormFields[key]}
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
//       )}

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
import courseService from "../../services/courseService";
import teacherService from "../../services/teacherService";

export default function CourseForm() {
  const [method, setMethod] = useState("manual");
  const [values, setValues] = useState({
    code: "",
    name: "",
    type: "تئوری",
    unit_type: "اصلی",
    units: 3,
    gender: 0,
    required_place_type: "کلاس تئوری",
    expected_students: 30,
    prerequisites: [],
    corequisites: [],
    teachers: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [universityId] = useState(1); // بعداً از localStorage میاد

  // دریافت لیست اساتید و دروس
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, coursesRes] = await Promise.all([
          teacherService.getAll(universityId),
          courseService.getAll(universityId)
        ]);
        
        if (teachersRes.success) setTeachersList(teachersRes.data || []);
        if (coursesRes.success) setCoursesList(coursesRes.data || []);
      } catch (error) {
        console.error("خطا در دریافت اطلاعات:", error);
      }
    };

    fetchData();
  }, [universityId]);

  // فیلدهای اصلی
  const fields = [
    { id: "code", label: "کد درس", required: true },
    { id: "name", label: "نام درس", required: true },
    {
      id: "type",
      label: "نوع درس",
      type: "select",
      required: true,
      options: [
        { value: "تئوری", label: "تئوری" },
        { value: "عملی", label: "عملی" },
        { value: "آزمایشگاهی", label: "آزمایشگاهی" },
      ],
    },
    {
      id: "unit_type",
      label: "نوع واحد",
      type: "select",
      required: true,
      options: [
        { value: "اصلی", label: "اصلی" },
        { value: "پایه", label: "پایه" },
        { value: "جبرانی", label: "جبرانی" },
        { value: "اختیاری", label: "اختیاری" },
      ],
    },
    { id: "units", label: "تعداد واحد", type: "number", required: true },
    {
      id: "gender",
      label: "محدودیت جنسیتی",
      type: "select",
      options: [
        { value: 0, label: "هر دو جنسیت" },
        { value: 1, label: "مرد" },
        { value: 2, label: "زن" },
      ],
    },
    {
      id: "required_place_type",
      label: "نوع فضای مورد نیاز",
      type: "select",
      options: [
        { value: "کلاس تئوری", label: "کلاس تئوری" },
        { value: "آزمایشگاه", label: "آزمایشگاه" },
        { value: "سالن", label: "سالن" },
      ],
    },
    { id: "expected_students", label: "تعداد دانشجویان", type: "number" },
  ];

  // فیلدهای پیش‌نیازها
  const prerequisiteFields = [
    {
      id: "course_id",
      label: "درس پیش‌نیاز",
      type: "search",
      options: coursesList.map(c => ({
        id: c.id,
        name: `${c.name} (${c.code}) - ${c.units} واحد`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی درس...",
    },
  ];

  // فیلدهای هم‌نیازها
  const corequisiteFields = [
    {
      id: "course_id",
      label: "درس هم‌نیاز",
      type: "search",
      options: coursesList.map(c => ({
        id: c.id,
        name: `${c.name} (${c.code}) - ${c.units} واحد`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی درس...",
    },
  ];

  // فیلدهای اساتید
  const teacherFields = [
    {
      id: "teacher_id",
      label: "استاد",
      type: "search",
      options: teachersList.map(t => ({
        id: t.id,
        name: `${t.full_name} (${t.code})`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی استاد...",
    },
  ];

  // بخش‌های داینامیک
  const dynamicSections = [
    {
      key: "prerequisites",
      title: "دروس پیش‌نیاز",
      addButtonText: "+ افزودن پیش‌نیاز",
      fields: prerequisiteFields,
      emptyMessage: "پیش‌نیازی اضافه نشده",
    },
    {
      key: "corequisites",
      title: "دروس هم‌نیاز",
      addButtonText: "+ افزودن هم‌نیاز",
      fields: corequisiteFields,
      emptyMessage: "هم‌نیازی اضافه نشده",
    },
    {
      key: "teachers",
      title: "اساتید ارائه‌دهنده",
      addButtonText: "+ افزودن استاد",
      fields: teacherFields,
      emptyMessage: "استادی اضافه نشده",
    },
  ];

  const handleSubmit = async (formValues) => {
    setLoading(true);
    try {
      // آماده‌سازی داده‌ها برای ارسال
      const courseData = {
        ...formValues,
        code: formValues.code,
        name: formValues.name,
        course_type: formValues.type,
        unit_type: formValues.unit_type,
        units: parseInt(formValues.units),
        gender: parseInt(formValues.gender),
        required_place_type: formValues.required_place_type,
        expected_students: parseInt(formValues.expected_students) || 30,
        prerequisites: (formValues.prerequisites || []).map(p => p.course_id),
        corequisites: (formValues.corequisites || []).map(c => c.course_id),
        teachers: (formValues.teachers || []).map(t => t.teacher_id),
        university_config: universityId,
      };

      const result = await courseService.create(courseData);
      
      if (result.success) {
        alert('درس با موفقیت ثبت شد');
        setValues({
          code: "",
          name: "",
          type: "تئوری",
          unit_type: "اصلی",
          units: 3,
          gender: 0,
          required_place_type: "کلاس تئوری",
          expected_students: 30,
          prerequisites: [],
          corequisites: [],
          teachers: [],
        });
      } else {
        alert(result.message || 'خطا در ثبت درس');
      }
    } catch (error) {
      alert(error.message || 'خطا در ثبت درس');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('آیا مطمئن هستید؟ اطلاعات وارد شده ذخیره نخواهند شد.')) {
      setValues({
        code: "",
        name: "",
        type: "تئوری",
        unit_type: "اصلی",
        units: 3,
        gender: 0,
        required_place_type: "کلاس تئوری",
        expected_students: 30,
        prerequisites: [],
        corequisites: [],
        teachers: [],
      });
    }
  };

  return (
    <>
      <Header />
      
      <RegistrationHeader
        title="ثبت اطلاعات دروس"
        description="دروس"
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
              title="فرم اطلاعات درس"
              values={values}
              setValues={setValues}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </motion.div>
        ) : (
          <UploadFile 
            uploadUrl="http://127.0.0.1:8000/scheduling/upload/excel/"
            entityType="courses"
          />
        )}
      </AnimatePresence>
      
      <Footer />
    </>
  );
}