import FadeInOnScroll from "./FadeInOnScroll";
import InfoBox from "./InfoBox";
import teacherIcon from "../assets/images/teacher-register.png";
import booksIcon from "../assets/images/books-register.png";
import classIcon from "../assets/images/class-register.png";
import groupIcon from "../assets/images/group-register.png";
import confirm from "../assets/images/confirm.png";

const infoItems = [
  {
    icon: teacherIcon,
    label: "ثبت اطلاعات اساتید",
    page: "/src/pages/Registration_professor/professor.html",
  },
  {
    icon: booksIcon,
    label: "ثبت اطلاعات دروس",
    page: "/src/pages/Registration_course/course.html",
  },
  {
    icon: classIcon,
    label: "ثبت اطلاعات کلاس‌ها",
    page: "/src/pages/Registration_class/class.html",
  },
  {
    icon: groupIcon,
    label: "ثبت اطلاعات گروه‌های دانشجویی",
    page: "/src/pages/Registration_groups/groups.html",
  },
  {
    icon: confirm,
    label: "عملیات برنامه ریزی",
    page: "/src/pages/Registration_groups/groups.html",
  },
];

export default function RegisterInfo() {
  return (
    <div id="form" className="flex flex-col items-center mt-24 mb-32 px-16">
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-secondary text-text_primary_color text-center">
          ثبت اطلاعات
        </h2>

        <div className="relative flex items-center justify-center pb-6 mt-3">
          <span className="block w-10 h-[6px] bg-secondary rounded-full"></span>
          <span className="absolute block w-72 h-[2px] bg-secondary rounded-full"></span>
        </div>

        <p className="text-text_secondary_color font-primary text-lg">
          مدیریت یکپارچه اطلاعات آموزشی
        </p>
      </div>

      <div id="form" className="flex flex-wrap justify-center gap-12">
        {infoItems.map(({ icon, label, page }, index) => (
          <FadeInOnScroll key={page} delay={index * 0.15}>
            <InfoBox icon={icon} label={label} page={page} />
          </FadeInOnScroll>
        ))}
      </div>
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
    </div>
  );
}
