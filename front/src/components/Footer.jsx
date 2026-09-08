import logo from "../assets/images/logo.png";

export default function Footer() {
  return (
    <footer className="relative w-full h-80 mt-36">
      {/* پس‌زمینه */}
      <div className="absolute inset-0 bg-cover bg-center bg-[url('/src/assets/images/footer.jpg')]" />

      {/* کاور شیشه‌ای */}
      <div className="absolute inset-0 bg-hero/75 backdrop-blur-[2px]" />

      {/* محتوای فوتر */}
      <div className="relative h-full flex items-center justify-center text-white px-4 gap-8">
        <img
          src={logo}
          alt="Company Logo"
          className="w-20 h-20 mb-4 rounded-lg"
        />
        <h2 className="text-2xl font-secondary">
          شرکت هوشمند فناوران برتر ایرانیان
        </h2>
      </div>
    </footer>
  );
}
