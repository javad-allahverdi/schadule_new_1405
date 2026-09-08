// src/components/PlacesManage.jsx
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import placeService from "../services/placeService";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

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

const GENDER_OPTIONS = [
  { value: "0", label: "مختلط" },
  { value: "1", label: "مرد" },
  { value: "2", label: "زن" },
];

const emptyForm = {
  id: null,
  code: "",
  name: "",
  capacity: 30,
  type: "کلاس تئوری",
  gender: "0",
  available: true,
};

export default function PlacesManage() {
  const [places, setPlaces] = useState([]);
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
    const res = await placeService.getAll();
    if (res.success) setPlaces(res.data);
    else toast.error(res.message);
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (place) => {
    setForm({
      id: place.id,
      code: place.code,
      name: place.name,
      capacity: place.capacity,
      type: place.place_type,
      gender: String(place.gender),
      available: place.available,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام مکان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = isEditing
        ? await placeService.update(form.id, form)
        : await placeService.create(form);

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
    const res = await placeService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setPlaces((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const columns = [
    { key: "code", label: "کد" },
    { key: "name", label: "نام مکان" },
    { key: "capacity", label: "ظرفیت" },
    { key: "place_type_display", label: "نوع", render: (r) => r.place_type_display || r.place_type },
    { key: "gender_display", label: "جنسیت", render: (r) => r.gender_display || "مختلط" },
    {
      key: "available",
      label: "وضعیت",
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs ${r.available ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
          {r.available ? "فعال" : "غیرفعال"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت مکان‌ها (کلاس/آزمایشگاه)</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          مکان جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={places}
        loading={loading}
        searchPlaceholder="جستجوی مکان..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش مکان" : "ثبت مکان جدید"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField id="code" label="کد مکان" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full" />
          <InputField id="name" label="نام مکان" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
          <InputField id="capacity" label="ظرفیت" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full" />
          <InputField id="type" label="نوع مکان" type="select" options={PLACE_TYPE_OPTIONS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full" />
          <InputField id="gender" label="جنسیت" type="select" options={GENDER_OPTIONS} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full" />
          <InputField
            id="available"
            label="وضعیت"
            type="select"
            options={[{ value: "true", label: "فعال" }, { value: "false", label: "غیرفعال" }]}
            value={String(form.available)}
            onChange={(e) => setForm({ ...form, available: e.target.value === "true" })}
            className="w-full"
          />
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
        title="حذف مکان"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
