// src/components/BenchmarkSeeds.jsx
//
// مرور، نمایش و بارگذاری «مجموعه‌های داده‌ی آزمون».
//
// هدف این صفحه در ارائه: کاربر یک مجموعه‌ی آماده را انتخاب می‌کند، داده‌های آن
// (اساتید، دروس، مکان‌ها، گروه‌ها و محدودیت‌ها) و «پاسخ مرجع» را می‌بیند، سپس آن
// را در برنامه بارگذاری می‌کند تا الگوریتم روی همان داده اجرا شود و در نهایت
// خروجی با پاسخ مرجع مقایسه گردد.
import { useEffect, useState } from 'react';
import { Database, Download, Eye, CheckCircle2 } from 'lucide-react';
import benchmarkService from '../services/benchmarkService';
import authService from '../services/auth';
import toast from '../utils/toast';
import AnimatedModal from './AnimatedModal';
import Button from './Button';
import TimetableGrid from './TimetableGrid';

const DIFFICULTY_STYLE = {
  easy: 'bg-success/10 text-success',
  medium: 'bg-secondary/10 text-secondary',
  hard: 'bg-warning/10 text-warning',
  very_hard: 'bg-error/10 text-error',
};

const GENDER_LABEL = { 0: 'مختلط', 1: 'مرد', 2: 'زن' };
const DEGREE_LABEL = { 1: 'کارشناسی', 2: 'کارشناسی ارشد', 3: 'دکتری' };
const EMPLOYMENT_LABEL = { 1: 'تمام وقت', 2: 'نیمه وقت', 3: 'حق‌التدریس' };

const DETAIL_TABS = [
  { id: 'teachers', label: 'اساتید' },
  { id: 'courses', label: 'دروس' },
  { id: 'places', label: 'مکان‌ها' },
  { id: 'groups', label: 'گروه‌های دانشجویی' },
  { id: 'constraints', label: 'محدودیت‌ها' },
  { id: 'target', label: 'پاسخ مرجع' },
];

