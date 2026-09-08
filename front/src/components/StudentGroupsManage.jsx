// src/components/StudentGroupsManage.jsx
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import studentGroupService from "../services/studentGroupService";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const DEGREE_LEVEL_OPTIONS = [
  { value: "associate", label: "کاردانی" },
  { value: "bachelor", label: "کارشناسی" },
  { value: "master", label: "کارشناسی ارشد" },
  { value: "phd", label: "دکتری" },
];
const GENDER_OPTIONS = [
  { value: "0", label: "مختلط" },
  { value: "1", label: "مرد" },
  { value: "2", label: "زن" },
];

const currentPersianYear = 1403; // سال پایه برای پیش‌فرض فرم؛ کاربر می‌تواند تغییر دهد

const emptyForm = {
  id: null,
  name: "",
  size: 30,
  entry_year: currentPersianYear,
  field_of_study: "",
  degree_level: "bachelor",
  gender: "0",
};

export default function StudentGroupsManage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await studentGroupService.getAll();
    if (res.success) setGroups(res.data);
    else toast.error(res.message);
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (group) => {
    setForm({
      id: group.id,
      name: group.name,
      size: group.size,
      entry_year: group.entry_year || currentPersianYear,
      field_of_study: group.field_of_study || "",
      degree_level: group.degree_level || "bachelor",
      gender: String(group.gender ?? 0),
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام گروه الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = isEditing
        ? await studentGroupService.update(form.id, form)
        : await studentGroupService.create(form);

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
    const res = await studentGroupService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const columns = [
    { key: "name", label: "نام گروه" },
    { key: "entry_year", label: "سال ورود", render: (r) => r.entry_year || "—" },
    { key: "field_of_study", label: "رشته تحصیلی", render: (r) => r.field_of_study || "—" },
    { key: "degree_level_display", label: "مقطع", render: (r) => r.degree_level_display || "—" },
    { key: "size", label: "تعداد دانشجویان" },
    {
      key: "required_courses",
      label: "دروس الزامی",
      render: (r) => (r.required_courses?.length ? `${r.required_courses.length} درس` : "—"),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت گروه‌های دانشجویی</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          گروه جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={groups}
        loading={loading}
        searchPlaceholder="جستجوی گروه..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش گروه دانشجویی" : "ثبت گروه دانشجویی جدید"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField id="name" label="نام گروه" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          <InputField id="size" label="تعداد دانشجویان" type="number" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full" />
          <InputField id="entry_year" label="سال ورود (مثلاً ۱۴۰۳)" type="number" value={form.entry_year} onChange={(e) => setForm({ ...form, entry_year: e.target.value })} className="w-full" />
          <InputField id="field_of_study" label="رشته تحصیلی" value={form.field_of_study} onChange={(e) => setForm({ ...form, field_of_study: e.target.value })} className="w-full" />
          <InputField id="degree_level" label="مقطع تحصیلی" type="select" options={DEGREE_LEVEL_OPTIONS} value={form.degree_level} onChange={(e) => setForm({ ...form, degree_level: e.target.value })} className="w-full" />
          <InputField id="gender" label="جنسیت گروه" type="select" options={GENDER_OPTIONS} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full" />
        </div>
        <p className="text-xs text-text_secondary_color mt-3">
          پیوند دروس الزامی/اختیاری به این گروه، در نسخه‌های بعدی به این فرم اضافه می‌شود.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف گروه"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
