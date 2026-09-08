import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import InputField from "./InputField";
import SearchSelect from "./SearchSelect"; // کامپوننت جدید برای سرچ

export default function DynamicList({
  items = [],
  onAdd,
  onRemove,
  title,
  addButtonText = "اضافه کردن",
  fields = [], // فیلدهای فرم
  searchConfig = null, // کانفیگ برای فیلدهای جستجو
}) {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({});

  const handleAdd = () => {
    // اعتبارسنجی بر اساس نوع فیلدها
    const isValid = fields.every(field => {
      if (field.required === false) return true;
      return newItem[field.id] && newItem[field.id].toString().trim() !== '';
    });

    if (!isValid) {
      alert('لطفاً همه فیلدها را پر کنید');
      return;
    }

    onAdd(newItem);
    setNewItem({});
    setShowForm(false);
  };

  // رندر کردن فیلد بر اساس نوع
  const renderField = (field) => {
    // اگر فیلد از نوع جستجو باشه
    if (field.type === 'search') {
      return (
        <SearchSelect
          key={field.id}
          label={field.label}
          value={newItem[field.id]}
          onChange={(value) => setNewItem({ ...newItem, [field.id]: value })}
          options={field.options}
          displayField={field.displayField}
          valueField={field.valueField}
          placeholder={field.placeholder}
        />
      );
    }

    // فیلد معمولی
    return (
      <InputField
        key={field.id}
        id={field.id}
        label={field.label}
        type={field.type || "text"}
        value={newItem[field.id] || ""}
        onChange={(e) => setNewItem({
          ...newItem,
          [field.id]: e.target.value
        })}
        options={field.options}
        placeholder={field.placeholder}
      />
    );
  };

  // رندر کردن مقدار آیتم در لیست
  const renderItemValue = (item, field) => {
    if (field.type === 'search' && item[field.id]) {
      // اگه از نوع سرچ بود، مقدار نمایشی رو برمیگردونیم
      const selectedOption = field.options?.find(opt => 
        opt[field.valueField || 'id'] === item[field.id]
      );
      return selectedOption ? selectedOption[field.displayField || 'name'] : item[field.id];
    }
    return item[field.id];
  };

  return (
    <div className="border border-line_color rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-secondary text-text_primary_color">{title}</h3>
        <Button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-3 py-1 text-sm"
        >
          {showForm ? 'انصراف' : addButtonText}
        </Button>
      </div>

      {/* فرم اضافه کردن */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-white rounded-lg border border-line_color"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(renderField)}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2"
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                className="bg-green-600 text-white px-4 py-2"
              >
                افزودن
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* لیست آیتم‌ها */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 bg-white rounded-lg border border-line_color hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              {fields.map((field, i) => {
                const value = renderItemValue(item, field);
                if (!value) return null;
                
                return (
                  <span key={field.id} className="ml-4 text-sm">
                    {i > 0 && ' - '}
                    {field.prefix && <span className="text-gray-500">{field.prefix}</span>}
                    <span className="font-medium">{value}</span>
                    {field.suffix && <span className="text-gray-500">{field.suffix}</span>}
                  </span>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 ml-2 p-1 hover:bg-red-50 rounded-full transition-colors"
              title="حذف"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {items.length === 0 && (
          <p className="text-gray-500 text-center py-4 bg-white rounded-lg border border-dashed">
            {searchConfig ? 'موردی انتخاب نشده است' : 'موردی اضافه نشده است'}
          </p>
        )}
      </div>
    </div>
  );
}