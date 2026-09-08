// src/components/CoursesManage.jsx
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import courseService from "../services/courseService";
import teacherService from "../services/teacherService";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const TYPE_OPTIONS = [
  { value: "تئوری", label: "تئوری" },
  { value: "عملی", label: "عملی" },
  { value: "آزمایشگاهی", label: "آزمایشگاهی" },
];
const UNIT_TYPE_OPTIONS = [
  { value: "اصلی", label: "اصلی" },
  { value: "پایه", label: "پایه" },
  { value: "جبرانی", label: "جبرانی" },
  { value: "اختیاری", label: "اختیاری" },
];
const GENDER_OPTIONS = [
  { value: "0", label: "مختلط" },
  { value: "1", label: "مرد" },
  { value: "2", label: "زن" },
];
const PLACE_TYPE_OPTIONS = [
  { value: "کلاس تئوری", label: "کلاس تئوری" },
  { value: "آزمایشگاه", label: "آزمایشگاه" },
  { value: "کارگاه", label: "کارگاه" },
  { value: "سالن ورزشی", label: "سالن ورزشی" },
  { value: "استخر", label: "استخر" },
  { value: "زمین چمن", label: "زمین چمن" },
  { value: "سالن آمفی‌تئاتر", label: "سالن آمفی‌تئاتر" },
  { value: "سالن اجتماعات", label: "سالن اجتماعات" },
  { value: "کتابخانه", label: "کتابخانه" },
  { value: "سایر", label: "سایر" },
];

const emptyForm = {
  id: null,
  code: "",
  name: "",
  type: "تئوری",
  unit_type: "اصلی",
  units: 3,
  priority: 1,
  gender: "0",
  required_place_type: "کلاس تئوری",
  expected_students: 30,
  fixed: false,
  teachers: [],
};

export default function CoursesManage() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const res = await teacherService.getAll();
    if (res.success) setTeachers(res.data);
  };

  const load = async () => {
    setLoading(true);
    const res = await courseService.getAll();
    if (res.success) setCourses(res.data);
    else toast.error(res.message);
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (course) => {
    setForm({
      id: course.id,
      code: course.code,
      name: course.name,
      type: course.course_type,
      unit_type: course.unit_type,
      units: course.units,
      priority: course.priority,
      gender: String(course.gender),
      required_place_type: course.required_place_type,
      expected_students: course.expected_students,
      fixed: course.fixed,
      teachers: course.teachers || [],
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const toggleTeacher = (teacherId) => {
    setForm((prev) => {
      const exists = prev.teachers.includes(teacherId);
      return {
        ...prev,
        teachers: exists
          ? prev.teachers.filter((id) => id !== teacherId)
          : [...prev.teachers, teacherId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام درس الزامی است");
      return;
    }
    if (form.teachers.length === 0) {
      toast.error("حداقل یک استاد مجاز برای تدریس این درس را انتخاب کنید");
      return;
    }
    setSaving(true);
    try {
      const res = isEditing
        ? await courseService.update(form.id, form)
        : await courseService.create(form);

      if (res.success) {
        toast.success(res.message);
        setShowForm(false);
        load();
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await courseService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const columns = [
    { key: "code", label: "کد درس" },
    { key: "name", label: "نام درس" },
    { key: "course_type", label: "نوع" },
    { key: "units", label: "تعداد واحد" },
    { key: "expected_students", label: "ظرفیت دانشجو" },
    { key: "required_place_type", label: "نوع مکان مورد نیاز" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت دروس</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          درس جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={courses}
        loading={loading}
        searchPlaceholder="جستجوی درس..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش درس" : "ثبت درس جدید"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <InputField id="code" label="کد درس" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full" />
          <InputField id="name" label="نام درس" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          <InputField id="type" label="نوع درس" type="select" options={TYPE_OPTIONS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full" />
          <InputField id="unit_type" label="نوع واحد" type="select" options={UNIT_TYPE_OPTIONS} value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })} className="w-full" />
          <InputField id="units" label="تعداد واحد" type="number" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="w-full" />
          <InputField id="priority" label="اولویت" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full" />
          <InputField id="gender" label="جنسیت" type="select" options={GENDER_OPTIONS} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full" />
          <InputField id="required_place_type" label="نوع مکان مورد نیاز" type="select" options={PLACE_TYPE_OPTIONS} value={form.required_place_type} onChange={(e) => setForm({ ...form, required_place_type: e.target.value })} className="w-full" />
          <InputField id="expected_students" label="تعداد دانشجوی مورد انتظار" type="number" value={form.expected_students} onChange={(e) => setForm({ ...form, expected_students: e.target.value })} className="w-full" />
        </div>

        <div className="mt-4">
          <p className="text-sm font-secondary text-text_primary_color mb-2">
            اساتید مجاز برای تدریس این درس (حداقل یک نفر — الگوریتم از بین همین‌ها استاد را انتخاب می‌کند)
          </p>
          {teachers.length === 0 ? (
            <p className="text-xs text-warning">
              هنوز هیچ استادی ثبت نشده است. ابتدا از تب «اساتید» حداقل یک استاد ثبت کنید.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 border border-line_color rounded-lg p-3 max-h-32 overflow-y-auto">
              {teachers.map((t) => {
                const checked = form.teachers.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeacher(t.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      checked
                        ? "bg-secondary text-white border-secondary"
                        : "bg-white text-text_secondary_color border-line_color hover:border-secondary"
                    }`}
                  >
                    {t.full_name} ({t.code})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف درس"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
