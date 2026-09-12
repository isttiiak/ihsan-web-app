// UI chrome strings for the standalone SEO page tree (frontend/src/seo/).
// Deliberately separate from the app-wide src/i18n.ts (see CLAUDE.md-style
// note in Phase E of the SEO plan) — these three languages back only the
// /prayer-times, /qibla, /ramadan-calendar, /duas, /adhkar and
// /hijri-date-converter static pages, not the authenticated app.
export type SeoLang = 'en' | 'bn' | 'ar';
export const SEO_LANGS: SeoLang[] = ['en', 'bn', 'ar'];
export const RTL_LANGS: SeoLang[] = ['ar'];

export interface ChromeStrings {
  siteName: string;
  tagline: string;
  home: string;
  backToLiveApp: string;
  languageLabel: string;
  breadcrumbPrayerTimes: string;
  breadcrumbQibla: string;
  breadcrumbRamadan: string;
  breadcrumbDuas: string;
  breadcrumbAdhkar: string;
  breadcrumbHijri: string;

  prayerTimes: {
    heading: (city: string) => string;
    subheading: (city: string, country: string) => string;
    todayLabel: string;
    methodNote: string;
    hanafiAsrNote: string;
    liveAppCta: string;
    qiblaCta: (city: string) => string;
    ramadanCta: (city: string) => string;
    faqTitle: string;
    faq: { q: string; a: string }[];
    nearbyTitle: string;
  };

  qibla: {
    heading: (city: string) => string;
    subheading: (city: string, country: string) => string;
    bearingLabel: string;
    distanceLabel: string;
    howToFindTitle: string;
    howToFindBody: string;
    liveAppCta: string;
    prayerTimesCta: (city: string) => string;
    faqTitle: string;
    faq: { q: string; a: string }[];
  };

  ramadan: {
    heading: (city: string, year: number) => string;
    subheading: (city: string, country: string) => string;
    imsakLabel: string;
    iftarLabel: string;
    dayLabel: string;
    dateLabel: string;
    liveAppCta: string;
    prayerTimesCta: (city: string) => string;
    qiblaCta: (city: string) => string;
    note: string;
  };

  duas: {
    heading: string;
    subheading: string;
    allSituations: string;
    arabicLabel: string;
    transliterationLabel: string;
    translationLabel: string;
    sourceLabel: string;
    pageHeading: (situation: string) => string;
  };

  adhkar: {
    morningTitle: string;
    eveningTitle: string;
    morningSubtitle: string;
    eveningSubtitle: string;
    switchToMorning: string;
    switchToEvening: string;
    repeatLabel: (n: number) => string;
    sourceLabel: string;
  };

  hijri: {
    title: string;
    subtitle: string;
    gregorianLabel: string;
    hijriLabel: string;
    todayLabel: string;
    convertHint: string;
  };
}

