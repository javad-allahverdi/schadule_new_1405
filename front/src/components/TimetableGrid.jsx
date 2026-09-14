// src/components/TimetableGrid.jsx
//
// جدول هفتگی (روز × بازه‌ی زمانی) برای نمایش یک زمان‌بندی.
// هم برای «پاسخ مرجع» استفاده می‌شود و هم برای خروجی الگوریتم، تا کاربر بتواند
// دو جدول را کنار هم و با یک قالب واحد ببیند.

/**
 * days:    ["شنبه", ...]
 * slots:   [{ id, start, end }]
 * entries: [{ course_code, course_name, day, slot_id, teacher_code, place_code }]
 * lookup:  { teachers: {code: name}, places: {code: name} }
 * highlight: تابع اختیاری (entry) => boolean برای برجسته‌سازی جلسات مورد نظر
 */
export default function TimetableGrid({
  days = [],
  slots = [],
  entries = [],
  lookup = {},
  highlight = null,
  compact = false,
}) {
  const cells = {};
  entries.forEach((entry) => {
    const key = `${entry.day}|${entry.slot_id}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(entry);
  });

  const teacherName = (code) => lookup.teachers?.[code] || code || '—';
  const placeName = (code) => lookup.places?.[code] || code || '—';

  return (
    <div className="overflow-x-auto rounded-lg border border-line_color bg-white">
      <table className="w-full text-right border-collapse" style={{ minWidth: 640 }}>
        <thead>
          <tr className="bg-title_header">
            <th className="px-2 py-2 text-xs font-secondary border-b border-line_color whitespace-nowrap">
              بازه
            </th>
            {days.map((day) => (
              <th
                key={day}
                className="px-2 py-2 text-xs font-secondary border-b border-r border-line_color whitespace-nowrap"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot.id} className="align-top">
              <td className="px-2 py-2 text-[11px] text-text_secondary_color whitespace-nowrap border-b border-line_color bg-gray-50">
                {slot.start}
                <br />
                {slot.end}
              </td>
              {days.map((day) => {
                const items = cells[`${day}|${slot.id}`] || [];
                return (
                  <td
                    key={`${day}-${slot.id}`}
                    className="px-1 py-1 border-b border-r border-line_color"
                  >
                    {items.length === 0 ? (
                      <span className="text-[11px] text-gray-300">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {items.map((entry, idx) => {
                          const isHighlighted = highlight ? highlight(entry) : false;
                          return (
                            <div
                              key={`${entry.course_code}-${idx}`}
                              className={`rounded px-1.5 py-1 text-[11px] leading-tight border ${
                                isHighlighted
                                  ? 'bg-warning/15 border-warning/50'
                                  : 'bg-secondary/5 border-secondary/20'
                              }`}
                              title={`${entry.course_name || entry.course_code} — ${teacherName(
                                entry.teacher_code
                              )} — ${placeName(entry.place_code)}`}
                            >
                              <div className="font-secondary text-text_primary_color truncate">
                                {entry.course_name || entry.course_code}
                              </div>
                              {!compact && (
                                <div className="text-text_secondary_color truncate">
                                  {teacherName(entry.teacher_code)}
                                </div>
                              )}
                              <div className="text-text_secondary_color truncate">
                                {placeName(entry.place_code)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
