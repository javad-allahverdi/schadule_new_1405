// src/components/common/DataTable.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * جدول عمومی برای لیست/ویرایش/حذف رکوردها.
 *
 * columns: [{ key, label, render?(row) }]
 * rows: آرایه‌ی داده
 * onEdit(row) / onDelete(row): اختیاری
 * extraActions(row): برای دکمه‌های اضافی مثل «ایجاد حساب کاربری»
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  onEdit,
  onDelete,
  extraActions,
  searchable = true,
  searchPlaceholder = "جستجو...",
  emptyMessage = "موردی یافت نشد",
}) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const value = col.render ? undefined : row[col.key];
        return value != null && String(value).toLowerCase().includes(q);
      }) || Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      )
    );
  }, [rows, query, columns, searchable]);

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4 flex justify-end">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72 h-11 px-4 border border-line_color rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-secondary
                       text-right text-[14px] font-primary bg-white"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-line_color bg-white shadow-sm">
        <table className="w-full text-right text-[14px] font-primary">
          <thead>
            <tr className="bg-title_header text-text_primary_color">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-secondary whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || extraActions) && (
                <th className="px-4 py-3 font-secondary text-center">عملیات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-text_secondary_color">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary" />
                    در حال بارگذاری...
                  </div>
                </td>
              </tr>
            )}

            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-text_secondary_color">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              filteredRows.map((row, idx) => (
                <motion.tr
                  key={row.id ?? idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="border-t border-line_color hover:bg-bg transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-text_primary_color whitespace-nowrap">
                      {col.render ? col.render(row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  {(onEdit || onDelete || extraActions) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {extraActions && extraActions(row)}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                          >
                            ویرایش
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="px-2 py-1 text-xs rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {searchable && rows.length > 0 && (
        <p className="mt-2 text-xs text-text_secondary_color text-left">
          {filteredRows.length} از {rows.length} مورد
        </p>
      )}
    </div>
  );
}
