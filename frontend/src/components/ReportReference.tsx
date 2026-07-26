import { Link } from 'react-router-dom';

/**
 * "Think this reference is wrong? Tell us."
 *
 * Istiak's rule: the app cites a lot of Qurʾān and hadith, and any of it could
 * be mistranscribed, misattributed or mis-graded. Every place that shows a
 * reference should offer a one-tap way to report it — a correction that never
 * reaches us is a mistake that stays in front of users.
 *
 * Deliberately quiet: this must never compete with the content it sits under.
 * `variant="inline"` is a single sentence for the end of a reference block;
 * `variant="card"` is a bordered strip for the bottom of a page.
 */
export default function ReportReference({
  what,
  variant = 'inline',
  className = '',
}: {
  /** What is being cited here — becomes context in the feedback form link. */
  what?: string;
  variant?: 'inline' | 'card';
  className?: string;
}) {
  const to = what
    ? `/feedback?topic=reference&about=${encodeURIComponent(what)}`
    : '/feedback?topic=reference';

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-emerald-500/10 bg-white/[0.03] px-4 py-3 ${className}`}>
        <p className="text-white/35 text-[11px] leading-relaxed">
          <span className="text-white/50 font-semibold">Spotted a mistake?</span>{' '}
          Every reference here is checked against quran.com or sunnah.com, but we are human —
          if a verse, a hadith number or a grading looks wrong,{' '}
          <Link to={to} className="text-brand-emerald/75 hover:text-brand-emerald underline underline-offset-2">
            tell us and we will fix it
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <p className={`text-white/25 text-[11px] leading-relaxed ${className}`}>
      Reference look wrong?{' '}
      <Link to={to} className="text-brand-emerald/60 hover:text-brand-emerald underline underline-offset-2">
        Report it
      </Link>
    </p>
  );
}
