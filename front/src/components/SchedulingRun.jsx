// src/components/SchedulingRun.jsx
import { useEffect, useRef, useState } from "react";
import { Plus, Play, Download, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import schedulingService from "../services/schedulingService";
import authService from "../services/auth";
import toast from "../utils/toast";
import AnimatedModal from "./AnimatedModal";
import ConfirmDialog from "./common/ConfirmDialog";
import InputField from "./InputField";
import Button from "./Button";

const STATUS_LABEL = {
  pending: "در انتظار اجرا",
  processing: "در حال پردازش",
  completed: "تکمیل شده",
  failed: "ناموفق",
};
const STATUS_COLOR = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  failed: "bg-error/10 text-error",
};

const emptyForm = {
  name: "",
  description: "",
  popsize: 40,
  maxgen: 80,
  teacher_conflict_cost: 100,
  place_conflict_cost: 100,
  capacity_cost: 50,
  gender_mismatch_cost: 40,
};

export default function SchedulingRun() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await schedulingService.getAll();
    if (res.success) setTasks(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    if (!authService.getActiveUniversityConfigId()) {
      toast.error("ابتدا باید یک نیمسال فعال انتخاب کنید");
      return;
    }
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("نام وظیفه الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await schedulingService.create(form);
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

  const handleRun = async (task) => {
    const res = await schedulingService.run(task.id);
    if (res.success) {
      toast.success(res.message);
      load();
      startPolling(task.id);
    } else {
      toast.error(res.message);
    }
  };

  const startPolling = (taskId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await schedulingService.getStatus(taskId);
      if (res.success) {
        const d = res.data;
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: d.status, status_display: d.status_display } : t)));
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) => ({ ...prev, ...d }));
        }
        if (d.status === "completed" || d.status === "failed") {
          clearInterval(pollRef.current);
          load();
          if (d.status === "completed") toast.success("زمان‌بندی با موفقیت تولید شد");
          if (d.status === "failed") toast.error("اجرای الگوریتم با خطا مواجه شد");
        }
      }
    }, 2000);
  };

  const openDetail = async (task) => {
    const res = await schedulingService.getStatus(task.id);
    if (res.success) {
      setSelectedTask({ ...task, ...res.data });
      if (task.status === "processing") startPolling(task.id);
    }
  };

  const handleApprove = async () => {
    const res = await schedulingService.approve(selectedTask.id);
    if (res.success) {
      toast.success(res.message);
      openDetail(selectedTask);
      load();
    } else {
      toast.error(res.message);
    }
  };

  const handleReject = async () => {
    const res = await schedulingService.reject(selectedTask.id, rejectNote);
    if (res.success) {
      toast.success(res.message);
      setShowReject(false);
      setRejectNote("");
      openDetail(selectedTask);
      load();
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await schedulingService.delete(deleteTarget.id);
    if (res.success) {
      toast.success(res.message);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (selectedTask?.id === deleteTarget.id) setSelectedTask(null);
    } else {
      toast.error(res.message);
    }
    setDeleteTarget(null);
  };

  const handleExport = async (format) => {
    const res = await schedulingService.exportFile(selectedTask.id, format);
    if (!res.success) toast.error(res.message);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-secondary text-text_primary_color">زمان‌بندی خودکار دروس (هوش مصنوعی)</h2>
        <Button type="button" onClick={openCreate} className="bg-secondary text-white px-4 py-2 w-auto h-auto flex items-center gap-1">
          <Plus size={16} />
          اجرای جدید
        </Button>
      </div>

      <p className="text-sm text-text_secondary_color mb-4">
        الگوریتم هیبرید BBO + گرگ خاکستری، با توجه به اساتید، دروس، مکان‌ها و گروه‌های دانشجویی ثبت‌شده
        در نیمسال فعال، بهترین زمان‌بندی ممکن را پیدا می‌کند. نتیجه را می‌توانید بررسی، تأیید یا رد کنید.
      </p>

      {loading ? (
        <div className="text-center py-10 text-text_secondary_color">در حال بارگذاری...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 text-text_secondary_color bg-white rounded-lg border border-line_color">
          هنوز هیچ زمان‌بندی‌ای اجرا نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => openDetail(task)}
              className="bg-white rounded-lg border border-line_color p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-secondary text-text_primary_color">{task.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${STATUS_COLOR[task.status]}`}>
                  {STATUS_LABEL[task.status] || task.status_display}
                </span>
              </div>
              <p className="text-xs text-text_secondary_color mb-3">{task.description || "بدون توضیحات"}</p>
              <div className="flex items-center justify-between">
                {task.status === "pending" || task.status === "failed" ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRun(task); }}
                    className="flex items-center gap-1 text-xs text-secondary hover:underline"
                  >
                    <Play size={13} /> اجرا
                  </button>
                ) : <span />}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                  className="text-error hover:bg-error/10 rounded-md p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* فرم ایجاد وظیفه جدید */}
      <AnimatedModal isVisible={showForm} onClose={() => setShowForm(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">اجرای جدید الگوریتم زمان‌بندی</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <InputField id="name" label="نام این اجرا" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full sm:col-span-2" />
          <InputField id="description" label="توضیحات (اختیاری)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full sm:col-span-2" />
          <InputField id="popsize" label="اندازه جمعیت الگوریتم" type="number" value={form.popsize} onChange={(e) => setForm({ ...form, popsize: e.target.value })} className="w-full" />
          <InputField id="maxgen" label="تعداد نسل‌ها" type="number" value={form.maxgen} onChange={(e) => setForm({ ...form, maxgen: e.target.value })} className="w-full" />
          <InputField id="teacher_conflict_cost" label="جریمه تداخل استاد" type="number" value={form.teacher_conflict_cost} onChange={(e) => setForm({ ...form, teacher_conflict_cost: e.target.value })} className="w-full" />
          <InputField id="place_conflict_cost" label="جریمه تداخل مکان" type="number" value={form.place_conflict_cost} onChange={(e) => setForm({ ...form, place_conflict_cost: e.target.value })} className="w-full" />
          <InputField id="capacity_cost" label="جریمه کمبود ظرفیت" type="number" value={form.capacity_cost} onChange={(e) => setForm({ ...form, capacity_cost: e.target.value })} className="w-full" />
          <InputField id="gender_mismatch_cost" label="جریمه عدم تطابق جنسیت" type="number" value={form.gender_mismatch_cost} onChange={(e) => setForm({ ...form, gender_mismatch_cost: e.target.value })} className="w-full" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleCreate} disabled={saving} className="bg-secondary text-white px-4 py-2 w-auto h-auto">
            {saving ? "در حال ذخیره..." : "ایجاد"}
          </Button>
        </div>
      </AnimatedModal>

      {/* جزئیات و نتیجه‌ی یک اجرا */}
      <AnimatedModal isVisible={!!selectedTask} onClose={() => { clearInterval(pollRef.current); setSelectedTask(null); }}>
        {selectedTask && (
          <div className="max-h-[75vh] overflow-y-auto p-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-secondary text-lg text-text_primary_color">{selectedTask.name}</h3>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${STATUS_COLOR[selectedTask.status]}`}>
                  {STATUS_LABEL[selectedTask.status]}
                </span>
              </div>
            </div>

            {selectedTask.status === "processing" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary mx-auto mb-3" />
                <p className="text-text_secondary_color text-sm">الگوریتم در حال یافتن بهترین زمان‌بندی است...</p>
              </div>
            )}

            {selectedTask.status === "failed" && (
              <div className="bg-error/10 text-error rounded-lg p-4 text-sm">
                اجرای الگوریتم با خطا مواجه شد: {selectedTask.result?.error || "خطای نامشخص"}
              </div>
            )}

            {selectedTask.status === "completed" && selectedTask.schedule_data && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <StatBox label="هزینه کل" value={selectedTask.total_cost} />
                  <StatBox label="تداخل استاد" value={selectedTask.teacher_conflicts} warn />
                  <StatBox label="تداخل مکان" value={selectedTask.place_conflicts} warn />
                  <StatBox label="مشکل ظرفیت" value={selectedTask.capacity_issues} warn />
                </div>

                {selectedTask.approval_status && (
                  <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
                    selectedTask.approval_status === "approved" ? "bg-success/10 text-success" :
                    selectedTask.approval_status === "rejected" ? "bg-error/10 text-error" :
                    "bg-warning/10 text-warning"
                  }`}>
                    وضعیت تأیید:{" "}
                    {selectedTask.approval_status === "approved" ? "تأیید و نهایی شده" :
                     selectedTask.approval_status === "rejected" ? "رد شده (نیاز به بازنگری)" :
                     "در انتظار بررسی"}
                    {selectedTask.rejection_note && (
                      <p className="mt-1 text-xs">یادداشت: {selectedTask.rejection_note}</p>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-line_color mb-4">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-title_header">
                      <tr>
                        <th className="px-3 py-2">روز</th>
                        <th className="px-3 py-2">ساعت</th>
                        <th className="px-3 py-2">درس</th>
                        <th className="px-3 py-2">استاد</th>
                        <th className="px-3 py-2">مکان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedTask.schedule_data.courses]
                        .sort((a, b) => String(a.day).localeCompare(String(b.day)) || a.slot_id - b.slot_id)
                        .map((c, idx) => (
                          <tr key={idx} className="border-t border-line_color">
                            <td className="px-3 py-2">{c.day}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{c.start}-{c.end}</td>
                            <td className="px-3 py-2">{c.course_name || c.course_code}</td>
                            <td className="px-3 py-2">{c.teacher_code}</td>
                            <td className="px-3 py-2">{c.place_code}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => handleExport("pdf")} className="bg-gray-100 text-text_primary_color px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm">
                    <Download size={14} /> دانلود PDF
                  </Button>
                  <Button type="button" onClick={() => handleExport("excel")} className="bg-gray-100 text-text_primary_color px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm">
                    <Download size={14} /> دانلود اکسل
                  </Button>
                  {selectedTask.approval_status !== "approved" && (
                    <Button type="button" onClick={handleApprove} className="bg-success text-white px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm">
                      <CheckCircle2 size={14} /> تأیید و نهایی‌سازی
                    </Button>
                  )}
                  {selectedTask.approval_status !== "rejected" && (
                    <Button type="button" onClick={() => setShowReject(true)} className="bg-error text-white px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm">
                      <XCircle size={14} /> رد و بازنگری
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* رد کردن با یادداشت */}
      <AnimatedModal isVisible={showReject} onClose={() => setShowReject(false)}>
        <h3 className="font-secondary text-lg text-text_primary_color mb-4">دلیل رد کردن این زمان‌بندی</h3>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={4}
          className="w-full border border-line_color rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
          placeholder="مثلاً: ساعت کلاس استاد فلانی مناسب نیست..."
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" onClick={() => setShowReject(false)} className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto">انصراف</Button>
          <Button type="button" onClick={handleReject} className="bg-error text-white px-4 py-2 w-auto h-auto">ثبت و رد کردن</Button>
        </div>
      </AnimatedModal>

      <ConfirmDialog
        isVisible={!!deleteTarget}
        title="حذف اجرای زمان‌بندی"
        message={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatBox({ label, value, warn }) {
  const hasIssue = warn && value > 0;
  return (
    <div className={`rounded-lg p-3 text-center ${hasIssue ? "bg-error/10" : "bg-gray-50"}`}>
      <p className="text-xs text-text_secondary_color">{label}</p>
      <p className={`text-xl font-secondary ${hasIssue ? "text-error" : "text-text_primary_color"}`}>{value ?? "—"}</p>
    </div>
  );
}
