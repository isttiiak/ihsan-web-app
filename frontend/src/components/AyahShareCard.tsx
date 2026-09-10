import { forwardRef } from 'react';
import { surahDisplayName } from '../utils/quranData.js';
import { getArabicFont } from '../utils/quranPrefs.js';
import type { SurahMeta, AyahText } from '../utils/quranData.js';

export const SHARE_CARD_SIZE = 1080;

export interface ShareCardTheme {
  id: string;
  label: string;
  /** decorative radial glow + base gradient — dark-first, matches the accent */
  background: string;
  border: string;
  /** used for the āyah reference, the footer dot, and the glow tint */
  accent: string;
}

/** All dark-first, built from the app's existing brand tokens (CLAUDE.md
 * design system) — emerald is the app's primary, gold/magenta are its
 * existing secondary accents, and slate is a quiet, unbranded option. */
export const SHARE_CARD_THEMES: ShareCardTheme[] = [
  {
    id: 'emerald',
    label: 'Emerald',
    background:
      'radial-gradient(circle at 25% 15%, rgba(16,185,129,0.14), transparent 55%), linear-gradient(135deg, #0d1b17 0%, #0a1412 55%, #0d1420 100%)',
    border: 'rgba(16,185,129,0.18)',
    accent: '#10b981',
  },
  {
    id: 'gold',
    label: 'Gold',
    background:
      'radial-gradient(circle at 25% 15%, rgba(245,158,11,0.14), transparent 55%), linear-gradient(135deg, #1a1510 0%, #120e0a 55%, #0d0b08 100%)',
    border: 'rgba(245,158,11,0.2)',
    accent: '#f59e0b',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    background:
      'radial-gradient(circle at 25% 15%, rgba(192,38,212,0.12), transparent 55%), linear-gradient(135deg, #0d1220 0%, #0a0a14 55%, #120a18 100%)',
    border: 'rgba(192,38,212,0.18)',
    accent: '#c026d3',
  },
  {
    id: 'slate',
    label: 'Slate',
    background: 'linear-gradient(135deg, #080c12 0%, #0a0e14 100%)',
    border: 'rgba(148,163,184,0.16)',
    accent: '#94a3b8',
  },
];

export const DEFAULT_SHARE_CARD_THEME = SHARE_CARD_THEMES[0]!;

const THEME_KEY = 'ihsan_share_card_theme';

export function getShareCardTheme(): ShareCardTheme {
  const id = localStorage.getItem(THEME_KEY);
  return SHARE_CARD_THEMES.find((t) => t.id === id) ?? DEFAULT_SHARE_CARD_THEME;
}
export function setShareCardTheme(id: string): void {
  localStorage.setItem(THEME_KEY, id);
}

export interface AyahShareCardProps {
  surahMeta: SurahMeta | null;
  surahNo: number;
  ayah: AyahText | null;
  showTransliteration: boolean;
  lang: string;
  theme: ShareCardTheme;
}

/**
 * The rasterized image itself (1080×1080, fixed px — no Tailwind/viewport
 * units) — captured via html-to-image. Kept a plain inline-styled node
 * because html-to-image clones computed styles, and fixed px avoids any
 * ambiguity from Tailwind's rem/breakpoint-relative classes at capture time.
 */
const AyahShareCard = forwardRef<HTMLDivElement, AyahShareCardProps>(function AyahShareCard(
  { surahMeta, surahNo, ayah, showTransliteration, lang, theme },
  ref
) {
  const arabicFont = getArabicFont();
  const ayahRef = ayah ? `${surahNo}:${ayah.numberInSurah}` : `${surahNo}`;

  return (
    <div
      ref={ref}
      style={{
        width: SHARE_CARD_SIZE,
        height: SHARE_CARD_SIZE,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        boxSizing: 'border-box',
        background: theme.background,
        border: `1px solid ${theme.border}`,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#94a3b8', fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>
          {surahMeta ? `${surahNo}. ${surahDisplayName(surahMeta, lang)}` : `Surah ${surahNo}`}
        </span>
        <span style={{ color: theme.accent, fontSize: 22, fontWeight: 800 }}>{ayahRef}</span>
      </div>

      {/* body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          textAlign: 'center',
        }}
      >
        <p
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: arabicFont.stack,
            fontSize: 52,
            lineHeight: 1.9,
            color: '#f1f5f9',
            margin: 0,
          }}
        >
          {ayah?.arabic ?? ''}
        </p>
        {showTransliteration && ayah?.transliteration && (
          <p
            style={{
              color: 'rgba(245,158,11,0.8)',
              fontStyle: 'italic',
              fontSize: 24,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: 820,
            }}
          >
            {ayah.transliteration}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860 }}>
          {ayah?.translations.map((tr, i) => (
            <p
              key={i}
              style={{
                color: i === 0 ? 'rgba(241,245,249,0.8)' : '#94a3b8',
                fontSize: 26,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {tr}
            </p>
          ))}
        </div>
      </div>

      {/* footer — small brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: theme.accent,
            display: 'block',
          }}
        />
        <span style={{ color: '#64748b', fontSize: 17, fontWeight: 800, letterSpacing: 3 }}>
          IHSAN
        </span>
      </div>
    </div>
  );
});

export default AyahShareCard;
