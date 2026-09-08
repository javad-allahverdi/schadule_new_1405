import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchSelect({
  label,
  value,
  onChange,
  options = [],
  displayField = "name",
  valueField = "id",
  placeholder = "جستجو...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // فیلتر کردن بر اساس جستجو
    const filtered = options.filter(opt => 
      opt[displayField].toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options, displayField]);

  useEffect(() => {
    // بستن منو با کلیک بیرون
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // پیدا کردن گزینه انتخاب شده
  const selectedOption = options.find(opt => opt[valueField] === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block font-primary text-text_primary_color mb-1">
        {label}
      </label>
      
      {/* باکس انتخاب */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border border-line_color rounded-lg cursor-pointer bg-white hover:border-blue-500 transition-colors"
      >
        {selectedOption ? (
          <span>{selectedOption[displayField]}</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      {/* منوی جستجو */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-line_color rounded-lg shadow-lg"
          >
            {/* باکس جستجو */}
            <div className="p-2 border-b border-line_color">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو..."
                className="w-full p-2 border border-line_color rounded-lg focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* لیست گزینه‌ها */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt[valueField]}
                    onClick={() => {
                      onChange(opt[valueField]);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`p-2 cursor-pointer hover:bg-blue-50 transition-colors
                      ${value === opt[valueField] ? 'bg-blue-100' : ''}`}
                  >
                    {opt[displayField]}
                    {opt.code && (
                      <span className="text-gray-500 text-sm mr-2">
                        ({opt.code})
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-gray-500">
                  موردی یافت نشد
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}