const en: ChromeStrings = {
  siteName: 'Bustandeen',
  tagline: 'Grow Your Garden of Good Deeds',
  home: 'Home',
  backToLiveApp: 'Open the live, on-device calculator in the app',
  languageLabel: 'Language',
  breadcrumbPrayerTimes: 'Prayer Times',
  breadcrumbQibla: 'Qibla Direction',
  breadcrumbRamadan: 'Ramadan Calendar',
  breadcrumbDuas: "Du'a Library",
  breadcrumbAdhkar: 'Adhkar',
  breadcrumbHijri: 'Hijri Date Converter',
  prayerTimes: {
    heading: (city) => `Prayer Times in ${city} Today`,
    subheading: (city, country) =>
      `Fajr, Dhuhr, Asr, Maghrib and Isha prayer times for ${city}, ${country}.`,
    todayLabel: "Today's prayer times",
    methodNote:
      'Calculated on-device using standard astronomical formulas (the same method the Bustandeen app uses for every prayer-time calculation).',
    hanafiAsrNote:
      "Asr time shown uses the standard (Shafi'i/Maliki/Hanbali) convention; the app lets you switch to the Hanafi convention.",
    liveAppCta: 'Open the live prayer-time tracker for exact, auto-updating times',
    qiblaCta: (city) => `Qibla direction from ${city}`,
    ramadanCta: (city) => `Ramadan calendar for ${city}`,
    faqTitle: 'Common questions',
    faq: [
      {
        q: 'How are these prayer times calculated?',
        a: "Prayer times are computed from the city's exact coordinates using standard astronomical formulas for sun position — the same on-device calculation the Bustandeen app uses, with no third-party prayer-time API involved.",
      },
      {
        q: 'Do these times account for daylight saving or local timezone changes?',
        a: "Yes — times are shown in the city's own local time. For guaranteed live accuracy on any date, open the app's prayer-time tracker, which recalculates on your device.",
      },
      {
        q: 'What calculation method and Asr convention are used?',
        a: 'A standard calculation method with the majority-view Asr convention is shown by default; the in-app tracker lets you choose from multiple calculation methods and switch to the Hanafi Asr convention.',
      },
    ],
    nearbyTitle: 'Nearby',
  },
  qibla: {
    heading: (city) => `Qibla Direction from ${city}`,
    subheading: (city, country) =>
      `The compass bearing to face the Kaaba in Makkah from ${city}, ${country}.`,
    bearingLabel: 'Qibla bearing (from true North)',
    distanceLabel: 'Distance to Makkah',
    howToFindTitle: 'How to find the Qibla without a compass',
    howToFindBody:
      "Stand facing the bearing shown above, measured clockwise from true North (not magnetic North — most phone compasses need calibration to show true North accurately). The Bustandeen app's live Qibla compass uses your device's orientation sensor and current location to point automatically, with no manual calculation needed.",
    liveAppCta: 'Open the live Qibla compass in the app',
    prayerTimesCta: (city) => `Prayer times for ${city}`,
    faqTitle: 'Common questions',
    faq: [
      {
        q: 'How is the Qibla direction calculated?',
        a: "The bearing is the great-circle direction from the city's coordinates to the Kaaba in Makkah (21.4225°N, 39.8262°E), calculated using standard spherical trigonometry.",
      },
      {
        q: 'Why does the Qibla direction not point toward Makkah on a flat map?',
        a: 'Because the Earth is a sphere, the shortest path (great-circle route) often looks like a curve on a flat map projection — the bearing shown here is the correct compass direction to face, not a straight line on a 2D map.',
      },
    ],
  },
  ramadan: {
    heading: (city, year) => `Ramadan ${year} Calendar for ${city}`,
    subheading: (city, country) =>
      `Suhoor (Imsak) and Iftar times for every day of Ramadan in ${city}, ${country}.`,
    imsakLabel: 'Imsak / Suhoor ends (Fajr)',
    iftarLabel: 'Iftar (Maghrib)',
    dayLabel: 'Day',
    dateLabel: 'Date',
    liveAppCta: 'Track your fasts day-by-day in the app',
    prayerTimesCta: (city) => `Year-round prayer times for ${city}`,
    qiblaCta: (city) => `Qibla direction from ${city}`,
    note: 'The Ramadan start date follows the Umm al-Qura (islamic-umalqura) calendar estimate and may shift by a day depending on local moon-sighting announcements — always confirm with your local moon-sighting authority.',
  },
  duas: {
    heading: "Du'a Library",
    subheading: "Authentic du'as for everyday situations, with source and grading for every entry.",
    allSituations: 'All situations',
    arabicLabel: 'Arabic',
    transliterationLabel: 'Transliteration',
    translationLabel: 'Translation',
    sourceLabel: 'Source',
    pageHeading: (situation) => `Dua for ${situation}`,
  },
  adhkar: {
    morningTitle: 'Morning Adhkar',
    eveningTitle: 'Evening Adhkar',
    morningSubtitle: "Adhkār aṣ-Ṣabāḥ — the Prophet's ﷺ remembrances for the start of the day.",
    eveningSubtitle: "Adhkār al-Masā' — the Prophet's ﷺ remembrances for the end of the day.",
    switchToMorning: 'Morning',
    switchToEvening: 'Evening',
    repeatLabel: (n) => (n > 1 ? `Recite ${n} times` : 'Recite once'),
    sourceLabel: 'Source',
  },
  hijri: {
    title: 'Hijri Date Converter',
    subtitle: 'Convert between the Gregorian and Islamic (Hijri) calendars.',
    gregorianLabel: 'Gregorian date',
    hijriLabel: 'Hijri date',
    todayLabel: "Today's date",
    convertHint: 'Open the app for an interactive date-by-date converter.',
  },
};

