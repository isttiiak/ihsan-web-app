import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Wherever the app shows a ḍaʿīf badge, this card must appear near the bottom
 * of that page (Istiak's rule): a reader deserves to know WHY something is
 * called weak, WHO said so, and what the chain's actual defect is — not just a
 * label.
 *
 * Every entry names the specific narrator or defect, because "weak" alone is
 * unfalsifiable. Grades follow the muḥaddithūn cited; where scholars differ
 * (acting on weak reports in faḍāʾil al-aʿmāl) that difference is stated
 * rather than resolved — this app does not issue rulings.
 */

export type DaifTopic = 'ramadan-ashra' | 'nafl-fard-reward' | 'waqiah-poverty';

interface DaifEntry {
  id: DaifTopic;
  claim: string;
  source: string;
  sourceUrl: string;
  defect: string;
  verdict: string;
  practice: string;
}

const ENTRIES: Record<DaifTopic, DaifEntry> = {
  'ramadan-ashra': {
    id: 'ramadan-ashra',
    claim: 'That Ramadan divides into ten days of mercy (raḥmah), ten of forgiveness (maghfirah) and ten of freedom from the Fire (ʿitq min an-nār).',
    source: 'Ṣaḥīḥ Ibn Khuzaymah 1887 — the Salmān al-Fārisī (ra) sermon',
    sourceUrl: 'https://hadithanswers.com/the-famous-hadith-on-the-virtues-of-ramadan-radiyallahu-anhu/',
    defect: 'Its chain contains ʿAlī ibn Zayd ibn Judʿān, whom an-Nasāʾī and other critics declared weak for poor retention. Ibn Khuzaymah himself introduced the report with “if the report is authentic” (in ṣaḥḥa’l-khabar) — an explicit signal of his own doubt, unusual in a collection titled Ṣaḥīḥ.',
    verdict: 'Ḍaʿīf. Graded weak by al-Albānī and by the majority of later critics.',
    practice: 'The three names remain the most common way Muslims organise the month, so Ihsan uses them as a FRAMING for the calendar — never as a promised reward structure. The last ten nights are a separate matter: their virtue and the search for Laylat al-Qadr are firmly authentic (Ṣaḥīḥ al-Bukhārī 2017).',
  },
  'nafl-fard-reward': {
    id: 'nafl-fard-reward',
    claim: 'That a voluntary act in Ramadan carries the reward of an obligatory one, and an obligatory act the reward of seventy.',
    source: 'Ṣaḥīḥ Ibn Khuzaymah 1887 — the same Salmān al-Fārisī sermon',
    sourceUrl: 'https://islamqa.info/en/answers/21364',
    defect: 'Identical chain and identical defect as above — ʿAlī ibn Zayd ibn Judʿān — since both statements come from one sermon, not two independent reports.',
    verdict: 'Ḍaʿīf.',
    practice: 'Ihsan shows it because it is so widely quoted that silence would be more confusing than disclosure, but always beside an authentic alternative. Ramadan’s established virtue needs no weak support: “When Ramadan begins, the gates of Paradise are opened…” (Ṣaḥīḥ al-Bukhārī 1899).',
  },
  'waqiah-poverty': {
    id: 'waqiah-poverty',
    claim: 'That whoever recites Sūrat al-Wāqiʿah every night will never be afflicted by poverty.',
    source: 'al-Bayhaqī, Shuʿab al-Īmān 2269',
    sourceUrl: 'https://islamweb.net/en/fatwa/348835/',
    defect: 'The routes are defective in different ways: one passes through Abū Shujāʿ, criticised for weakness; another, narrated from Ibn ʿAbbās via Aḥmad al-Yamāmī, involves a narrator accused of lying — which pushes that route to fabricated (mawḍūʿ) rather than merely weak.',
    verdict: 'Ḍaʿīf; some chains graded mawḍūʿ. Declared weak by al-Albānī, and Imām Aḥmad is reported to have rejected it.',
    practice: 'What IS established is the practice of the companion: ʿAbdullāh ibn Masʿūd (ra) instructed his daughters to recite it each night. So Ihsan offers the surah as a good nightly habit and states no reward. Note too that the wording is “every night”, not specifically after Maghrib.',
  },
};

export default function DaifExplainer({ topics }: { topics: DaifTopic[] }) {
  const [open, setOpen] = useState(false);
  const list = topics.map((t) => ENTRIES[t]).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div className="rounded-3xl border border-brand-gold/20 bg-brand-gold/[0.05] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-lg shrink-0">⚖️</span>
        <span className="flex-1 min-w-0">
          <span className="block text-brand-gold/90 font-bold text-sm">
            Why some things on this page are marked <span className="italic">ḍaʿīf</span>
          </span>
          <span className="block text-white/30 text-[11px] mt-0.5">
            {list.length} narration{list.length > 1 ? 's' : ''} — the chain, the defect, and who graded it
          </span>
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-brand-gold/50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 space-y-4">
              <p className="text-white/40 text-xs leading-relaxed border-l-2 border-brand-gold/25 pl-3">
                <b className="text-white/70">Ḍaʿīf</b> means the chain of transmission has a flaw — a narrator with
                weak memory, an unknown link, or a break — so the words cannot be attributed to the Prophet ﷺ with
                confidence. It does not automatically mean the meaning is false. Many scholars permit acting on a weak
                report to encourage good deeds (faḍāʾil al-aʿmāl) provided nothing is treated as an established ruling
                or a guaranteed reward; others decline to use them at all. Ihsan shows the grade so you can follow your
                own scholars.
              </p>

              {list.map((e) => (
                <div key={e.id} className="rounded-2xl bg-black/20 border border-brand-gold/15 p-4">
                  <p className="text-white/80 text-sm font-semibold leading-relaxed">{e.claim}</p>

                  <dl className="mt-2.5 space-y-1.5 text-xs leading-relaxed">
                    <div>
                      <dt className="inline text-white/30">Where it is found: </dt>
                      <dd className="inline text-white/60">{e.source}</dd>
                    </div>
                    <div>
                      <dt className="inline text-white/30">The defect: </dt>
                      <dd className="inline text-white/60">{e.defect}</dd>
                    </div>
                    <div>
                      <dt className="inline text-white/30">Verdict: </dt>
                      <dd className="inline text-brand-gold/80 font-semibold">{e.verdict}</dd>
                    </div>
                    <div>
                      <dt className="inline text-white/30">How Ihsan uses it: </dt>
                      <dd className="inline text-white/60">{e.practice}</dd>
                    </div>
                  </dl>

                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-[11px] text-brand-gold/60 hover:text-brand-gold underline underline-offset-2"
                  >
                    Read the scholarly discussion ↗
                  </a>
                </div>
              ))}

              <p className="text-white/30 text-[11px] leading-relaxed">
                Ihsan is not a source of religious authority — verify with a scholar you trust. Spotted a grading you
                believe is wrong?{' '}
                <Link to="/feedback" className="text-brand-emerald/70 hover:text-brand-emerald underline underline-offset-2">
                  Tell us and we will correct it
                </Link>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
