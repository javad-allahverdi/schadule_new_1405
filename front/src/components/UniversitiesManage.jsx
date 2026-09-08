// src/components/UniversitiesManage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, ShieldCheck, ShieldOff, Link as LinkIcon, Settings2 } from "lucide-react";
import authService from "../services/auth";
import toast from "../utils/toast";
import DataTable from "./common/DataTable";
import ConfirmDialog from "./common/ConfirmDialog";
import AnimatedModal from "./AnimatedModal";
import InputField from "./InputField";
import Button from "./Button";

const emptyForm = {
  id: null,
  name: "",
  subdomain: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  max_users: 50,
  valid_until: "", // yyyy-mm-dd (خالی = نامحدود)
  admin_username: "",
  admin_email: "",
  admin_password: "",
  admin_first_name: "",
  admin_last_name: "",
};

export default function UniversitiesManage() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDays, setExtendDays] = useState(30);

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const res = await authService.getUniversities();
      if (res.success) {
        setUniversities(res.universities || []);
      } else {
        toast.error(res.message || "خطا در دریافت لیست دانشگاه‌ها");
      }
    } catch (e) {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (uni) => {
    setForm({
      id: uni.id,
      name: uni.name || "",
      subdomain: uni.subdomain || "",
      contact_email: uni.contact_email || "",
      contact_phone: uni.contact_phone || "",
      address: uni.address || "",
      max_users: uni.max_users || 50,
      valid_until: uni.valid_until ? uni.valid_until.slice(0, 10) : "",
      admin_username: "",
      admin_email: "",
      admin_password: "",
      admin_first_name: "",
      admin_last_name: "",
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("نام دانشگاه الزامی است");
      return;
    }
    if (!isEditing && !form.subdomain.trim()) {
      toast.error("زیردامنه الزامی است");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        subdomain: form.subdomain,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        address: form.address,
        max_users: parseInt(form.max_users) || 50,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      };

      if (!isEditing) {
        // فقط هنگام ایجاد، امکان ساخت هم‌زمان حساب مدیر اولیه هست
        if (form.admin_username && form.admin_password) {
          payload.admin_username = form.admin_username;
          payload.admin_email = form.admin_email;
          payload.admin_password = form.admin_password;
          payload.admin_first_name = form.admin_first_name;
          payload.admin_last_name = form.admin_last_name;
        }
        const res = await authService.createUniversity(payload);
        if (!res.success) {
          toast.error(res.message || "خطا در ایجاد دانشگاه");
          return;
        }
      } else {
        const res = await authService.updateUniversity(form.id, payload);
        if (!res.success) {
          toast.error(res.message || "خطا در ویرایش دانشگاه");
          return;
        }
      }

      setShowForm(false);
      loadUniversities();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await authService.deleteUniversity(deleteTarget.id);
    if (res.success) {
      setUniversities((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const handleToggleActive = async (uni) => {
    const res = await authService.extendUniversityAccess(uni.id, { is_active: !uni.is_active });
    if (res.success) {
      loadUniversities();
    }
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    const res = await authService.extendUniversityAccess(extendTarget.id, {
      extend_days: parseInt(extendDays) || 30,
    });
    if (res.success) {
      loadUniversities();
    }
    setExtendTarget(null);
  };

  const columns = [
    { key: "name", label: "نام دانشگاه" },
    {
      key: "subdomain",
      label: "زیردامنه",
      render: (row) => (
        <span className="flex items-center gap-1 text-secondary" dir="ltr">
          <LinkIcon size={13} />
          {row.subdomain}.example.com
        </span>
      ),
    },
    { key: "members_count", label: "تعداد کاربران" },
    {
      key: "is_accessible",
      label: "وضعیت",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.is_accessible
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {row.is_accessible ? "فعال" : row.is_expired ? "منقضی شده" : "غیرفعال"}
        </span>
      ),
    },
    {
      key: "days_remaining",
      label: "اعتبار باقی‌مانده",
      render: (row) =>
        row.valid_until ? (row.days_remaining != null ? `${row.days_remaining} روز` : "-") : "نامحدود",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">مدیریت دانشگاه‌ها</h2>
        <Button
          type="button"
          onClick={openCreateForm}
          className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1"
        >
          <Plus size={16} />
          دانشگاه جدید
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={universities}
        loading={loading}
        searchPlaceholder="جستجوی دانشگاه..."
        onEdit={openEditForm}
        onDelete={setDeleteTarget}
        extraActions={(row) => (
          <>
            <button
              type="button"
              title="مدیریت اطلاعات این دانشگاه"
              onClick={() => navigate(`/supervisor/university/${row.id}`)}
              className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors flex items-center gap-1"
            >
              <Settings2 size={13} /> مدیریت
            </button>
            <button
              type="button"
              title={row.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}
              onClick={() => handleToggleActive(row)}
              className="px-2 py-1 text-xs rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors flex items-center gap-1"
            >
              {row.is_active ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
            </button>
            <button
              type="button"
              title="تمدید اعتبار"
              onClick={() => setExtendTarget(row)}
              className="px-2 py-1 text-xs rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1"
            >
              <Clock size={13} />
            </button>
          </>
        )}
      />

      {/* فرم ایجاد/ویرایش دانشگاه */}
      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          {isEditing ? "ویرایش دانشگاه" : "ایجاد دانشگاه جدید"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <InputField
            id="name"
            label="نام دانشگاه"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full"
          />
          <InputField
            id="subdomain"
            label="زیردامنه (مثلاً eng)"
            value={form.subdomain}
            onChange={(e) =>
              setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
            }
            className="w-full"
            disabled={isEditing}
          />
          <InputField
            id="contact_email"
            label="ایمیل تماس"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            className="w-full"
          />
          <InputField
            id="contact_phone"
            label="تلفن تماس"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            className="w-full"
          />
          <InputField
            id="max_users"
            label="حداکثر تعداد کاربران"
            type="number"
            value={form.max_users}
            onChange={(e) => setForm({ ...form, max_users: e.target.value })}
            className="w-full"
          />
          <InputField
            id="valid_until"
            label="تاریخ پایان اعتبار (خالی = نامحدود)"
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            className="w-full"
          />
          <InputField
            id="address"
            label="آدرس"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full sm:col-span-2"
          />

          {!isEditing && (
            <>
              <div className="sm:col-span-2 border-t border-line_color pt-3 mt-1">
                <p className="text-sm text-text_secondary_color mb-2">
                  (اختیاری) ایجاد هم‌زمان حساب مدیر اولیه برای این دانشگاه
                </p>
              </div>
              <InputField
                id="admin_username"
                label="نام کاربری مدیر"
                value={form.admin_username}
                onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                className="w-full"
              />
              <InputField
                id="admin_password"
                label="رمز عبور مدیر"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                className="w-full"
              />
              <InputField
                id="admin_first_name"
                label="نام مدیر"
                value={form.admin_first_name}
                onChange={(e) => setForm({ ...form, admin_first_name: e.target.value })}
                className="w-full"
              />
              <InputField
                id="admin_last_name"
                label="نام خانوادگی مدیر"
                value={form.admin_last_name}
                onChange={(e) => setForm({ ...form, admin_last_name: e.target.value })}
                className="w-full"
              />
              <InputField
                id="admin_email"
                label="ایمیل مدیر"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                className="w-full sm:col-span-2"
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            onClick={() => setShowForm(false)}
            className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-secondary text-white px-4 py-2 w-auto h-auto"
          >
            {saving ? "در حال ذخیره..." : isEditing ? "ذخیره تغییرات" : "ایجاد دانشگاه"}
          </Button>
        </div>
      </AnimatedModal>

      {/* تمدید اعتبار */}
      <AnimatedModal isVisible={!!extendTarget} onClose={() => setExtendTarget(null)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">
          تمدید اعتبار «{extendTarget?.name}»
        </h3>
        <InputField
          id="extend_days"
          label="تعداد روز افزوده شود"
          type="number"
          value={extendDays}
          onChange={(e) => setExtendDays(e.target.value)}
          className="w-full"
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            onClick={() => setExtendTarget(null)}
            className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleExtend}
            className="bg-success text-white px-4 py-2 w-auto h-auto"
          >
            تمدید
          </Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف دانشگاه"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟ همه‌ی داده‌های مرتبط (کاربران، دروس، برنامه‌ها) نیز حذف خواهند شد.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
