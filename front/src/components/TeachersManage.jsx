// src/components/TeachersManage.jsx
import { useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import teacherService from "../services/teacherService";
import universityService from "../services/universityService";
import authService from "../services/auth";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const GENDER_OPTIONS = [
  { value: "man", label: "مرد" },
  { value: "woman", label: "زن" },
];
const DEGREE_OPTIONS = [
  { value: "bachelor", label: "کارشناسی" },
  { value: "master", label: "کارشناسی ارشد" },
  { value: "phd", label: "دکتری" },
];
const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "تمام‌وقت" },
  { value: "part_time", label: "پاره‌وقت" },
  { value: "hourly", label: "حق‌التدریس" },
];
const POSITION_OPTIONS = [
  { value: "instructor", label: "مربی" },
  { value: "assistant_professor", label: "استادیار" },
  { value: "associate_professor", label: "دانشیار" },
  { value: "professor", label: "استاد تمام" },
];

const emptyForm = {
  id: null,
  code: "",
  name: "",
  last_name: "",
  gender: "man",
  degree: "bachelor",
  employment_type: "full_time",
  position: "instructor",
  min_units: 4,
  max_units: 12,
  unavailable_times: [],
};

export default function TeachersManage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [semesterConfig, setSemesterConfig] = useState(null);

  useEffect(() => {
    load();
    loadSemesterConfig();
  }, []);

  const loadSemesterConfig = async () => {
    const activeId = authService.getActiveUniversityConfigId();
    if (!activeId) return;
    const res = await universityService.getById(activeId);
    if (res.success) setSemesterConfig(res.data);
  };

  const load = async () => {
    setLoading(true);
    const res = await teacherService.getAll();
    if (res.success) setTeachers(res.data);
    else toast.error(res.message);
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (teacher) => {
    const data = teacherService.toFormData(teacher);
    setForm(data);
    setIsEditing(true);
    setShowForm(true);
  };

  const toggleUnavailable = (dayName, slotId) => {
    const tag = `${dayName}-${slotId}`;
    setForm((prev) => {
      const exists = prev.unavailable_times.includes(tag);
      return {
        ...prev,
        unavailable_times: exists
          ? prev.unavailable_times.filter((t) => t !== tag)
          : [...prev.unavailable_times, tag],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام استاد الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = isEditing
        ? await teacherService.update(form.id, form)
        : await teacherService.create(form);

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
    const res = await teacherService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const handleCreateAccount = async (teacher) => {
    const res = await teacherService.createUserAccount(teacher.id);
    if (res.success) {
      toast.success(res.message);
      load();
    } else {
      toast.error(res.message);
    }
  };

  const columns = [
    { key: "code", label: "کد استاد" },
    { key: "full_name", label: "نام و نام خانوادگی" },
    { key: "degree_display", label: "مدرک", render: (r) => r.degree_display || "—" },
    { key: "position_display", label: "پست", render: (r) => r.position_display || "—" },
    { key: "min_units", label: "حداقل واحد" },
    { key: "max_units", label: "حداکثر واحد" },
    {
      key: "has_account",
      label: "حساب کاربری",
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs ${r.user ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
          {r.user ? "دارد" : "ندارد"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت اساتید</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          استاد جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={teachers}
        loading={loading}
        searchPlaceholder="جستجوی استاد..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        extraActions={(row) =>
          !row.user && (
            <button
              type="button"
              title="ایجاد حساب کاربری برای ورود"
              onClick={() => handleCreateAccount(row)}
              className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <UserPlus size={13} />
            </button>
          )
        }
      />

      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش استاد" : "ثبت استاد جدید"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <InputField id="code" label="کد استاد" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full" />
          <InputField id="name" label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          <InputField id="last_name" label="نام خانوادگی" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full" />
          <InputField id="gender" label="جنسیت" type="select" options={GENDER_OPTIONS} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full" />
          <InputField id="degree" label="مدرک تحصیلی" type="select" options={DEGREE_OPTIONS} value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} className="w-full" />
          <InputField id="employment_type" label="نوع استخدام" type="select" options={EMPLOYMENT_OPTIONS} value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="w-full" />
          <InputField id="position" label="پست دانشگاهی" type="select" options={POSITION_OPTIONS} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full" />
          <InputField id="min_units" label="حداقل واحد تدریس" type="number" value={form.min_units} onChange={(e) => setForm({ ...form, min_units: e.target.value })} className="w-full" />
          <InputField id="max_units" label="حداکثر واحد تدریس" type="number" value={form.max_units} onChange={(e) => setForm({ ...form, max_units: e.target.value })} className="w-full" />
        </div>

        {semesterConfig ? (
          <div className="mt-5">
            <p className="text-sm font-secondary text-text_primary_color mb-2">
              زمان‌های غیرقابل دسترس استاد (این اطلاعات مستقیماً به الگوریتم زمان‌بندی داده می‌شود)
            </p>
            <div className="overflow-x-auto border border-line_color rounded-lg">
              <table className="w-full text-xs text-center">
                <thead>
                  <tr className="bg-title_header">
                    <th className="px-2 py-2">بازه</th>
                    {(semesterConfig.days_of_week || []).filter((d) => d.enabled).map((day) => (
                      <th key={day.id} className="px-2 py-2 whitespace-nowrap">{day.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(semesterConfig.time_slots || []).filter((s) => s.enabled).map((slot) => (
                    <tr key={slot.id} className="border-t border-line_color">
                      <td className="px-2 py-2 whitespace-nowrap text-text_secondary_color">{slot.start}-{slot.end}</td>
                      {(semesterConfig.days_of_week || []).filter((d) => d.enabled).map((day) => {
                        const tag = `${day.name}-${slot.id}`;
                        const isUnavailable = form.unavailable_times.includes(tag);
                        return (
                          <td key={day.id} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => toggleUnavailable(day.name, slot.id)}
                              className={`w-7 h-7 rounded-md border transition-colors ${
                                isUnavailable
                                  ? "bg-error/80 border-error"
                                  : "bg-success/10 border-success/30 hover:bg-success/20"
                              }`}
                              title={isUnavailable ? "غیرقابل دسترس" : "قابل دسترس"}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text_secondary_color mt-1">
              روی خانه‌ها کلیک کنید؛ قرمز = استاد در آن بازه در دسترس نیست.
            </p>
          </div>
        ) : (
          <p className="text-xs text-warning mt-4">
            برای تعیین زمان‌های در دسترس، ابتدا باید یک نیمسال فعال انتخاب شده باشد.
          </p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف استاد"
        message={`آیا از حذف «${deleteTarget?.full_name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