const bn: ChromeStrings = {
  siteName: 'Bustandeen',
  tagline: 'আপনার নেক আমলের বাগান গড়ে তুলুন',
  home: 'হোম',
  backToLiveApp: 'অ্যাপে লাইভ, অন-ডিভাইস ক্যালকুলেটর খুলুন',
  languageLabel: 'ভাষা',
  breadcrumbPrayerTimes: 'নামাজের সময়',
  breadcrumbQibla: 'কিবলার দিক',
  breadcrumbRamadan: 'রমজান ক্যালেন্ডার',
  breadcrumbDuas: 'দোয়া সংকলন',
  breadcrumbAdhkar: 'আযকার',
  breadcrumbHijri: 'হিজরি তারিখ কনভার্টার',
  prayerTimes: {
    heading: (city) => `${city}-এ আজকের নামাজের সময়`,
    subheading: (city, country) =>
      `${city}, ${country}-এর ফজর, যোহর, আসর, মাগরিব ও এশার নামাজের সময়।`,
    todayLabel: 'আজকের নামাজের সময়',
    methodNote:
      'মান জ্যোতির্বৈজ্ঞানিক সূত্র ব্যবহার করে ডিভাইসেই হিসাব করা হয়েছে (Bustandeen অ্যাপের প্রতিটি নামাজের সময় হিসাবেও একই পদ্ধতি ব্যবহৃত হয়)।',
    hanafiAsrNote:
      'এখানে দেখানো আসরের সময় সাধারণ (শাফেয়ী/মালেকী/হাম্বলী) মত অনুযায়ী; অ্যাপে হানাফি মত অনুযায়ীও পরিবর্তন করা যায়।',
    liveAppCta: 'সঠিক, স্বয়ংক্রিয়ভাবে হালনাগাদ হওয়া সময়ের জন্য লাইভ নামাজ ট্র্যাকার খুলুন',
    qiblaCta: (city) => `${city} থেকে কিবলার দিক`,
    ramadanCta: (city) => `${city}-এর রমজান ক্যালেন্ডার`,
    faqTitle: 'সাধারণ প্রশ্ন',
    faq: [
      {
        q: 'এই নামাজের সময়গুলো কীভাবে হিসাব করা হয়?',
        a: 'শহরের সঠিক স্থানাঙ্ক ব্যবহার করে সূর্যের অবস্থান নির্ণয়ের মান জ্যোতির্বৈজ্ঞানিক সূত্র অনুযায়ী নামাজের সময় হিসাব করা হয় — এটি Bustandeen অ্যাপের একই অন-ডিভাইস হিসাব পদ্ধতি, কোনো তৃতীয়-পক্ষের API ছাড়াই।',
      },
      {
        q: 'এতে কি ডে-লাইট সেভিং বা স্থানীয় টাইমজোন পরিবর্তন হিসাবে ধরা হয়েছে?',
        a: 'হ্যাঁ — সময়গুলো শহরের নিজস্ব স্থানীয় সময় অনুযায়ী দেখানো হয়েছে। যেকোনো তারিখে নিশ্চিতভাবে সঠিক সময়ের জন্য, অ্যাপের নামাজ ট্র্যাকার খুলুন, যা আপনার ডিভাইসে পুনরায় হিসাব করে।',
      },
      {
        q: 'কোন হিসাব পদ্ধতি ও আসরের মত ব্যবহার করা হয়েছে?',
        a: 'ডিফল্টভাবে একটি প্রচলিত হিসাব পদ্ধতি ও সংখ্যাগরিষ্ঠ মত অনুযায়ী আসরের সময় দেখানো হয়েছে; অ্যাপের ভেতরের ট্র্যাকারে একাধিক হিসাব পদ্ধতি থেকে বেছে নেওয়া যায় এবং হানাফি মতে পরিবর্তন করা যায়।',
      },
    ],
    nearbyTitle: 'কাছাকাছি শহর',
  },
  qibla: {
    heading: (city) => `${city} থেকে কিবলার দিক`,
    subheading: (city, country) => `${city}, ${country} থেকে মক্কার কাবার দিকে ফেরার কম্পাস দিক।`,
    bearingLabel: 'কিবলার দিক (সত্যিকারের উত্তর থেকে)',
    distanceLabel: 'মক্কা পর্যন্ত দূরত্ব',
    howToFindTitle: 'কম্পাস ছাড়া কিবলা খুঁজে বের করার উপায়',
    howToFindBody:
      'উপরে দেখানো দিক অনুযায়ী দাঁড়ান, যা সত্যিকারের উত্তর থেকে ঘড়ির কাঁটার দিকে পরিমাপ করা (চৌম্বক উত্তর নয় — বেশিরভাগ ফোনের কম্পাসে সত্যিকারের উত্তর দেখাতে ক্যালিব্রেশন প্রয়োজন)। Bustandeen অ্যাপের লাইভ কিবলা কম্পাস আপনার ডিভাইসের অভিমুখ সেন্সর ও বর্তমান অবস্থান ব্যবহার করে স্বয়ংক্রিয়ভাবে দিক দেখায়, কোনো ম্যানুয়াল হিসাবের প্রয়োজন নেই।',
    liveAppCta: 'অ্যাপে লাইভ কিবলা কম্পাস খুলুন',
    prayerTimesCta: (city) => `${city}-এর নামাজের সময়`,
    faqTitle: 'সাধারণ প্রশ্ন',
    faq: [
      {
        q: 'কিবলার দিক কীভাবে হিসাব করা হয়?',
        a: 'শহরের স্থানাঙ্ক থেকে মক্কার কাবা (২১.৪২২৫°উত্তর, ৩৯.৮২৬২°পূর্ব) পর্যন্ত গ্রেট-সার্কেল দিক মান গোলীয় ত্রিকোণমিতি ব্যবহার করে হিসাব করা হয়।',
      },
      {
        q: 'ফ্ল্যাট মানচিত্রে কিবলার দিক মক্কার দিকে কেন সোজা দেখায় না?',
        a: 'পৃথিবী গোলাকার হওয়ায়, সবচেয়ে সংক্ষিপ্ত পথ (গ্রেট-সার্কেল রুট) সমতল মানচিত্রে বাঁকা দেখাতে পারে — এখানে দেখানো দিকটিই সঠিক কম্পাস দিক, ২ডি মানচিত্রে সরলরেখা নয়।',
      },
    ],
  },
  ramadan: {
    heading: (city, year) => `${city}-এর রমজান ${year} ক্যালেন্ডার`,
    subheading: (city, country) =>
      `${city}, ${country}-এ রমজানের প্রতিটি দিনের সেহরি (ইমসাক) ও ইফতারের সময়।`,
    imsakLabel: 'ইমসাক / সেহরি শেষ (ফজর)',
    iftarLabel: 'ইফতার (মাগরিব)',
    dayLabel: 'দিন',
    dateLabel: 'তারিখ',
    liveAppCta: 'অ্যাপে প্রতিদিনের রোজা ট্র্যাক করুন',
    prayerTimesCta: (city) => `${city}-এর সারাবছরের নামাজের সময়`,
    qiblaCta: (city) => `${city} থেকে কিবলার দিক`,
    note: 'রমজানের শুরুর তারিখ উম্মুল কুরা (islamic-umalqura) ক্যালেন্ডারের হিসাব অনুযায়ী দেখানো হয়েছে এবং স্থানীয় চাঁদ দেখা কমিটির ঘোষণা অনুযায়ী এক দিন কমবেশি হতে পারে — সবসময় আপনার স্থানীয় চাঁদ দেখা কর্তৃপক্ষের সাথে নিশ্চিত করুন।',
  },
  duas: {
    heading: 'দোয়া সংকলন',
    subheading: 'প্রতিদিনের পরিস্থিতির জন্য বিশুদ্ধ দোয়া, প্রতিটির উৎস ও মান উল্লেখসহ।',
    allSituations: 'সব পরিস্থিতি',
    arabicLabel: 'আরবি',
    transliterationLabel: 'উচ্চারণ',
    translationLabel: 'অর্থ',
    sourceLabel: 'উৎস',
    pageHeading: (situation) => `${situation}-এর দোয়া`,
  },
  adhkar: {
    morningTitle: 'সকালের আযকার',
    eveningTitle: 'সন্ধ্যার আযকার',
    morningSubtitle: 'আযকারুস সাবাহ — দিন শুরুর জন্য নবী ﷺ-এর শেখানো যিকির।',
    eveningSubtitle: 'আযকারুল মাসা — দিন শেষের জন্য নবী ﷺ-এর শেখানো যিকির।',
    switchToMorning: 'সকাল',
    switchToEvening: 'সন্ধ্যা',
    repeatLabel: (n) => (n > 1 ? `${n} বার পড়ুন` : 'একবার পড়ুন'),
    sourceLabel: 'উৎস',
  },
  hijri: {
    title: 'হিজরি তারিখ কনভার্টার',
    subtitle: 'গ্রেগরিয়ান ও ইসলামিক (হিজরি) ক্যালেন্ডারের মধ্যে রূপান্তর করুন।',
    gregorianLabel: 'গ্রেগরিয়ান তারিখ',
    hijriLabel: 'হিজরি তারিখ',
    todayLabel: 'আজকের তারিখ',
    convertHint: 'ইন্টারেক্টিভ তারিখ-ভিত্তিক কনভার্টারের জন্য অ্যাপ খুলুন।',
  },
};

