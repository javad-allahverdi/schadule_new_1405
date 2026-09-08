import reportIcon from "../assets/svg/reports.svg";

export default function ReportBox({ label, page }) {
  const handleClick = () => {
    window.location.href = page;
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col items-center bg-white rounded-xl p-5 cursor-pointer transition-all duration-300 border border-gray-200 hover:border-blue-400 hover:-translate-y-1.5 w-52 hover:shadow-md"
    >
      {/* فلش در گوشه سمت راست بالا */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-1">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>

      <div className="w-16 h-16 rounded-full border-secondary/70 border-2 flex justify-center items-center mb-4 group-hover:border-secondary group-hover:bg-blue-50 transition-all duration-300">
        <img
          src={reportIcon}
          alt={label}
          className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      <span className="text-base font-box text-text_primary_color text-center group-hover:text-secondary transition-colors duration-300">
        {label}
      </span>
    </div>
  );
}
