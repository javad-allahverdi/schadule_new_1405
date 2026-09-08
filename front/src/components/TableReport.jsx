import { useState, useEffect } from "react";
import {
  Trash2,
  Edit,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import Button from "./Button";

export default function TableReport({
  title,
  subtitle = "مدیریت و مشاهده اطلاعات",
  columns,
  data,
  onDelete,
  onEdit,
  onView, // اضافه شده برای مشاهده جزئیات
  enableFilters = true,
  enableExport = true,
  enableSearch = true,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  actions = ["edit", "delete", "view"], // مشخص کردن عملیات‌های قابل انجام
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageOptions[0]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // فیلتر و مرتب‌سازی داده‌ها
  const processedData = data.filter((item) => {
    // فیلتر بر اساس جستجو
    const searchMatch =
      !enableSearch ||
      !searchTerm ||
      columns.some((col) => {
        if (col === "عملیات") return false;
        const value = item[col];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });

    // فیلتر بر اساس فیلترهای ستون‌ها
    const filterMatch =
      !enableFilters ||
      Object.keys(filters).length === 0 ||
      Object.keys(filters).every((key) => {
        if (!filters[key]) return true;
        const itemValue = item[key]?.toString().toLowerCase();
        const filterValue = filters[key].toLowerCase();
        return itemValue?.includes(filterValue);
      });

    return searchMatch && filterMatch;
  });

  // مرتب‌سازی داده‌ها
  const sortedData = [...processedData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue || '').toLowerCase();
    const bStr = String(bValue || '').toLowerCase();

    if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // محاسبه داده‌های صفحه فعلی
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // تغییر صفحه
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const goToPage = (page) =>
    page >= 1 && page <= totalPages && setCurrentPage(page);

  // مرتب‌سازی
  const handleSort = (key) => {
    if (key === "عملیات") return;
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  // مدیریت فیلترها
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
  };

  // بازگشت به صفحه اول هنگام تغییر جستجو یا فیلتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, itemsPerPage]);

  // دکمه‌های صفحه‌بندی
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`min-w-8 h-8 px-2 rounded-lg border font-Vazirmatn text-sm transition-all ${
            currentPage === i
              ? "bg-primary text-white border-primary shadow-sm"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  // آیکون مرتب‌سازی
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDown size={14} className="opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-primary" />
    ) : (
      <ChevronDown size={14} className="text-primary" />
    );
  };

  // خروجی گرفتن
  const handleExport = (format) => {
    console.log(`خروجی ${format} از داده‌ها:`, sortedData);
    // اینجا می‌توانید منطق خروجی PDF یا Excel را اضافه کنید
    alert(`خروجی ${format} با موفقیت گرفته شد`);
  };

  // تعیین ستون‌های قابل فیلتر (بدون ستون عملیات)
  const filterableColumns = columns.filter(col => col !== "عملیات");

  return (
    <div className="min-h-screen bg-gray-50 p-4 mt-36 sm:p-6 lg:p-8" dir="rtl">
      {/* هدر صفحه */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-Vazirmatn-bold text-gray-800">
                {title}
              </h1>
              <p className="text-gray-600 mt-1 font-Vazirmatn text-sm">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* دکمه فیلترها */}
              {enableFilters && filterableColumns.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter size={16} />
                  فیلترها
                  {Object.keys(filters).filter((key) => filters[key]).length >
                    0 && (
                    <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {
                        Object.keys(filters).filter((key) => filters[key])
                          .length
                      }
                    </span>
                  )}
                </Button>
              )}

              {/* دکمه‌های خروجی */}
              {enableExport && (
                <>
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => handleExport("PDF")}
                  >
                    <Download size={16} />
                    خروجی PDF
                  </Button>
                  <Button 
                    variant="success" 
                    className="flex items-center gap-2"
                    onClick={() => handleExport("Excel")}
                  >
                    <Download size={16} />
                    خروجی Excel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* نوار جستجو و اطلاعات */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 font-Vazirmatn">
              <span className="font-bold text-primary">
                {sortedData.length}
              </span>{" "}
              رکورد یافت شد
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-96">
              {enableSearch && (
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="جستجو در جدول..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full font-Vazirmatn pr-9 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              )}

              {/* انتخاب تعداد آیتم در صفحه */}
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="font-Vazirmatn px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} در صفحه
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* فیلترهای ستون‌ها */}
          {enableFilters && showFilters && filterableColumns.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-Vazirmatn-bold text-sm text-gray-700">
                  فیلترهای پیشرفته
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X size={14} />
                  پاک کردن همه
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filterableColumns.map((column) => (
                  <div key={column}>
                    <label className="block text-xs text-gray-600 mb-1 font-Vazirmatn">
                      {column}
                    </label>
                    <input
                      type="text"
                      value={filters[column] || ""}
                      onChange={(e) =>
                        handleFilterChange(column, e.target.value)
                      }
                      placeholder={`فیلتر ${column}`}
                      className="w-full font-Vazirmatn px-3 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* جدول */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 sm:px-6 py-3 text-right font-Vazirmatn-bold text-gray-700 text-sm cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{column}</span>
                      {column !== "عملیات" && (
                        <div className="flex flex-col">
                          {getSortIcon(column)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center text-gray-500">
                      <Search size={48} className="mb-4 opacity-50" />
                      <div className="text-lg font-Vazirmatn-bold mb-2">
                        {searchTerm || Object.values(filters).some(Boolean)
                          ? "نتیجه‌ای یافت نشد"
                          : "داده‌ای برای نمایش وجود ندارد"}
                      </div>
                      <div className="text-sm font-Vazirmatn">
                        {searchTerm || Object.values(filters).some(Boolean)
                          ? "لطفاً شرایط جستجو یا فیلترها را تغییر دهید"
                          : "هنوز هیچ داده‌ای ثبت نشده است"}
                      </div>
                      {(searchTerm || Object.values(filters).some(Boolean)) && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 text-primary hover:text-primary-dark text-sm font-Vazirmatn"
                        >
                          پاک کردن جستجو و فیلترها
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    {columns.map((column) => {
                      if (column === "عملیات") {
                        return (
                          <td
                            key={column}
                            className="px-4 sm:px-6 py-4 whitespace-nowrap"
                          >
                            <div className="flex justify-center gap-1">
                              {actions.includes("view") && onView && (
                                <button
                                  onClick={() => onView(row.id)}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                  title="مشاهده جزئیات"
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                              {actions.includes("edit") && onEdit && (
                                <button
                                  onClick={() => onEdit(row.id)}
                                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="ویرایش"
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              {actions.includes("delete") && onDelete && (
                                <button
                                  onClick={() => onDelete(row.id)}
                                  className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={column}
                          className="px-4 sm:px-6 py-4 text-gray-700 font-Vazirmatn text-sm text-right"
                        >
                          {row[column] !== undefined && row[column] !== null && row[column] !== "" ? (
                            row[column]
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* صفحه‌بندی */}
        {sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t border-gray-200 gap-4 bg-gray-50">
            <div className="text-sm text-gray-600 font-Vazirmatn">
              نمایش <span className="font-bold">{indexOfFirstItem + 1}</span> تا{" "}
              <span className="font-bold">
                {Math.min(indexOfLastItem, sortedData.length)}
              </span>{" "}
              از <span className="font-bold">{sortedData.length}</span> رکورد
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="صفحه قبل"
              >
                <ChevronRight size={16} />
              </button>

              {renderPageNumbers()}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                title="صفحه بعد"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}