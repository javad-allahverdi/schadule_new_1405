// src/components/ScheduleComparison.jsx
//
// گزارش مقایسه‌ی خروجی الگوریتم با «پاسخ مرجع» یک مجموعه‌ی داده‌ی آزمون.
//
// گزارش عمداً دو بخش مستقل دارد:
//   ۱) کیفیت  — تعداد تخلف‌ها و هزینه‌ی خروجی در برابر پاسخ مرجع. داوری نهایی
//      بر همین اساس است، چون مسئله‌ی زمان‌بندی چند جواب بهینه دارد و پاسخ مرجع
//      فقط «یکی» از آن‌هاست.
//   ۲) شباهت — چند درصد از جلسات دقیقاً مثل پاسخ مرجع چیده شده‌اند. این عدد
//      حتی برای یک جواب کاملاً بهینه هم می‌تواند پایین باشد و به‌تنهایی معیار
//      درستی نیست؛ برای همین جدا و با توضیح نمایش داده می‌شود.
import { Fragment, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import TimetableGrid from './TimetableGrid';

const TONE = {
  success: {
    box: 'bg-success/10 border-success/30 text-success',
    Icon: CheckCircle2,
  },
  warning: {
    box: 'bg-warning/10 border-warning/30 text-warning',
    Icon: AlertTriangle,
  },
  error: {
    box: 'bg-error/10 border-error/30 text-error',
    Icon: XCircle,
  },
};

const VIEW_TABS = [
  { id: 'summary', label: 'خلاصه و داوری' },
  { id: 'structure', label: 'توزیع بار' },
  { id: 'timetables', label: 'دو جدول کنار هم' },
  { id: 'courses', label: 'جزئیات درس‌به‌درس' },
];

export default function ScheduleComparison({ comparison }) {
  const [tab, setTab] = useState('summary');

  if (!comparison) return null;

  const { verdict, target, produced, agreement, structure, courses, lookup, settings, entries, task } =
    comparison;
  const tone = TONE[verdict.tone] || TONE.warning;
  const { Icon } = tone;

  return (
    <div>
      {/* داوری نهایی */}
      <div className={`rounded-lg border p-4 mb-4 ${tone.box}`}>
        <div className="flex items-start gap-2">
          <Icon size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-secondary">{verdict.title}</p>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{verdict.detail}</p>
          </div>
        </div>
      </div>

      {/* اعداد کلیدی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <CompareBox
          label="تخلف‌ها"
          produced={produced.total_violations}
          target={target.total_violations}
          lowerIsBetter
        />
        <CompareBox
          label="هزینه"
          produced={produced.cost}
          target={target.cost}
          lowerIsBetter
        />
        <StatBox label="جلسات تولیدشده" value={`${produced.sessions} از ${target.sessions}`} />
        <StatBox
          label="زمان اجرا"
          value={task?.execution_time ? `${task.execution_time.toFixed(2)} ثانیه` : '—'}
          hint={task?.generations_run ? `${task.generations_run} نسل` : null}
        />
      </div>

      {target.time_preferences?.total > 0 && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-text_secondary_color mb-4">
          ترجیح‌های زمانی اساتید — پاسخ مرجع:{' '}
          <strong className="text-text_primary_color">
            {target.time_preferences.satisfied} از {target.time_preferences.total}
          </strong>{' '}
          | خروجی الگوریتم:{' '}
          <strong className="text-text_primary_color">
            {produced.time_preferences.satisfied} از {produced.time_preferences.total}
          </strong>
        </div>
      )}

      {/* تب‌ها */}
      <div className="flex gap-1 flex-wrap border-b border-line_color mb-4">
        {VIEW_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm border-b-2 transition ${
              tab === t.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-text_secondary_color hover:text-text_primary_color'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <SummaryTab comparison={comparison} agreement={agreement} produced={produced} target={target} />
      )}

      {tab === 'structure' && <StructureTab structure={structure} />}

      {tab === 'timetables' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-secondary text-sm text-text_primary_color mb-2">
              پاسخ مرجع (بدون تخلف)
            </h4>
            <TimetableGrid
              days={settings?.days || []}
              slots={settings?.slots || []}
              entries={entries?.target || []}
              lookup={lookup}
              compact
            />
          </div>
          <div>
            <h4 className="font-secondary text-sm text-text_primary_color mb-2">
              خروجی الگوریتم
            </h4>
            <TimetableGrid
              days={settings?.days || []}
              slots={settings?.slots || []}
              entries={entries?.produced || []}
              lookup={lookup}
              compact
            />
          </div>
        </div>
      )}

      {tab === 'courses' && <CoursesTab courses={courses} lookup={lookup} />}
    </div>
  );
}

