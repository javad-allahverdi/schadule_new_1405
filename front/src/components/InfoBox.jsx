export default function InfoBox({ icon, label, page }) {
  const handleClick = () => {
    window.location.href = page;
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col items-center bg-white rounded-2xl p-8 w-80 max-w-full cursor-pointer transition-all duration-300 ease-out shadow-md hover:shadow-xl hover:-translate-y-1.5 border border-gray-100 hover:border-blue-100/50"
    >
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-blue-50 group-hover:bg-blue-100/80 transition-colors duration-300">
        <img
          src={icon}
          alt={label}
          className="w-11 h-11 select-none pointer-events-none transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <span className="text-xl font-box text-center text-text_primary_color group-hover:text-secondary transition-colors duration-300 px-2 leading-tight">
        {label}
      </span>
    </div>
  );
}
