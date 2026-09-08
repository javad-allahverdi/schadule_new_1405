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
//     label: "نام کلاس / سالن",
//   },
//   {
//     id: "capacity",
//     label: "ظرفیت",
//     type: "number",
//   },
//   {
//     id: "type",
//     label: "نوع کلاس",
//     type: "select",
//     options: [
//       { value: "سالن ورزشی", label: "سالن ورزشی" },
//       { value: "کلاس تئوری", label: "کلاس تئوری" },
//       { value: "آزمایشگاه", label: "آزمایشگاه" },
//     ],
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
//     id: "available",
//     label: "وضعیت دسترسی",
//     type: "select",
//     options: [
//       { value: true, label: "فعال" },
//       { value: false, label: "غیرفعال" },
//     ],
//   },
//     {
//     id: "facilities",
//     label: "امکانات",
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
//         title="ثبت اطلاعات کلاس ها"
//         description="کلاس ها"
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
//                 title="اطلاعات کلاس"
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

// export default function ClassroomForm() {
//   const [method, setMethod] = useState("manual");
//   const [values, setValues] = useState({});
//   const [openButtons, setOpenButtons] = useState({});
//   const [smallFormValues, setSmallFormValues] = useState({});

//   const fields = [
//     { id: "name", label: "نام کلاس / سالن" },
//     { id: "capacity", label: "ظرفیت", type: "number" },
//     {
//       id: "type",
//       label: "نوع کلاس",
//       type: "select",
//       options: [
//         { value: "سالن ورزشی", label: "سالن ورزشی" },
//         { value: "کلاس تئوری", label: "کلاس تئوری" },
//         { value: "آزمایشگاه", label: "آزمایشگاه" },
//       ],
//     },
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
//       id: "available",
//       label: "وضعیت دسترسی",
//       type: "select",
//       options: [
//         { value: true, label: "فعال" },
//         { value: false, label: "غیرفعال" },
//       ],
//     },
//     { id: "facilities", label: "امکانات", type: "button" },
//     { id: "unavailable_times", label: "زمان‌های غیرقابل دسترس", type: "button" },
//   ];

//   const smallFormFields = {
//     facilities: [
//       { id: "name", label: "نام امکانات" },
//       { id: "count", label: "تعداد", type: "number" },
//     ],
//     unavailable_times: [
//       { id: "day", label: "روز", type: "select" },
//       { id: "time", label: "زمان", type: "select" },
//       // { id: "is_hard", label: "الزامی است؟", type: "boolean" },
//     ],
//   };

//   const handleSmallFormSubmit = (key) => {
//     const newItem = smallFormValues[key];
//     if (!newItem) return;

//     setValues((prev) => ({
//       ...prev,
//       [key]: [...(prev[key] || []), newItem],
//     }));

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
//         title="ثبت اطلاعات کلاس‌ها"
//         description="کلاس‌ها"
//         selectedMethod={method}
//         onSelectManual={() => setMethod("manual")}
//         onSelectFile={() => setMethod("file")}
//       />

//       <AnimatePresence mode="wait">
//         {method === "manual" ? (
//           <motion.div key="manual" {...animationProps}>
//             <InformationRegistrationForms
//               fields={fields}
//               title="اطلاعات کلاس"
//               values={values}
//               setValues={setValues}
//               openButtons={openButtons}
//               setOpenButtons={setOpenButtons}
//               apiUrl="http://127.0.0.1:8000/scheduling/api/places/"  
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
import placeService from "../../services/placeService";
import universityService from "../../services/universityService";

export default function ClassroomForm() {
  const [method, setMethod] = useState("manual");
  const [values, setValues] = useState({
    code: "",
    name: "",
    capacity: 30,
    type: "کلاس تئوری",
    gender: 0,
    available: true,
    facilities: [],
    unavailable_times: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [universityId] = useState(1); // بعداً از localStorage میاد

  // دریافت بازه‌های زمانی
  useEffect(() => {
    const fetchData = async () => {
      try {
        const uniRes = await universityService.getById(universityId);
        if (uniRes.success) {
          setTimeSlots(uniRes.data.time_slots || []);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات:", error);
      }
    };

    fetchData();
  }, [universityId]);

  // فیلدهای اصلی
  const fields = [
    { id: "code", label: "کد کلاس", required: true },
    { id: "name", label: "نام کلاس / سالن", required: true },
    { id: "capacity", label: "ظرفیت", type: "number", required: true },
    {
      id: "type",
      label: "نوع کلاس",
      type: "select",
      required: true,
      options: [
        { value: "کلاس تئوری", label: "کلاس تئوری" },
        { value: "آزمایشگاه", label: "آزمایشگاه" },
        { value: "سالن", label: "سالن ورزشی" },
      ],
    },
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
      id: "available",
      label: "وضعیت دسترسی",
      type: "select",
      options: [
        { value: true, label: "فعال" },
        { value: false, label: "غیرفعال" },
      ],
    },
  ];

  // فیلدهای امکانات
  const facilityFields = [
    { id: "name", label: "نام وسیله", required: true },
    { id: "count", label: "تعداد", type: "number", required: true },
  ];

  // فیلدهای زمان غیرقابل دسترس
  const timeFields = [
    {
      id: "day",
      label: "روز",
      type: "select",
      required: true,
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
      required: true,
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

  // بخش‌های داینامیک
  const dynamicSections = [
    {
      key: "facilities",
      title: "امکانات",
      addButtonText: "+ افزودن وسیله",
      fields: facilityFields,
      emptyMessage: "امکاناتی اضافه نشده",
    },
    {
      key: "unavailable_times",
      title: "زمان‌های غیرقابل دسترس",
      addButtonText: "+ افزودن زمان",
      fields: timeFields,
      emptyMessage: "زمانی اضافه نشده",
    },
  ];

  const handleSubmit = async (formValues) => {
    setLoading(true);
    try {
      // آماده‌سازی داده‌ها برای ارسال
      const placeData = {
        ...formValues,
        code: formValues.code,
        name: formValues.name,
        capacity: parseInt(formValues.capacity),
        type: formValues.type,
        gender: parseInt(formValues.gender),
        available: formValues.available === 'true' || formValues.available === true,
        facilities: formValues.facilities || [],
        university_config: universityId,
      };

      const result = await placeService.create(placeData);
      
      if (result.success) {
        alert('کلاس با موفقیت ثبت شد');
        setValues({
          code: "",
          name: "",
          capacity: 30,
          type: "کلاس تئوری",
          gender: 0,
          available: true,
          facilities: [],
          unavailable_times: [],
        });
      } else {
        alert(result.message || 'خطا در ثبت کلاس');
      }
    } catch (error) {
      alert(error.message || 'خطا در ثبت کلاس');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('آیا مطمئن هستید؟ اطلاعات وارد شده ذخیره نخواهند شد.')) {
      setValues({
        code: "",
        name: "",
        capacity: 30,
        type: "کلاس تئوری",
        gender: 0,
        available: true,
        facilities: [],
        unavailable_times: [],
      });
    }
  };

  return (
    <>
      <Header />
      
      <RegistrationHeader
        title="ثبت اطلاعات کلاس‌ها"
        description="کلاس‌ها"
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
              title="فرم اطلاعات کلاس"
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
            entityType="places"
          />
        )}
      </AnimatePresence>
      
      <Footer />
    </>
  );
}