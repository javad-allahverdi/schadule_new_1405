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
//     label: "نام گروه دانشجویی",
//   },
//   {
//     id: "size",
//     label: "ظرفیت گروه",
//     type: "number",
//   },
//   {
//     id: "required_courses",
//     label: "دروس الزامی",
//     type: "button",
//   },
//   {
//     id: "optional_courses",
//     label: "دروس اختیاری",
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
//         title="ثبت اطلاعات گروه های دانشجویی"
//         description="گروه های دانشجویی"
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
//                 title="اطلاعات گروه دانشجویی"
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

// export default function StudentGroupForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});

//   const fields = [
//     { id: "name", label: "نام گروه دانشجویی" },
//     { id: "size", label: "ظرفیت گروه", type: "number" },
//     { id: "required_courses", label: "دروس الزامی", type: "button" },
//     { id: "optional_courses", label: "دروس اختیاری", type: "button" },
//   ];

//   const smallFormFields = {
//     required_courses: [
//       { id: "code", label: "کد درس" },
//       { id: "name", label: "نام درس" },
//     ],
//     optional_courses: [
//       { id: "code", label: "کد درس" },
//       { id: "name", label: "نام درس" },
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

//   const animationProps = {
//     initial: { opacity: 0, y: 20 },
//     animate: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: 20 },
//     transition: { duration: 0.4 },
//   };

//   return (
//     <>
//       <Header />

//       <RegistrationHeader
//         title="ثبت اطلاعات گروه‌های دانشجویی"
//         description="گروه‌های دانشجویی"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div key="manual" {...animationProps}>
//             <InformationRegistrationForms
//               fields={fields}
//               title="اطلاعات گروه دانشجویی"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               onSubmit={() => console.log("Submit payload:", values)}
//               onCancel={() => console.log("Cancel")}
//             />
//           </motion.div>
//         ) : (
//           <motion.div key="file" {...animationProps}>
//             <UploadFile />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* SmallFormها */}
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
import studentGroupService from "../../services/studentGroupService";
import courseService from "../../services/courseService";

export default function StudentGroupForm() {
  const [method, setMethod] = useState("manual");
  const [values, setValues] = useState({
    name: "",
    size: 30,
    required_courses: [],
    optional_courses: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [universityId] = useState(1); // بعداً از localStorage میاد

  // دریافت لیست دروس
  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseService.getAll(universityId);
        if (coursesRes.success) {
          setCoursesList(coursesRes.data || []);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات:", error);
      }
    };

    fetchData();
  }, [universityId]);

  // فیلدهای اصلی
  const fields = [
    { id: "name", label: "نام گروه دانشجویی", required: true },
    { id: "size", label: "ظرفیت گروه", type: "number", required: true },
  ];

  // فیلدهای دروس الزامی
  const requiredCourseFields = [
    {
      id: "course_id",
      label: "درس الزامی",
      type: "search",
      required: true,
      options: coursesList.map(c => ({
        id: c.id,
        name: `${c.name} (${c.code}) - ${c.units} واحد`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی درس...",
    },
  ];

  // فیلدهای دروس اختیاری
  const optionalCourseFields = [
    {
      id: "course_id",
      label: "درس اختیاری",
      type: "search",
      required: true,
      options: coursesList.map(c => ({
        id: c.id,
        name: `${c.name} (${c.code}) - ${c.units} واحد`,
      })),
      displayField: "name",
      valueField: "id",
      placeholder: "جستجوی درس...",
    },
  ];

  // بخش‌های داینامیک
  const dynamicSections = [
    {
      key: "required_courses",
      title: "دروس الزامی",
      addButtonText: "+ افزودن درس الزامی",
      fields: requiredCourseFields,
      emptyMessage: "درسی اضافه نشده",
    },
    {
      key: "optional_courses",
      title: "دروس اختیاری",
      addButtonText: "+ افزودن درس اختیاری",
      fields: optionalCourseFields,
      emptyMessage: "درسی اضافه نشده",
    },
  ];

  const handleSubmit = async (formValues) => {
    setLoading(true);
    try {
      // آماده‌سازی داده‌ها برای ارسال
      const groupData = {
        name: formValues.name,
        size: parseInt(formValues.size),
        required_courses: (formValues.required_courses || []).map(c => c.course_id),
        optional_courses: (formValues.optional_courses || []).map(c => c.course_id),
        university_config: universityId,
      };

      const result = await studentGroupService.create(groupData);
      
      if (result.success) {
        alert('گروه دانشجویی با موفقیت ثبت شد');
        setValues({
          name: "",
          size: 30,
          required_courses: [],
          optional_courses: [],
        });
      } else {
        alert(result.message || 'خطا در ثبت گروه');
      }
    } catch (error) {
      alert(error.message || 'خطا در ثبت گروه');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('آیا مطمئن هستید؟ اطلاعات وارد شده ذخیره نخواهند شد.')) {
      setValues({
        name: "",
        size: 30,
        required_courses: [],
        optional_courses: [],
      });
    }
  };

  return (
    <>
      <Header />
      
      <RegistrationHeader
        title="ثبت اطلاعات گروه‌های دانشجویی"
        description="گروه‌های دانشجویی"
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
              title="فرم اطلاعات گروه دانشجویی"
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
            entityType="student-groups"
          />
        )}
      </AnimatePresence>
      
      <Footer />
    </>
  );
}