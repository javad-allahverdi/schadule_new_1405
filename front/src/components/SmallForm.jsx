import { motion, AnimatePresence } from "framer-motion";
import InputField from "./InputField";
import Button from "./Button";

export default function SmallForm({
  title,
  fields = [],
  values,
  setValues,
  isOpen,
  onCancel,
  onSubmit,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay با تار و بلور */}
          <div
            className="absolute inset-0 bg-hero/30 backdrop-blur-[1px]"
            onClick={onCancel}
          ></div>

          {/* فرم با لایه شیشه‌ای و انیمیشن Scale + Fade */}
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit && onSubmit(values);
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-[calc(100%-32px)] sm:w-full mobile:max-w-[400px] sm:max-w-[450px] mx-auto rounded-xl bg-primary backdrop-blur-md border border-line_color shadow-lg z-10"
          >
            <h2 className="text-lg text-center bg-title_header rounded-tr-xl rounded-tl-xl font-secondary text-text_primary_color mb-8 py-6">
              {title}
            </h2>

            <div className="p-6">
              <div className="flex flex-col items-center gap-6 mb-4">
                {fields.map(
                  ({ id, label, type = "text", placeholder, options }) => (
                    <InputField
                      key={id}
                      id={id}
                      label={label}
                      type={type}
                      value={values[id] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [id]: e.target.value })
                      }
                      placeholder={placeholder}
                      options={options}
                    />
                  )
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-center items-center gap-2 mt-14">
                <Button
                  type="button"
                  className="bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary w-full sm:w-[200px]"
                  onClick={onCancel}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full sm:w-[200px]"
                >
                  ثبت
                </Button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
