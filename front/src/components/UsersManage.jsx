// src/components/UsersManage.jsx
import { useEffect, useState } from "react";
import { Plus, KeyRound } from "lucide-react";
import authService from "../services/auth";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const ROLE_OPTIONS_ADMIN = [
  { value: "teacher", label: "استاد" },
  { value: "education_officer", label: "مسئول آموزش" },
];

const ROLE_OPTIONS_SUPERVISOR = [
  { value: "admin", label: "مدیر دانشگاه" },
  { value: "education_officer", label: "مسئول آموزش" },
  { value: "teacher", label: "استاد" },
];

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password2: "",
  role: "teacher",
  university: "",
};

const emptyEditForm = {
  id: null,
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  role: "teacher",
};

/**
 * مدیریت کاربران. برای سوپروایزر (isSupervisorView=true) لیست همه‌ی دانشگاه‌ها
 * را هم می‌گیرد تا بتواند دانشگاه مقصد کاربر جدید را انتخاب کند.
 */
export default function UsersManage({ isSupervisorView = false, fixedUniversityId = null }) {
  const [users, setUsers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [showEdit, setShowEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    load();
    if (isSupervisorView && !fixedUniversityId) loadUniversities();
  }, [roleFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const filters = { page: 1, page_size: 100 };
      if (roleFilter) filters.role = roleFilter;
      if (fixedUniversityId) filters.university = fixedUniversityId;
      const res = await authService.getUsers(filters);
      if (res.success) setUsers(res.users || []);
    } catch (e) {
      toast.error("خطا در بارگذاری کاربران");
    } finally {
      setLoading(false);
    }
  };

  const loadUniversities = async () => {
    const res = await authService.getUniversities();
    if (res.success) setUniversities(res.universities || []);
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      role: isSupervisorView ? "admin" : "teacher",
      university: fixedUniversityId || universities[0]?.id || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.first_name.trim() || !form.email.trim()) {
      toast.error("نام کاربری، نام و ایمیل الزامی است");
      return;
    }
    if (form.password.length < 8) {
      toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (form.password !== form.password2) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (isSupervisorView && !fixedUniversityId && !form.university) {
      toast.error("انتخاب دانشگاه الزامی است");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (isSupervisorView) {
        payload.university = parseInt(fixedUniversityId || form.university);
      }
      const res = await authService.createUser(payload);
      if (res.success) {
        setShowForm(false);
        load();
      } else {
        toast.error(res.message || "خطا در ایجاد کاربر");
      }
    } catch (e) {
      // پیام خطا از پاسخ سرور در حالت‌های اعتبارسنجی نمایش داده می‌شود
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await authService.deleteUser(deleteTarget.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const openEdit = (user) => {
    setEditForm({
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      role: user.role,
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.first_name.trim() || !editForm.email.trim()) {
      toast.error("نام و ایمیل الزامی است");
      return;
    }
    setSavingEdit(true);
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone_number: editForm.phone_number,
      };
      // فقط سوپروایزر/مدیر اجازه دارند نقش کاربر را هم تغییر دهند (خود کاربر جاری اینجا نیست)
      if (isSupervisorView || editForm.role !== "admin") {
        payload.role = editForm.role;
      }
      const res = await authService.updateUser(editForm.id, payload);
      if (res.success) {
        setShowEdit(false);
        load();
      } else {
        toast.error(res.message || "خطا در ویرایش کاربر");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordTarget) return;
    if (newPassword.length < 8) {
      toast.error("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }
    setSettingPassword(true);
    try {
      const res = await authService.setUserPassword(passwordTarget.id, newPassword);
      if (res.success) {
        setPasswordTarget(null);
        setNewPassword("");
      }
    } finally {
      setSettingPassword(false);
    }
  };

  const handleToggleActive = async (user) => {
    const res = await authService.updateUser(user.id, { is_active: !user.is_active });
    if (res.success) load();
  };

  const columns = [
    {
      key: "name",
      label: "کاربر",
      render: (row) => (
        <div>
          <p className="font-medium">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-text_secondary_color">{row.username}</p>
        </div>
      ),
    },
    { key: "role_display", label: "نقش" },
    ...(isSupervisorView && !fixedUniversityId ? [{ key: "university_name", label: "دانشگاه", render: (r) => r.university_name || "—" }] : []),
    { key: "email", label: "ایمیل" },
    {
      key: "is_active",
      label: "وضعیت",
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs ${r.is_active ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
          {r.is_active ? "فعال" : "غیرفعال"}
        </span>
      ),
    },
  ];

  const roleOptions = isSupervisorView ? ROLE_OPTIONS_SUPERVISOR : ROLE_OPTIONS_ADMIN;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت کاربران</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          کاربر جدید
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setRoleFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${roleFilter === "" ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          همه
        </button>
        {roleOptions.map((r) => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${roleFilter === r.value ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        searchPlaceholder="جستجوی کاربر..."
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        extraActions={(row) => (
          <>
            <button
              type="button"
              title="تغییر رمز عبور"
              onClick={() => { setPasswordTarget(row); setNewPassword(""); }}
              className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <KeyRound size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleActive(row)}
              className="px-2 py-1 text-xs rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
            >
              {row.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}
            </button>
          </>
        )}
      />

      {/* فرم ایجاد کاربر جدید */}
      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">ایجاد کاربر جدید</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <InputField id="username" label="نام کاربری" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full" />
          <InputField id="email" label="ایمیل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full" />
          <InputField id="first_name" label="نام" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full" />
          <InputField id="last_name" label="نام خانوادگی" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full" />
          <InputField id="password" label="رمز عبور" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full" />
          <InputField id="password2" label="تکرار رمز عبور" type="password" value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} className="w-full" />
          <InputField
            id="role"
            label="نقش"
            type="select"
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full"
          />
          {isSupervisorView && !fixedUniversityId && (
            <InputField
              id="university"
              label="دانشگاه"
              type="select"
              options={universities.map((u) => ({ value: String(u.id), label: u.name }))}
              value={String(form.university)}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              className="w-full"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {saving ? "در حال ذخیره..." : "ایجاد کاربر"}
          </Button>
        </div>
      </AnimatedModal>

      {/* ویرایش کاربر */}
      <AnimatedModal isVisible={showEdit} onClose={() => setShowEdit(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">ویرایش کاربر</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField id="edit_first_name" label="نام" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full" />
          <InputField id="edit_last_name" label="نام خانوادگی" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full" />
          <InputField id="edit_email" label="ایمیل" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full" />
          <InputField id="edit_phone" label="شماره تلفن" value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} className="w-full" />
          <InputField
            id="edit_role"
            label="نقش"
            type="select"
            options={isSupervisorView ? ROLE_OPTIONS_SUPERVISOR : ROLE_OPTIONS_ADMIN}
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowEdit(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSaveEdit} disabled={savingEdit} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </AnimatedModal>

      {/* تغییر رمز عبور دستی */}
      <AnimatedModal isVisible={!!passwordTarget} onClose={() => setPasswordTarget(null)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          تغییر رمز عبور «{passwordTarget?.first_name} {passwordTarget?.last_name}»
        </h3>
        <InputField
          id="new_password"
          label="رمز عبور جدید"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-text_secondary_color mt-2">
          این رمز بلافاصله جایگزین رمز فعلی کاربر می‌شود؛ نیازی به دانستن رمز قبلی نیست.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setPasswordTarget(null)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleSetPassword} disabled={settingPassword} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {settingPassword ? "در حال ذخیره..." : "تغییر رمز عبور"}
          </Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف کاربر"
        message={`آیا از حذف «${deleteTarget?.first_name} ${deleteTarget?.last_name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