const ar: ChromeStrings = {
  siteName: 'Bustandeen',
  tagline: 'ازرع حديقة حسناتك',
  home: 'الرئيسية',
  backToLiveApp: 'افتح الحاسبة المباشرة في التطبيق',
  languageLabel: 'اللغة',
  breadcrumbPrayerTimes: 'مواقيت الصلاة',
  breadcrumbQibla: 'اتجاه القبلة',
  breadcrumbRamadan: 'تقويم رمضان',
  breadcrumbDuas: 'مكتبة الأدعية',
  breadcrumbAdhkar: 'الأذكار',
  breadcrumbHijri: 'محول التاريخ الهجري',
  prayerTimes: {
    heading: (city) => `مواقيت الصلاة اليوم في ${city}`,
    subheading: (city, country) =>
      `مواقيت الفجر والظهر والعصر والمغرب والعشاء في ${city}, ${country}.`,
    todayLabel: 'مواقيت الصلاة اليوم',
    methodNote:
      'تُحسب المواقيت على الجهاز مباشرة باستخدام معادلات فلكية قياسية — نفس الطريقة المستخدمة في تطبيق Bustandeen لكل حساب لمواقيت الصلاة.',
    hanafiAsrNote:
      'وقت العصر المعروض هنا وفق المذهب الجمهور (الشافعي/المالكي/الحنبلي)؛ يمكن التبديل إلى المذهب الحنفي داخل التطبيق.',
    liveAppCta: 'افتح متتبع الصلاة المباشر للحصول على مواقيت دقيقة ومحدَّثة تلقائيًا',
    qiblaCta: (city) => `اتجاه القبلة من ${city}`,
    ramadanCta: (city) => `تقويم رمضان لمدينة ${city}`,
    faqTitle: 'أسئلة شائعة',
    faq: [
      {
        q: 'كيف تُحسب مواقيت الصلاة هذه؟',
        a: 'تُحسب المواقيت من الإحداثيات الدقيقة للمدينة باستخدام معادلات فلكية قياسية لموضع الشمس — وهي نفس طريقة الحساب المستخدمة داخل تطبيق Bustandeen، دون الاعتماد على أي واجهة برمجية خارجية.',
      },
      {
        q: 'هل تُراعى هذه المواقيت التوقيت الصيفي أو تغيّر المنطقة الزمنية المحلية؟',
        a: 'نعم — تُعرض المواقيت بالتوقيت المحلي للمدينة نفسها. للحصول على دقة مضمونة ومباشرة في أي تاريخ، افتح متتبع مواقيت الصلاة في التطبيق الذي يعيد الحساب على جهازك.',
      },
      {
        q: 'ما طريقة الحساب ومذهب العصر المستخدمان؟',
        a: 'تُعرض افتراضيًا طريقة حساب قياسية مع مذهب الجمهور للعصر؛ ويتيح متتبع التطبيق اختيار طرق حساب متعددة والتبديل إلى مذهب العصر الحنفي.',
      },
    ],
    nearbyTitle: 'مدن قريبة',
  },
  qibla: {
    heading: (city) => `اتجاه القبلة من ${city}`,
    subheading: (city, country) =>
      `اتجاه البوصلة نحو الكعبة المشرفة في مكة المكرمة من ${city}, ${country}.`,
    bearingLabel: 'زاوية القبلة (من الشمال الحقيقي)',
    distanceLabel: 'المسافة إلى مكة المكرمة',
    howToFindTitle: 'كيف تحدد اتجاه القبلة بدون بوصلة',
    howToFindBody:
      'قف باتجاه الزاوية الموضحة أعلاه، المقاسة باتجاه عقارب الساعة من الشمال الحقيقي (وليس الشمال المغناطيسي — تحتاج معظم بوصلات الهواتف إلى معايرة لعرض الشمال الحقيقي بدقة). تستخدم بوصلة القبلة المباشرة في تطبيق Bustandeen حساس اتجاه جهازك وموقعك الحالي للإشارة تلقائيًا، دون الحاجة لأي حساب يدوي.',
    liveAppCta: 'افتح بوصلة القبلة المباشرة في التطبيق',
    prayerTimesCta: (city) => `مواقيت الصلاة في ${city}`,
    faqTitle: 'أسئلة شائعة',
    faq: [
      {
        q: 'كيف يُحسب اتجاه القبلة؟',
        a: 'الزاوية الموضحة هي اتجاه الدائرة العظمى من إحداثيات المدينة إلى الكعبة المشرفة (21.4225° شمالاً، 39.8262° شرقًا)، محسوبة باستخدام حساب المثلثات الكروية القياسي.',
      },
      {
        q: 'لماذا لا يشير اتجاه القبلة مباشرة نحو مكة على خريطة مسطحة؟',
        a: 'لأن الأرض كروية الشكل، غالبًا ما يبدو أقصر مسار (مسار الدائرة العظمى) منحنيًا على إسقاط خريطة مسطحة — والزاوية الموضحة هنا هي اتجاه البوصلة الصحيح الذي يجب استقباله، وليست خطًا مستقيمًا على خريطة ثنائية الأبعاد.',
      },
    ],
  },
  ramadan: {
    heading: (city, year) => `تقويم رمضان ${year} لمدينة ${city}`,
    subheading: (city, country) =>
      `مواقيت الإمساك (السحور) والإفطار لكل يوم من رمضان في ${city}, ${country}.`,
    imsakLabel: 'الإمساك / نهاية السحور (الفجر)',
    iftarLabel: 'الإفطار (المغرب)',
    dayLabel: 'اليوم',
    dateLabel: 'التاريخ',
    liveAppCta: 'تابع صيامك يومًا بيوم داخل التطبيق',
    prayerTimesCta: (city) => `مواقيت الصلاة على مدار العام في ${city}`,
    qiblaCta: (city) => `اتجاه القبلة من ${city}`,
    note: 'يعتمد تاريخ بداية رمضان على تقويم أم القرى (islamic-umalqura) وقد يختلف بيوم واحد حسب إعلانات رؤية الهلال المحلية — يُرجى دائمًا التأكد من الجهة الرسمية لرؤية الهلال في بلدك.',
  },
  duas: {
    heading: 'مكتبة الأدعية',
    subheading: 'أدعية صحيحة لمواقف الحياة اليومية، مع ذكر المصدر ودرجة الحديث لكل دعاء.',
    allSituations: 'كل المواقف',
    arabicLabel: 'النص العربي',
    transliterationLabel: 'النطق بالحروف اللاتينية',
    translationLabel: 'المعنى',
    sourceLabel: 'المصدر',
    pageHeading: (situation) => `دعاء ${situation}`,
  },
  adhkar: {
    morningTitle: 'أذكار الصباح',
    eveningTitle: 'أذكار المساء',
    morningSubtitle: 'أذكار الصباح المأثورة عن النبي ﷺ لبداية اليوم.',
    eveningSubtitle: 'أذكار المساء المأثورة عن النبي ﷺ لنهاية اليوم.',
    switchToMorning: 'الصباح',
    switchToEvening: 'المساء',
    repeatLabel: (n) => (n > 1 ? `يُكرر ${n} مرات` : 'مرة واحدة'),
    sourceLabel: 'المصدر',
  },
  hijri: {
    title: 'محول التاريخ الهجري',
    subtitle: 'حوّل بين التقويمين الميلادي والهجري.',
    gregorianLabel: 'التاريخ الميلادي',
    hijriLabel: 'التاريخ الهجري',
    todayLabel: 'تاريخ اليوم',
    convertHint: 'افتح التطبيق لمحول تفاعلي بين التواريخ.',
  },
};

export const CHROME: Record<SeoLang, ChromeStrings> = { en, bn, ar };
