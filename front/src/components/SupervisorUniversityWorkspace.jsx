// src/components/SupervisorUniversityWorkspace.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import authService from "../services/auth";
import toast from "../utils/toast";
import SemestersManage from "./SemestersManage";
import TeachersManage from "./TeachersManage";
import CoursesManage from "./CoursesManage";
import PlacesManage from "./PlacesManage";
import StudentGroupsManage from "./StudentGroupsManage";
import SchedulingRun from "./SchedulingRun";
import ReportsView from "./ReportsView";
import UsersManage from "./UsersManage";

const TABS = [
  { id: "semesters", label: "نیمسال‌ها" },
  { id: "teachers", label: "اساتید" },
  { id: "courses", label: "دروس" },
  { id: "places", label: "مکان‌ها" },
  { id: "groups", label: "گروه‌های دانشجویی" },
  { id: "scheduling", label: "زمان‌بندی هوشمند" },
  { id: "reports", label: "گزارشات" },
  { id: "users", label: "کاربران" },
];

/**
 * فضای کاری سوپروایزر برای مدیریت کامل یک دانشگاه خاص (پس از انتخاب از لیست
 * دانشگاه‌ها). چون سوپروایزر نقش «university» ثابتی ندارد، انتخاب نیمسال
 * فعال این دانشگاه به‌صورت موقت در localStorage (همان کلید مشترک با پنل
 * مدیر) نگه داشته می‌شود و هنگام خروج از این صفحه پاک می‌شود.
 */
export default function SupervisorUniversityWorkspace() {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("semesters");
  const [activeSemesterId, setActiveSemesterId] = useState(null);

  useEffect(() => {
    const user = authService.getUser();
    if (!user || !authService.isSupervisor()) {
      navigate("/login");
      return;
    }

    // موقع ورود به فضای کاری یک دانشگاه، نیمسال فعال قبلی (در صورت وجود) پاک می‌شود
    authService.setActiveUniversityConfigId(null);
    setActiveSemesterId(null);

    loadUniversity();

    // موقع خروج از این صفحه، نیمسال فعال پاک شود تا با بخش‌های دیگر تداخل نکند
    return () => {
      authService.setActiveUniversityConfigId(null);
    };
  }, [universityId]);

  const loadUniversity = async () => {
    setLoading(true);
    const res = await authService.getUniversities();
    if (res.success) {
      const found = (res.universities || []).find((u) => String(u.id) === String(universityId));
      if (found) {
        setUniversity(found);
      } else {
        toast.error("دانشگاه یافت نشد");
        navigate("/supervisor-dashboard");
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!university) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/supervisor-dashboard")}
            className="flex items-center gap-1 text-blue-100 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowRight size={16} />
            بازگشت به لیست دانشگاه‌ها
          </button>
          <h1 className="text-3xl font-bold">{university.name}</h1>
          <p className="text-blue-100 mt-1" dir="ltr">{university.subdomain}.example.com</p>
          {!activeSemesterId && (
            <p className="mt-2 inline-block bg-yellow-400/90 text-yellow-900 text-xs px-3 py-1 rounded-full">
              ابتدا از تب «نیمسال‌ها» یک نیمسال انتخاب یا ایجاد کنید
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border-b shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 sm:gap-8 whitespace-nowrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "semesters" && (
          <SemestersManage
            universityId={university.id}
            onActiveChanged={(id) => setActiveSemesterId(id)}
          />
        )}
        {activeTab === "teachers" && <TeachersManage />}
        {activeTab === "courses" && <CoursesManage />}
        {activeTab === "places" && <PlacesManage />}
        {activeTab === "groups" && <StudentGroupsManage />}
        {activeTab === "scheduling" && <SchedulingRun />}
        {activeTab === "reports" && <ReportsView />}
        {activeTab === "users" && (
          <UsersManage isSupervisorView={true} fixedUniversityId={university.id} />
        )}
      </div>
    </div>
  );
}
