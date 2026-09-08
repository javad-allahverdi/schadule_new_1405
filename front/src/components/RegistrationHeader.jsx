import Button from "./Button";

export default function RegistrationHeader({
  title,
  description,
  onSelectManual,
  onSelectFile,
  selectedMethod,
}) {
  return (
    <div className="mt-36">
      <div className="bg-primary rounded-lg px-6 py-10 w-[calc(100%-32px)] sm:w-full sm:max-w-[610px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1200px]  mx-auto">
        <h2 className="relative font-secondary text-text_primary_color text-2xl  pr-[10px] border-r-4 border-secondary">
          {title}
        </h2>
        <p className="font-primary text-text_primary_color mt-12 pr-5">
          لطفا یکی از روش های زیر را برای ثبت اطلاعات {description} انتخاب کنید
        </p>
      </div>

      <div className="mt-14 w-[calc(100%-32px)] sm:w-full sm:max-w-[610px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1200px] mx-auto flex gap-4 pr-6">
        <Button
          onClick={onSelectManual}
          className={`bg-bg text-disable rounded-none hover:bg-gray-300 transition-all h-[37px] duration-300 relative
            after:content-[''] after:absolute after:bottom-0 after:left-0 text-[13px] mobile:text-[16px]
            after:h-[2px] after:w-full after:bg-secondary after:origin-center after:scale-x-0 after:transition-transform after:duration-300
            ${
              selectedMethod === "manual"
                ? "after:scale-x-100 text-text_primary_color"
                : ""
            }`}
        >
          بارگزاری به صورت دستی
        </Button>

        <Button
          onClick={onSelectFile}
          className={`bg-bg text-disable rounded-none hover:bg-gray-300 h-[37px] transition-all duration-300
            relative text-[13px] mobile:text-[16px]
            after:content-[''] after:absolute after:bottom-0 after:left-0
            after:h-[2px] after:w-full after:bg-secondary after:origin-center after:scale-x-0 after:transition-transform after:duration-300
            ${
              selectedMethod === "file"
                ? "after:scale-x-100 text-text_primary_color"
                : ""
            }`}
        >
          بارگزاری به صورت فایل
        </Button>
      </div>
    </div>
  );
}
