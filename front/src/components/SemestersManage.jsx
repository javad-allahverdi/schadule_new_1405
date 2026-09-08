// src/components/SemestersManage.jsx
import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Trash2, Copy, FileSpreadsheet } from "lucide-react";
import universityService from "../services/universityService";
import authService from "../services/auth";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const DEFAULT_DAYS = [
  { id: 0, name: "شنبه", enabled: true },
  { id: 1, name: "یکشنبه", enabled: true },
  { id: 2, name: "دوشنبه", enabled: true },
  { id: 3, name: "سه‌شنبه", enabled: true },
  { id: 4, name: "چهارشنبه", enabled: true },
  { id: 5, name: "پنجشنبه", enabled: false },
];

const DEFAULT_SLOTS = [
  { id: 1, start: "08:00", end: "10:00", enabled: true },
  { id: 2, start: "10:00", end: "12:00", enabled: true },
  { id: 3, start: "13:30", end: "15:30", enabled: true },
  { id: 4, start: "15:30", end: "17:30", enabled: true },
];

const emptyForm = {
  id: null,
  name: "",
  semester: "",
  days_of_week: DEFAULT_DAYS,
  time_slots: DEFAULT_SLOTS,
  max_units_per_student: 20,
  max_classes_per_day: 3,
};

export default function SemestersManage({ onActiveChanged, universityId = null }) {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeId, setActiveId] = useState(authService.getActiveUniversityConfigId());
  const [copyTarget, setCopyTarget] = useState(null);
  const [copySourceId, setCopySourceId] = useState("");
  const [copyOptions, setCopyOptions] = useState({
    copy_teachers: true,
    copy_places: true,
    copy_courses: false,
    copy_groups: false,
  });
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await universityService.getAll();
    if (res.success) {
      const filtered = universityId
        ? res.data.filter((s) => String(s.university) === String(universityId))
        : res.data;
      setSemesters(filtered);
    } else toast.error(res.message);
    setLoading(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      id: s.id,
      name: s.name,
      semester: s.semester,
      days_of_week: s.days_of_week?.length ? s.days_of_week : DEFAULT_DAYS,
      time_slots: s.time_slots?.length ? s.time_slots : DEFAULT_SLOTS,
      max_units_per_student: s.max_units_per_student,
      max_classes_per_day: s.max_classes_per_day,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const toggleDay = (dayId) => {
    setForm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.map((d) =>
        d.id === dayId ? { ...d, enabled: !d.enabled } : d
      ),
    }));
  };

  const toggleSlot = (slotId) => {
    setForm((prev) => ({
      ...prev,
      time_slots: prev.time_slots.map((s) =>
        s.id === slotId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const addSlot = () => {
    setForm((prev) => {
      const nextId = Math.max(0, ...prev.time_slots.map((s) => s.id)) + 1;
      return {
        ...prev,
        time_slots: [...prev.time_slots, { id: nextId, start: "08:00", end: "10:00", enabled: true }],
      };
    });
  };

  const updateSlotTime = (slotId, field, value) => {
    setForm((prev) => ({
      ...prev,
      time_slots: prev.time_slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSlot = (slotId) => {
    setForm((prev) => ({
      ...prev,
      time_slots: prev.time_slots.filter((s) => s.id !== slotId),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.semester.trim()) {
      toast.error("نام پیکربندی و عنوان نیمسال الزامی است");
      return;
    }
    if (!form.days_of_week.some((d) => d.enabled)) {
      toast.error("حداقل یک روز هفته باید فعال باشد");
      return;
    }
    if (!form.time_slots.some((s) => s.enabled)) {
      toast.error("حداقل یک بازه‌ی زمانی باید فعال باشد");
      return;
    }

    setSaving(true);
    try {
      const payload = universityService.formatUniversityData(form, universityId);
      const res = isEditing
        ? await universityService.update(form.id, payload)
        : await universityService.create(payload);

      if (res.success) {
        toast.success(isEditing ? "نیمسال ویرایش شد" : "نیمسال جدید ثبت شد");
        setShowForm(false);
        await load();
        if (!isEditing && !activeId) {
          handleSetActive(res.data.id);
        }
        // بعد از ایجاد نیمسال جدید، اگر نیمسال دیگری هم وجود دارد، بلافاصله
        // پیشنهاد کپی کردن اطلاعات را نمایش می‌دهیم تا این قابلیت گم نشود
        if (!isEditing && semesters.length >= 1) {
          openCopy(res.data);
        }
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await universityService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setSemesters((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (String(deleteTarget.id) === String(activeId)) {
        authService.setActiveUniversityConfigId(null);
        setActiveId(null);
      }
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const handleSetActive = (id) => {
    authService.setActiveUniversityConfigId(id);
    setActiveId(String(id));
    toast.success("این نیمسال به‌عنوان نیمسال فعال انتخاب شد");
    if (onActiveChanged) onActiveChanged(id);
  };

  const handleExportExcel = async (semester) => {
    const res = await universityService.exportDataToExcel(semester.id, semester.name);
    if (!res.success) toast.error(res.message);
  };

  const openCopy = (target) => {
    setCopyTarget(target);
    const otherSemesters = semesters.filter((s) => s.id !== target.id);
    setCopySourceId(otherSemesters[0]?.id ? String(otherSemesters[0].id) : "");
    setCopyOptions({ copy_teachers: true, copy_places: true, copy_courses: false, copy_groups: false });
  };

  const handleCopy = async () => {
    if (!copySourceId) {
      toast.error("نیمسال مبدأ را انتخاب کنید");
      return;
    }
    setCopying(true);
    try {
      const res = await universityService.copyFrom(copyTarget.id, copySourceId, copyOptions);
      if (res.success) {
        const c = res.counts || {};
        toast.success(
          `کپی انجام شد: ${c.teachers || 0} استاد، ${c.places || 0} مکان، ${c.courses || 0} درس، ${c.groups || 0} گروه`
        );
        setCopyTarget(null);
        load();
      } else {
        toast.error(res.message);
      }
    } finally {
      setCopying(false);
    }
  };

  const columns = [
    { key: "name", label: "نام پیکربندی" },
    { key: "semester", label: "نیمسال" },
    { key: "teachers_count", label: "تعداد اساتید" },
    { key: "courses_count", label: "تعداد دروس" },
    { key: "places_count", label: "تعداد مکان‌ها" },
    {
      key: "active",
      label: "فعال",
      render: (row) =>
        String(row.id) === String(activeId) ? (
          <span className="flex items-center gap-1 text-success text-xs">
            <CheckCircle2 size={14} /> نیمسال فعال
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleSetActive(row.id)}
            className="text-xs text-secondary hover:underline"
          >
            انتخاب به‌عنوان فعال
          </button>
        ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت نیمسال‌ها</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          نیمسال جدید
        </Button>
      </div>

      <p className="text-sm text-text_secondary_color mb-4">
        هر «نیمسال» یک مجموعه‌ی مستقل از اساتید، دروس، مکان‌ها و گروه‌های دانشجویی است.
        قبل از ثبت هر اطلاعاتی، حتماً یک نیمسال بسازید و آن را به‌عنوان «نیمسال فعال» انتخاب کنید.
      </p>

      <DataTable
        columns={columns}
        rows={semesters}
        loading={loading}
        searchPlaceholder="جستجوی نیمسال..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        extraActions={(row) => (
          <>
            <button
              type="button"
              title="دانلود اطلاعات این نیمسال (اکسل)"
              onClick={() => handleExportExcel(row)}
              className="px-2 py-1 text-xs rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet size={13} />
            </button>
            {semesters.length > 1 && (
              <button
                type="button"
                title="کپی اطلاعات از نیمسال دیگر"
                onClick={() => openCopy(row)}
                className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors flex items-center gap-1"
              >
                <Copy size={13} />
              </button>
            )}
            {semesters.length === 1 && (
              <button
                type="button"
                title="برای کپی، ابتدا باید حداقل یک نیمسال دیگر بسازید"
                onClick={() => toast.error("برای کپی کردن اطلاعات، ابتدا یک نیمسال دیگر بسازید تا بتوانید از آن کپی کنید.")}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-400 flex items-center gap-1 cursor-not-allowed"
              >
                <Copy size={13} />
              </button>
            )}
          </>
        )}
      />

      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش نیمسال" : "ایجاد نیمسال جدید"}
        </h3>
        <div className="max-h-[65vh] overflow-y-auto p-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="name" label="نام پیکربندی" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" />
            <InputField id="semester" label="عنوان نیمسال (مثلاً ۱۴۰۴-۱)" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full" />
            <InputField id="max_units_per_student" label="حداکثر واحد هر دانشجو" type="number" value={form.max_units_per_student} onChange={(e) => setForm({ ...form, max_units_per_student: e.target.value })} className="w-full" />
            <InputField id="max_classes_per_day" label="حداکثر کلاس در روز (هر استاد)" type="number" value={form.max_classes_per_day} onChange={(e) => setForm({ ...form, max_classes_per_day: e.target.value })} className="w-full" />
          </div>

          <div>
            <p className="text-sm font-secondary text-text_primary_color mb-2">روزهای فعال هفته</p>
            <div className="flex flex-wrap gap-2">
              {form.days_of_week.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    day.enabled
                      ? "bg-secondary text-white border-secondary"
                      : "bg-white text-text_secondary_color border-line_color"
                  }`}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-secondary text-text_primary_color">بازه‌های زمانی کلاس</p>
              <button type="button" onClick={addSlot} className="text-xs text-secondary hover:underline flex items-center gap-1">
                <Plus size={13} /> افزودن بازه
              </button>
            </div>
            <div className="space-y-2">
              {form.time_slots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot.id)}
                    className={`px-2 py-1 rounded-md text-xs border ${
                      slot.enabled ? "bg-secondary text-white border-secondary" : "bg-white text-text_secondary_color border-line_color"
                    }`}
                  >
                    {slot.enabled ? "فعال" : "غیرفعال"}
                  </button>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlotTime(slot.id, "start", e.target.value)}
                    className="border border-line_color rounded-md px-2 py-1 text-sm"
                  />
                  <span className="text-text_secondary_color text-sm">تا</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlotTime(slot.id, "end", e.target.value)}
                    className="border border-line_color rounded-md px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="text-error hover:bg-error/10 rounded-md p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
        title="حذف نیمسال"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟ همه‌ی اساتید، دروس، مکان‌ها و گروه‌های این نیمسال نیز حذف خواهند شد.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* کپی اطلاعات از نیمسال دیگر */}
      <AnimatedModal isVisible={!!copyTarget} onClose={() => setCopyTarget(null)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-2">
          کپی اطلاعات به «{copyTarget?.name}»
        </h3>
        <p className="text-sm text-text_secondary_color mb-4">
          اساتید، مکان‌ها، دروس یا گروه‌های دانشجویی یک نیمسال دیگر را در این نیمسال کپی کنید،
          تا مجبور نباشید دوباره وارد کنید. حساب کاربری (لاگین) اساتید کپی نمی‌شود.
        </p>

        <InputField
          id="copy_source"
          label="کپی از نیمسال"
          type="select"
          options={semesters.filter((s) => s.id !== copyTarget?.id).map((s) => ({ value: String(s.id), label: `${s.name} (${s.semester})` }))}
          value={copySourceId}
          onChange={(e) => setCopySourceId(e.target.value)}
          className="w-full mb-4"
        />

        <div className="space-y-2">
          {[
            { key: "copy_teachers", label: "اساتید" },
            { key: "copy_places", label: "مکان‌ها" },
            { key: "copy_courses", label: "دروس (به‌همراه اساتید هر درس)" },
            { key: "copy_groups", label: "گروه‌های دانشجویی" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm text-text_primary_color cursor-pointer">
              <input
                type="checkbox"
                checked={copyOptions[opt.key]}
                onChange={(e) => setCopyOptions({ ...copyOptions, [opt.key]: e.target.checked })}
                className="w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setCopyTarget(null)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleCopy} disabled={copying} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {copying ? "در حال کپی..." : "کپی کن"}
          </Button>
        </div>
      </AnimatedModal>
    </div>
  );
}
