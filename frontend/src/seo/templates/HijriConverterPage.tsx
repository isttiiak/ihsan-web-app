import { CHROME, type SeoLang } from '../locales/chrome.js';
import Layout, { langPath } from '../components/Layout.js';
import JsonLd, { breadcrumbJsonLd } from '../components/JsonLd.js';
import { toHijri } from '../utils/calc.js';

const LOCALE_BY_LANG: Record<SeoLang, string> = { en: 'en-US', bn: 'bn-BD', ar: 'ar-SA' };
const HIJRI_MONTHS: Record<SeoLang, string[]> = {
  en: [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ],
  bn: [
    'মুহাররম',
    'সফর',
    'রবিউল আউয়াল',
    'রবিউস সানি',
    'জমাদিউল আউয়াল',
    'জমাদিউস সানি',
    'রজব',
    'শাবান',
    'রমজান',
    'শাওয়াল',
    'জিলকদ',
    'জিলহজ',
  ],
  ar: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
};

interface Props {
  lang: SeoLang;
  buildDate: Date;
}

export default function HijriConverterPage({ lang, buildDate }: Props) {
  const t = CHROME[lang];
  const locale = LOCALE_BY_LANG[lang];
  const hijri = toHijri(buildDate);
  const gregorianStr = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(buildDate);
  const hijriStr = `${hijri.day} ${HIJRI_MONTHS[lang][hijri.month - 1]} ${hijri.year} AH`;
  const url = `https://bustandeen.com${langPath(lang, '/hijri-date-converter')}`;

  return (
    <Layout
      lang={lang}
      breadcrumbs={[{ label: t.home, path: langPath(lang, '/') }, { label: t.breadcrumbHijri }]}
    >
      <h1 className="text-2xl sm:text-3xl font-black text-[#f1f5f9]">{t.hijri.title}</h1>
      <p className="text-[#94a3b8] mt-2">{t.hijri.subtitle}</p>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1520] p-5">
          <p className="text-xs uppercase tracking-widest text-[#94a3b8]">
            {t.hijri.gregorianLabel}
          </p>
          <p className="text-lg font-bold text-[#f1f5f9] mt-1">{gregorianStr}</p>
        </div>
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1520] p-5">
          <p className="text-xs uppercase tracking-widest text-[#94a3b8]">{t.hijri.hijriLabel}</p>
          <p className="text-lg font-bold text-[#10b981] mt-1">{hijriStr}</p>
        </div>
      </div>
      <p className="text-xs text-[#94a3b8] mt-3">{t.hijri.todayLabel}</p>

      <a
        href="https://bustandeen.com/"
        className="mt-5 inline-block rounded-xl bg-[#10b981] text-[#080c12] font-bold text-sm px-4 py-2.5 no-underline"
      >
        {t.hijri.convertHint}
      </a>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.home, url: 'https://bustandeen.com/' },
          { name: t.breadcrumbHijri, url },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: t.hijri.title,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web',
          url,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
    </Layout>
  );
}
