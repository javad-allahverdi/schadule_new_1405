// src/components/ReportsView.jsx
import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import teacherService from "../services/teacherService";
import courseService from "../services/courseService";
import placeService from "../services/placeService";
import schedulingService from "../services/schedulingService";
import toast from "../utils/toast";

export default function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [places, setPlaces] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [tRes, cRes, pRes, sRes] = await Promise.all([
      teacherService.getAll(),
      courseService.getAll(),
      placeService.getAll(),
      schedulingService.getAll(),
    ]);
    if (tRes.success) setTeachers(tRes.data);
    if (cRes.success) setCourses(cRes.data);
    if (pRes.success) setPlaces(pRes.data);
    if (sRes.success) setTasks(sRes.data);
    setLoading(false);
  };

  // بار آموزشی هر استاد: مجموع واحدهای دروسی که آن استاد جزو اساتید مجازش است
  const teacherWorkload = teachers.map((t) => {
    const assignedCourses = courses.filter((c) => (c.teachers || []).includes(t.id));
    const totalUnits = assignedCourses.reduce((sum, c) => sum + (c.units || 0), 0);
    const ratio = t.max_units ? Math.min(100, Math.round((totalUnits / t.max_units) * 100)) : 0;
    return { ...t, assignedCourses: assignedCourses.length, totalUnits, ratio };
  });

  // میزان استفاده از هر نوع مکان
  const placeTypeUsage = places.reduce((acc, p) => {
    acc[p.place_type] = (acc[p.place_type] || 0) + 1;
    return acc;
  }, {});

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const approvedCount = tasks.filter((t) => t.status === "completed").length; // نمای کلی؛ وضعیت تأیید دقیق در جزئیات هر وظیفه است

  const handleExport = async (taskId, format) => {
    const res = await schedulingService.exportFile(taskId, format);
    if (!res.success) toast.error(res.message);
  };

  if (loading) {
    return <div className="text-center py-10 text-text_secondary_color">در حال بارگذاری گزارشات...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-secondary text-text_primary_color mb-1 flex items-center gap-2">
          <FileBarChart size={20} /> گزارشات
        </h2>
        <p className="text-sm text-text_secondary_color">
          نمای کلی از وضعیت بار آموزشی اساتید، استفاده از مکان‌ها و تاریخچه‌ی زمان‌بندی‌ها.
        </p>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="تعداد اساتید" value={teachers.length} />
        <SummaryCard label="تعداد دروس" value={courses.length} />
        <SummaryCard label="تعداد مکان‌ها" value={places.length} />
        <SummaryCard label="زمان‌بندی‌های تکمیل‌شده" value={completedTasks.length} />
      </div>

      {/* بار آموزشی اساتید */}
      <div>
        <h3 className="font-secondary text-text_primary_color mb-3">بار آموزشی اساتید</h3>
        {teacherWorkload.length === 0 ? (
          <p className="text-sm text-text_secondary_color">هنوز استادی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line_color bg-white">
            <table className="w-full text-sm text-right">
              <thead className="bg-title_header">
                <tr>
                  <th className="px-4 py-2">استاد</th>
                  <th className="px-4 py-2">تعداد دروس</th>
                  <th className="px-4 py-2">واحد تدریس</th>
                  <th className="px-4 py-2">سقف واحد</th>
                  <th className="px-4 py-2">درصد اشغال</th>
                </tr>
              </thead>
              <tbody>
                {teacherWorkload.map((t) => (
                  <tr key={t.id} className="border-t border-line_color">
                    <td className="px-4 py-2">{t.full_name}</td>
                    <td className="px-4 py-2">{t.assignedCourses}</td>
                    <td className="px-4 py-2">{t.totalUnits}</td>
                    <td className="px-4 py-2">{t.max_units}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${t.ratio >= 90 ? "bg-error" : t.ratio >= 60 ? "bg-warning" : "bg-success"}`}
                            style={{ width: `${t.ratio}%` }}
                          />
                        </div>
                        <span className="text-xs text-text_secondary_color">{t.ratio}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* استفاده از انواع مکان */}
      <div>
        <h3 className="font-secondary text-text_primary_color mb-3">توزیع انواع مکان‌ها</h3>
        {Object.keys(placeTypeUsage).length === 0 ? (
          <p className="text-sm text-text_secondary_color">هنوز مکانی ثبت نشده است.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {Object.entries(placeTypeUsage).map(([type, count]) => (
              <div key={type} className="bg-white border border-line_color rounded-lg px-4 py-2 text-sm">
                <span className="text-text_primary_color">{type}</span>
                <span className="mr-2 text-secondary font-secondary">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* تاریخچه زمان‌بندی‌ها */}
      <div>
        <h3 className="font-secondary text-text_primary_color mb-3">تاریخچه اجرای زمان‌بندی</h3>
        {completedTasks.length === 0 ? (
          <p className="text-sm text-text_secondary_color">هنوز هیچ زمان‌بندی‌ای تکمیل نشده است.</p>
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-white border border-line_color rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text_primary_color">{task.name}</p>
                  <p className="text-xs text-text_secondary_color">
                    {task.result?.total_cost != null ? `هزینه: ${task.result.total_cost}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(task.id, "pdf")}
                    className="flex items-center gap-1 text-xs text-secondary hover:underline"
                  >
                    <Download size={13} /> PDF
                  </button>
                  <button
                    onClick={() => handleExport(task.id, "excel")}
                    className="flex items-center gap-1 text-xs text-secondary hover:underline"
                  >
                    <Download size={13} /> اکسل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-line_color p-4 text-center">
      <p className="text-2xl font-secondary text-text_primary_color">{value}</p>
      <p className="text-xs text-text_secondary_color mt-1">{label}</p>
    </div>
  );
}
