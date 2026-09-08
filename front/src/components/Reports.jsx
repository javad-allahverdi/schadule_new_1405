import FadeInOnScroll from "./FadeInOnScroll";
import ReportBox from "./ReportBox";

const reportItems = [
  {
    label: "برنامه درسی نهایی",
    page: "/src/pages/Report_professor/professor.html",
  },
  {
    label: "گزارش اساتید",
    page: "/src/pages/Report_professor/Report_professor.html",
  },
  {
    label: "گزارش دروس",
    page: "/src/pages/Report_course/Report_course.html",
  },
  {
    label: "گزارش کلاس ها",
    page: "/src/pages/Report_class/Report_class.html",
  },
  {
    label: "گزارش گروه های دانشجویی",
    page: "/src/pages/Report_groups/Report_groups.html",
  },
];

export default function Reports() {
  return (
    <section className="flex flex-col items-center py-15 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2
          id="reports"
          className="text-3xl md:text-4xl font-secondary text-text_primary_color pb-2"
        >
          گزارشات
        </h2>

        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-12 h-1.5 bg-secondary  rounded-full"></div>
          <div className="absolute w-64 h-0.5 bg-secondary  rounded-full"></div>
        </div>

        <p className="text-lg font-primary text-gray-600 max-w-2xl mx-auto leading-relaxed">
          دسترسی سریع به تمامی گزارشات و آمارهای سیستم آموزشی
        </p>
      </div>

      {/* گرید گزارشات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
        {reportItems.map(({ label, page }, index) => (
          <FadeInOnScroll
            key={page}
            delay={index * 0.1}
            direction="up"
            duration={0.6}
          >
            <div className="flex justify-center">
              <ReportBox label={label} page={page} />
            </div>
          </FadeInOnScroll>
        ))}
      </div>

      {/* بخش پایینی دکوراتیو */}
      <div className="mt-20 text-center">
        <div className="flex justify-center items-center gap-1 text-sm">
          <svg
            width="21px"
            height="21px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <path
                d="M12 7.01001V7.00002M12 17L12 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#717171"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>{" "}
            </g>
          </svg>
          <span className="text-text_secondary_color font-primary">
            برای دسترسی به گزارشات روی هر آیتم کلیک کنید
          </span>
        </div>
      </div>
    </section>
  );
}
