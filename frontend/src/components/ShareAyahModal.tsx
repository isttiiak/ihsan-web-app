import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { toBlob } from 'html-to-image';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import AyahShareCard, {
  SHARE_CARD_SIZE,
  SHARE_CARD_THEMES,
  DEFAULT_SHARE_CARD_THEME,
  getShareCardTheme,
  setShareCardTheme,
} from './AyahShareCard.js';
import { loadSurahText, TRANSLATIONS, type SurahMeta, type AyahText } from '../utils/quranData.js';

interface ShareAyahModalProps {
  open: boolean;
  onClose: () => void;
  surahNo: number;
  surahMeta: SurahMeta | null;
  ayahNumberInSurah: number;
  initialEditions: string[];
  initialTranslit: boolean;
}

// Preview scales the fixed 1080×1080 capture node down to fit the modal —
// the DOM node stays full-resolution so html-to-image captures it 1:1.
const PREVIEW_PX = 320;

export default function ShareAyahModal({
  open,
  onClose,
  surahNo,
  surahMeta,
  ayahNumberInSurah,
  initialEditions,
  initialTranslit,
}: ShareAyahModalProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [editions, setEditions] = useState<string[]>(initialEditions.slice(0, 2));
  const [translitOn, setTranslitOn] = useState(initialTranslit);
  const [themeId, setThemeId] = useState<string>(DEFAULT_SHARE_CARD_THEME.id);
  const [ayah, setAyah] = useState<AyahText | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<'copy' | 'download' | 'share' | null>(null);

  const theme = SHARE_CARD_THEMES.find((th) => th.id === themeId) ?? DEFAULT_SHARE_CARD_THEME;

  useEffect(() => {
    if (!open) return;
    setEditions(initialEditions.slice(0, 2));
    setTranslitOn(initialTranslit);
    setThemeId(getShareCardTheme().id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the modal opens
  }, [open]);

  const selectTheme = (id: string) => {
    setThemeId(id);
    setShareCardTheme(id);
  };

  useEffect(() => {
    if (!open || editions.length === 0) return;
    let alive = true;
    setLoading(true);
    loadSurahText(surahNo, editions, translitOn)
      .then((text) => {
        if (!alive) return;
        setAyah(text.find((a) => a.numberInSurah === ayahNumberInSurah) ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, surahNo, ayahNumberInSurah, editions, translitOn]);

  const toggleEdition = (id: string) => {
    setEditions((prev) => {
      if (prev.includes(id)) return prev.filter((e) => e !== id);
      if (prev.length >= 2) return [prev[1]!, id]; // drop the oldest, keep 2
      return [...prev, id];
    });
  };

  const capture = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    return toBlob(cardRef.current, {
      width: SHARE_CARD_SIZE,
      height: SHARE_CARD_SIZE,
      pixelRatio: 1,
      cacheBust: true,
    });
  };

  const handleCopy = async () => {
    setBusyAction('copy');
    try {
      const blob = await capture();
      if (!blob) throw new Error('capture failed');
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success(t('shareAyah.copied', 'Copied — paste it anywhere'));
    } catch {
      toast.error(t('shareAyah.copyError', "Couldn't copy the image — try downloading instead."));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownload = async () => {
    setBusyAction('download');
    try {
      const blob = await capture();
      if (!blob) throw new Error('capture failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ihsan-ayah-${surahNo}-${ayahNumberInSurah}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('shareAyah.captureError', "Couldn't generate the image — try again."));
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    setBusyAction('share');
    try {
      const blob = await capture();
      if (!blob) throw new Error('capture failed');
      const file = new File([blob], `ihsan-ayah-${surahNo}-${ayahNumberInSurah}.png`, {
        type: 'image/png',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error(t('shareAyah.captureError', "Couldn't generate the image — try again."));
      }
    } finally {
      setBusyAction(null);
    }
  };

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    (() => {
      try {
        return navigator.canShare({ files: [new File([], 'x.png', { type: 'image/png' })] });
      } catch {
        return false;
      }
    })();

  // Clipboard image writes need both the API and a secure context (https or
  // localhost) — plain http falls through to Download/Share instead of a
  // silently-failing Copy button.
  const canCopyImage =
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined' &&
    window.isSecureContext;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 24 }}
            className="w-full max-w-sm rounded-2xl bg-brand-deep border border-brand-emerald/25 p-5 my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-black text-base">
                {t('shareAyah.title', 'Share this āyah')}
              </h3>
              <button
                aria-label={t('common.close', 'Close')}
                className="text-white/40 hover:text-white"
                onClick={onClose}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* scaled preview of the fixed-size capture node */}
            <div
              className="mx-auto rounded-xl overflow-hidden border border-brand-emerald/10 grid place-items-center bg-black/20"
              style={{ width: PREVIEW_PX, height: PREVIEW_PX }}
            >
              {loading || !ayah ? (
                <span className="loading loading-spinner text-brand-emerald" />
              ) : (
                <div
                  style={{
                    width: SHARE_CARD_SIZE,
                    height: SHARE_CARD_SIZE,
                    transform: `scale(${PREVIEW_PX / SHARE_CARD_SIZE})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <AyahShareCard
                    ref={cardRef}
                    surahMeta={surahMeta}
                    surahNo={surahNo}
                    ayah={ayah}
                    showTransliteration={translitOn}
                    lang={i18n.language}
                    theme={theme}
                  />
                </div>
              )}
            </div>

            {/* options */}
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-white/40 text-[11px] font-bold mb-1.5">
                  {t('shareAyah.theme', 'Card style')}
                </p>
                <div className="flex gap-2">
                  {SHARE_CARD_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      aria-label={th.label}
                      aria-pressed={themeId === th.id}
                      title={th.label}
                      onClick={() => selectTheme(th.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        themeId === th.id
                          ? 'border-white scale-110'
                          : 'border-white/15 hover:border-white/40'
                      }`}
                      style={{ background: th.background }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/40 text-[11px] font-bold mb-1.5">
                  {t('shareAyah.translations', 'Translations (up to 2)')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TRANSLATIONS.map((ed) => (
                    <button
                      key={ed.id}
                      onClick={() => toggleEdition(ed.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        editions.includes(ed.id)
                          ? 'bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald'
                          : 'bg-white/5 border-brand-emerald/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {ed.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-white/70 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-success"
                  checked={translitOn}
                  onChange={(e) => setTranslitOn(e.target.checked)}
                />
                {t('shareAyah.includeTransliteration', 'Include transliteration')}
              </label>
            </div>

            {/* Copy always leads — it's the fastest path to "paste into WhatsApp/
                Messenger" without a download round-trip. Share only appears
                alongside a real native share sheet (Download vs. Share would
                otherwise be two buttons doing the exact same thing) — see
                `canShareFiles`. Whichever action is last gets the highlighted
                style, so there's always exactly one obvious primary action. */}
            <div
              className="grid gap-2 mt-5"
              style={{
                gridTemplateColumns: `repeat(${1 + (canCopyImage ? 1 : 0) + (canShareFiles ? 1 : 0)}, minmax(0, 1fr))`,
              }}
            >
              {canCopyImage && (
                <button
                  className="btn btn-sm rounded-xl bg-white/5 border-brand-emerald/10 text-white/70 disabled:opacity-50"
                  onClick={handleCopy}
                  disabled={!!busyAction || loading || !ayah}
                >
                  {busyAction === 'copy' ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      {t('shareAyah.copy', 'Copy')}
                    </>
                  )}
                </button>
              )}
              <button
                className={`btn btn-sm rounded-xl disabled:opacity-50 ${
                  canShareFiles
                    ? 'bg-white/5 border-brand-emerald/10 text-white/70'
                    : 'border-0 text-white font-bold bg-gradient-to-r from-brand-emerald to-brand-emerald-dim'
                }`}
                onClick={handleDownload}
                disabled={!!busyAction || loading || !ayah}
              >
                {busyAction === 'download' ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {t('shareAyah.download', 'Download')}
                  </>
                )}
              </button>
              {canShareFiles && (
                <button
                  className="btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-brand-emerald to-brand-emerald-dim disabled:opacity-50"
                  onClick={handleShare}
                  disabled={!!busyAction || loading || !ayah}
                >
                  {busyAction === 'share' ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4" />
                      {t('shareAyah.share', 'Share')}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