export default function BenchmarkSeeds({ onSeedLoaded, universityId = null }) {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('teachers');
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await benchmarkService.getSeeds(universityId);
    if (res.success) setSeeds(res.data);
    else toast.error(res.message);
    setLoading(false);
  };

  const openDetail = async (seedKey) => {
    setDetailLoading(true);
    setDetailTab('teachers');
    const res = await benchmarkService.getSeed(seedKey);
    if (res.success) setDetail(res.data);
    else toast.error(res.message);
    setDetailLoading(false);
  };

  const handleLoad = async (seed) => {
    setLoadingKey(seed.key);
    try {
      const res = await benchmarkService.loadSeed(seed.key, { universityId });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      // نیمسال تازه‌ساخته‌شده بلافاصله «فعال» می‌شود تا بقیه‌ی تب‌ها (دروس،
      // اساتید، زمان‌بندی) همین داده را نشان دهند و کاربر مجبور به انتخاب دستی نباشد.
      authService.setActiveUniversityConfigId(res.data.university_config_id);
      toast.success(res.message);
      await load();
      if (onSeedLoaded) onSeedLoaded(res.data);
    } finally {
      setLoadingKey(null);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-text_secondary_color">در حال بارگذاری...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Database size={18} className="text-secondary" />
        <h2 className="text-lg font-secondary text-text_primary_color">
          مجموعه‌های داده‌ی آزمون و پاسخ مرجع
        </h2>
      </div>

      <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-5 text-sm text-text_secondary_color leading-relaxed">
        هر مجموعه یک نیمسال کامل و ساختگی است که در کنار آن یک <strong>پاسخ مرجع</strong> نگهداری
        می‌شود: زمان‌بندی‌ای که با جست‌وجوی کامل ساخته شده، هیچ محدودیتی را نقض نمی‌کند و
        هزینه‌ی آن با تابع هزینه‌ی خودِ الگوریتم برابر صفر تأیید شده است. با بارگذاری یک مجموعه،
        یک نیمسال جدید ساخته و فعال می‌شود؛ سپس از تب «زمان‌بندی هوشمند» الگوریتم را اجرا کنید و
        در همان‌جا دکمه‌ی «مقایسه با پاسخ مرجع» نتیجه را ارزیابی می‌کند.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {seeds.map((seed) => (
          <div key={seed.key} className="bg-white rounded-lg border border-line_color p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-secondary text-text_primary_color">{seed.title}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                  DIFFICULTY_STYLE[seed.difficulty] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {seed.difficulty_label}
              </span>
            </div>

            <p className="text-xs text-text_secondary_color leading-relaxed mb-3">
              {seed.description}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              <MiniStat label="استاد" value={seed.stats?.teachers} />
              <MiniStat label="درس" value={seed.stats?.courses} />
              <MiniStat label="مکان" value={seed.stats?.places} />
              <MiniStat label="گروه" value={seed.stats?.student_groups} />
              <MiniStat label="جلسه" value={seed.stats?.sessions} />
              <MiniStat label="محدودیت" value={seed.stats?.constraints} />
            </div>

            {seed.loaded_config && (
              <div className="flex items-center gap-1 text-xs text-success mb-3">
                <CheckCircle2 size={13} />
                قبلاً بارگذاری شده در نیمسال «{seed.loaded_config.name}»
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => openDetail(seed.key)}
                className="bg-gray-100 text-text_primary_color px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm"
              >
                <Eye size={14} /> مشاهده داده‌ها و پاسخ مرجع
              </Button>
              <Button
                onClick={() => handleLoad(seed)}
                disabled={loadingKey === seed.key}
                className="bg-secondary text-white px-3 py-2 w-auto h-auto flex items-center gap-1 text-sm"
              >
                <Download size={14} />
                {loadingKey === seed.key ? 'در حال بارگذاری...' : 'بارگذاری در برنامه'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {detailLoading && (
        <div className="text-center py-4 text-text_secondary_color text-sm">
          در حال دریافت جزئیات...
        </div>
      )}

      <AnimatedModal isVisible={!!detail} onClose={() => setDetail(null)}>
        {detail && <SeedDetail seed={detail} tab={detailTab} onTab={setDetailTab} />}
      </AnimatedModal>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded px-2 py-1.5 text-center">
      <p className="text-[10px] text-text_secondary_color">{label}</p>
      <p className="text-sm font-secondary text-text_primary_color">{value ?? '—'}</p>
    </div>
  );
}

function SeedDetail({ seed, tab, onTab }) {
  const days = (seed.settings.days_of_week || []).filter((d) => d.enabled !== false).map((d) => d.name);
  const slots = (seed.settings.time_slots || []).filter((s) => s.enabled !== false);

  const teacherLookup = Object.fromEntries(seed.teachers.map((t) => [t.code, t.full_name]));
  const placeLookup = Object.fromEntries(seed.places.map((p) => [p.code, p.name]));

  return (
    <div className="max-h-[78vh] overflow-y-auto p-1">
      <h3 className="font-secondary text-lg text-text_primary_color">{seed.title}</h3>
      <p className="text-xs text-text_secondary_color mt-1 mb-4 leading-relaxed">
        {seed.description}
      </p>

      <div className="flex gap-1 flex-wrap border-b border-line_color mb-4">
        {DETAIL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
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

      {tab === 'teachers' && (
        <SimpleTable
          columns={['کد', 'نام', 'جنسیت', 'مدرک', 'نوع استخدام', 'واحد (حداقل/حداکثر)', 'زمان‌های غیرقابل دسترس']}
          rows={seed.teachers.map((t) => [
            t.code,
            t.full_name,
            GENDER_LABEL[t.gender],
            DEGREE_LABEL[t.degree],
            EMPLOYMENT_LABEL[t.employment_type],
            `${t.min_units} / ${t.max_units}`,
            (t.unavailable_times || []).join('، ') || '—',
          ])}
        />
      )}

      {tab === 'courses' && (
        <SimpleTable
          columns={['کد', 'نام درس', 'واحد', 'نوع', 'دانشجوی موردانتظار', 'نوع مکان', 'مکان الزامی', 'جنسیت', 'اساتید مجاز']}
          rows={seed.courses.map((c) => [
            c.code,
            c.name,
            c.units,
            c.course_type,
            c.expected_students,
            c.required_place_type,
            c.required_place || '—',
            GENDER_LABEL[c.gender],
            (c.teachers || []).map((code) => teacherLookup[code] || code).join('، '),
          ])}
        />
      )}

      {tab === 'places' && (
        <SimpleTable
          columns={['کد', 'نام', 'ظرفیت', 'نوع', 'جنسیت', 'امکانات']}
          rows={seed.places.map((p) => [
            p.code,
            p.name,
            p.capacity,
            p.place_type,
            GENDER_LABEL[p.gender],
            (p.facilities || []).join('، ') || '—',
          ])}
        />
      )}

      {tab === 'groups' && (
        <SimpleTable
          columns={['نام گروه', 'ظرفیت', 'ورودی', 'رشته', 'جنسیت', 'دروس الزامی', 'دروس اختیاری']}
          rows={seed.student_groups.map((g) => [
            g.name,
            g.size,
            g.entry_year || '—',
            g.field_of_study || '—',
            GENDER_LABEL[g.gender],
            (g.required_courses || []).join('، ') || '—',
            (g.optional_courses || []).join('، ') || '—',
          ])}
        />
      )}

      {tab === 'constraints' && (
        (seed.constraints || []).length === 0 ? (
          <p className="text-sm text-text_secondary_color py-6 text-center">
            این مجموعه محدودیت اضافه‌ای ندارد.
          </p>
        ) : (
          <SimpleTable
            columns={['نوع', 'پارامترها', 'توضیح']}
            rows={seed.constraints.map((c) => [
              c.type === 'place_unavailable' ? 'عدم دسترسی مکان' : 'ترجیح زمانی',
              JSON.stringify(c.parameters, null, 0),
              c.description || '—',
            ])}
          />
        )
      )}

      {tab === 'target' && (
        <div>
          <div className="bg-success/10 text-success rounded-lg px-3 py-2 text-sm mb-3">
            پاسخ مرجع — هزینه: {seed.target.cost} | جلسات: {seed.target.entries.length} | تخلف: ۰
            {seed.target.total_time_preferences > 0 && (
              <> | ترجیح‌های زمانی رعایت‌شده: {seed.target.satisfied_time_preferences} از {seed.target.total_time_preferences}</>
            )}
          </div>
          <TimetableGrid
            days={days}
            slots={slots}
            entries={seed.target.entries}
            lookup={{ teachers: teacherLookup, places: placeLookup }}
          />
          <p className="text-[11px] text-text_secondary_color mt-2 leading-relaxed">
            این جدول با یک حل‌کننده‌ی دقیق (جست‌وجوی کامل با پس‌گرد) ساخته شده و مستقل از
            الگوریتم فراابتکاری است. توجه کنید که این «یکی از» جواب‌های بهینه است؛ الگوریتم
            ممکن است جدول متفاوتی تولید کند که به همان اندازه معتبر باشد — گزارش مقایسه هر دو
            جنبه (شباهت به این جدول و کیفیت مستقل) را نشان می‌دهد.
          </p>
        </div>
      )}
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line_color">
      <table className="w-full text-xs text-right">
        <thead className="bg-title_header">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 whitespace-nowrap font-secondary">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-line_color">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