function SummaryTab({ agreement, produced, target, comparison }) {
  const labels = comparison.violation_labels || {};
  const rows = Object.keys(labels).filter(
    (key) => (produced.violations?.[key] || 0) > 0 || (target.violations?.[key] || 0) > 0
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-1 mb-2">
          <h4 className="font-secondary text-sm text-text_primary_color">
            میزان انطباق با پاسخ مرجع
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PercentBar label="روز و بازه یکسان" value={agreement.time.percent} />
          <PercentBar label="استاد یکسان" value={agreement.teacher.percent} />
          <PercentBar label="مکان یکسان" value={agreement.place.percent} />
          <PercentBar label="انطباق کامل جلسه" value={agreement.exact.percent} />
        </div>
        <div className="flex items-start gap-1.5 mt-2 text-[11px] text-text_secondary_color leading-relaxed">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            این درصدها «شباهت به یک جواب بهینه‌ی مشخص» را می‌سنجند، نه درستی را. مسئله‌ی
            زمان‌بندی معمولاً هزاران جواب بهینه دارد؛ بنابراین خروجی الگوریتم می‌تواند کاملاً
            بی‌نقص باشد ولی انطباق پایینی با این جدول خاص داشته باشد. ملاک درستی، ستون
            «تخلف‌ها» در بالای صفحه است.
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-secondary text-sm text-text_primary_color mb-2">
          تفکیک تخلف‌ها
        </h4>
        {rows.length === 0 ? (
          <div className="bg-success/10 text-success rounded-lg px-3 py-3 text-sm">
            هیچ تخلفی در هیچ‌کدام از دو زمان‌بندی وجود ندارد — خروجی الگوریتم کاملاً معتبر است.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line_color">
            <table className="w-full text-xs text-right">
              <thead className="bg-title_header">
                <tr>
                  <th className="px-3 py-2 font-secondary">نوع تخلف</th>
                  <th className="px-3 py-2 font-secondary whitespace-nowrap">پاسخ مرجع</th>
                  <th className="px-3 py-2 font-secondary whitespace-nowrap">خروجی الگوریتم</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((key) => {
                  const p = produced.violations?.[key] || 0;
                  const t = target.violations?.[key] || 0;
                  return (
                    <tr key={key} className="border-t border-line_color">
                      <td className="px-3 py-2">{labels[key]}</td>
                      <td className="px-3 py-2">{t}</td>
                      <td className={`px-3 py-2 font-secondary ${p > t ? 'text-error' : 'text-success'}`}>
                        {p}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StructureTab({ structure }) {
  const blocks = [
    { key: 'by_day', title: 'تعداد جلسات در هر روز' },
    { key: 'by_slot', title: 'تعداد جلسات در هر بازه‌ی زمانی' },
    { key: 'by_teacher', title: 'بار تدریس هر استاد' },
    { key: 'by_place', title: 'میزان استفاده از هر مکان' },
  ];

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-text_secondary_color leading-relaxed">
        این نمودارها نشان می‌دهند بار کاری در خروجی الگوریتم چقدر شبیه پاسخ مرجع توزیع شده است —
        صرف‌نظر از این‌که کدام درس دقیقاً کجا رفته. دو جواب بهینه‌ی متفاوت معمولاً توزیع بار
        نزدیکی دارند، بنابراین این معیار از «انطباق سطر به سطر» گویاتر است.
      </p>

      {blocks.map(({ key, title }) => {
        const block = structure?.[key];
        if (!block) return null;
        const max = Math.max(1, ...block.target, ...block.produced);
        return (
          <div key={key}>
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="font-secondary text-sm text-text_primary_color">{title}</h4>
              <span className="text-xs text-text_secondary_color">
                شباهت توزیع: <strong>{block.similarity_percent}٪</strong>
              </span>
            </div>
            <div className="space-y-1.5">
              {block.keys.map((k, idx) => (
                <div key={String(k)} className="flex items-center gap-2">
                  <span className="text-[11px] text-text_secondary_color w-32 shrink-0 truncate text-left">
                    {block.labels?.[k] ?? k}
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <Bar value={block.target[idx]} max={max} className="bg-gray-400" />
                    <Bar value={block.produced[idx]} max={max} className="bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex gap-4 text-[11px] text-text_secondary_color">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-gray-400" /> پاسخ مرجع
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-secondary" /> خروجی الگوریتم
        </span>
      </div>
    </div>
  );
}

function Bar({ value, max, className }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 bg-gray-100 rounded-sm h-2 overflow-hidden">
        <div className={`h-full rounded-sm ${className}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-[10px] text-text_secondary_color w-5 text-center">{value}</span>
    </div>
  );
}

function CoursesTab({ courses, lookup }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-line_color">
      <table className="w-full text-xs text-right">
        <thead className="bg-title_header">
          <tr>
            <th className="px-3 py-2 font-secondary">درس</th>
            <th className="px-3 py-2 font-secondary whitespace-nowrap">جلسات</th>
            <th className="px-3 py-2 font-secondary whitespace-nowrap">روز و بازه</th>
            <th className="px-3 py-2 font-secondary whitespace-nowrap">استاد</th>
            <th className="px-3 py-2 font-secondary whitespace-nowrap">مکان</th>
            <th className="px-3 py-2 font-secondary whitespace-nowrap">انطباق کامل</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <Fragment key={course.course_code}>
              <tr
                onClick={() =>
                  setExpanded(expanded === course.course_code ? null : course.course_code)
                }
                className="border-t border-line_color cursor-pointer hover:bg-gray-50"
              >
                <td className="px-3 py-2">{course.course_name}</td>
                <td className="px-3 py-2">
                  {course.produced_sessions}
                  {course.produced_sessions !== course.target_sessions && (
                    <span className="text-error"> (مرجع: {course.target_sessions})</span>
                  )}
                </td>
                <td className="px-3 py-2">{course.time_percent}٪</td>
                <td className="px-3 py-2">{course.teacher_percent}٪</td>
                <td className="px-3 py-2">{course.place_percent}٪</td>
                <td className="px-3 py-2 font-secondary">{course.exact_percent}٪</td>
              </tr>
              {expanded === course.course_code && (
                <tr className="bg-gray-50">
                  <td colSpan={6} className="px-3 py-2">
                    <SessionRows rows={course.rows} lookup={lookup} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionRows({ rows, lookup }) {
  const describe = (side) => {
    if (!side) return <span className="text-error">—</span>;
    const teacher = lookup.teachers?.[side.teacher_code] || side.teacher_code || '—';
    const place = lookup.places?.[side.place_code] || side.place_code || '—';
    return (
      <span>
        {side.day} {side.start}-{side.end} | {teacher} | {place}
      </span>
    );
  };

  return (
    <table className="w-full text-[11px] text-right">
      <thead>
        <tr className="text-text_secondary_color">
          <th className="px-2 py-1 font-normal">#</th>
          <th className="px-2 py-1 font-normal">پاسخ مرجع</th>
          <th className="px-2 py-1 font-normal">خروجی الگوریتم</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-t border-line_color/60">
            <td className="px-2 py-1">{idx + 1}</td>
            <td className="px-2 py-1">{describe(row.target)}</td>
            <td
              className={`px-2 py-1 ${
                row.matched.exact ? 'text-success' : 'text-text_primary_color'
              }`}
            >
              {describe(row.produced)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatBox({ label, value, hint }) {
  return (
    <div className="rounded-lg p-3 text-center bg-gray-50">
      <p className="text-xs text-text_secondary_color">{label}</p>
      <p className="text-lg font-secondary text-text_primary_color">{value ?? '—'}</p>
      {hint && <p className="text-[10px] text-text_secondary_color">{hint}</p>}
    </div>
  );
}

function CompareBox({ label, produced, target, lowerIsBetter }) {
  const hasBoth = produced != null && target != null;
  const better = hasBoth && (lowerIsBetter ? produced <= target : produced >= target);
  return (
    <div className={`rounded-lg p-3 text-center ${hasBoth && !better ? 'bg-error/10' : 'bg-success/10'}`}>
      <p className="text-xs text-text_secondary_color">{label}</p>
      <p
        className={`text-lg font-secondary ${
          hasBoth && !better ? 'text-error' : 'text-success'
        }`}
      >
        {produced ?? '—'}
      </p>
      <p className="text-[10px] text-text_secondary_color">مرجع: {target ?? '—'}</p>
    </div>
  );
}

function PercentBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="rounded-lg p-3 bg-gray-50">
      <p className="text-[11px] text-text_secondary_color mb-1">{label}</p>
      <p className="text-lg font-secondary text-text_primary_color mb-1.5">{pct}٪</p>
      <div className="bg-gray-200 rounded-sm h-1.5 overflow-hidden">
        <div className="h-full bg-secondary rounded-sm" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
