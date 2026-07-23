import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import { useQuranSummary, useToggleBookmark, useToggleDuaBookmark, type QuranBookmark } from '../hooks/useQuran.js';
import { loadSurahList, loadSurahText, type SurahMeta, type AyahText } from '../utils/quranData.js';
import { QURANIC_DUAS } from '../utils/quranMeta.js';

/**
 * 🔖 Saved — a full tab of its own (Istiak's spec) with TWO sub-tabs:
 * āyāt (organized by surah, Arabic preview) and saved duʿās from the
 * curated list. Each entry opens straight in the reader.
 */
export default function QuranBookmarks() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useQuranSummary();
  const toggleBookmark = useToggleBookmark();
  const toggleDua = useToggleDuaBookmark();

  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [texts, setTexts] = useState<Record<number, AyahText[]>>({});
  const [pendingRemove, setPendingRemove] = useState<QuranBookmark | null>(null);
  const [pendingRemoveDua, setPendingRemoveDua] = useState<string | null>(null);
  const [tab, setTab] = useState<'ayat' | 'duas'>('ayat');

  const savedDuas = useMemo(
    () => (summary?.profile.savedDuas ?? [])
      .map((id) => QURANIC_DUAS.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => !!d),
    [summary]
  );

  const groups = useMemo(() => {
    const m = new Map<number, QuranBookmark[]>();
    for (const b of summary?.bookmarks ?? []) {
      const arr = m.get(b.surah) ?? [];
      arr.push(b);
      m.set(b.surah, arr);
    }
    return [...m.entries()]
      .map(([surah, items]) => ({ surah, items: items.sort((a, b) => a.ayah - b.ayah) }))
      .sort((a, b) => a.surah - b.surah);
  }, [summary]);

  useEffect(() => {
    let alive = true;
    loadSurahList().then((l) => { if (alive) setSurahs(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Load the Arabic text for each bookmarked surah (cached per surah)
  useEffect(() => {
    let alive = true;
    for (const g of groups) {
      if (texts[g.surah]) continue;
      loadSurahText(g.surah)
        .then((t) => { if (alive) setTexts((prev) => ({ ...prev, [g.surah]: t })); })
        .catch(() => {});
    }
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const metaOf = (n: number) => surahs.find((s) => s.number === n);
  const ayahText = (surah: number, ayah: number) => texts[surah]?.find((a) => a.numberInSurah === ayah);

  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Saved Ayat</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="bookmarks" />

        {/* sub-tabs: saved āyāt vs saved duʿās */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-slate-400/10">
          {([['ayat', `🔖 Āyāt${(summary?.bookmarks?.length ?? 0) > 0 ? ` · ${summary?.bookmarks?.length}` : ''}`], ['duas', `🤲 Duas${savedDuas.length > 0 ? ` · ${savedDuas.length}` : ''}`]] as const).map(([id, label]) => (
            <button key={id}
              onClick={() => setTab(id)}
              className={`flex-1 text-center text-xs font-bold py-1.5 rounded-lg transition-all ${tab === id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'}`}
            >{label}</button>
          ))}
        </div>

        {tab === 'duas' ? (
          isLoading ? (
            <div className="grid place-items-center py-12"><span className="loading loading-spinner loading-lg text-brand-emerald" /></div>
          ) : savedDuas.length === 0 ? (
            <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-10 text-center space-y-3">
              <div className="text-5xl">🤲</div>
              <p className="text-white font-black">No saved duʿās yet</p>
              <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                On the Quran page, tap the 🏷️ tag on any duʿā from the Quran to keep it here.
              </p>
              <button className="btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={() => navigate('/quran')}>Browse duas →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {savedDuas.map((d, i) => (
                <motion.div key={d.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl bg-brand-deep/80 border border-brand-border p-4 hover:border-brand-gold/30 transition-all"
                >
                  <button className="w-full text-left" onClick={() => navigate(`/quran/read/${d.surah}?start=${d.fromAyah}&end=${d.toAyah}&mode=bundle&dua=${d.id}`)}>
                    <p className="text-white/85 text-sm font-bold">{d.emoji} {d.title}</p>
                    <p className="text-brand-gold/50 text-[11px] mt-1">Quran {d.surah}:{d.fromAyah}{d.toAyah !== d.fromAyah ? `–${d.toAyah}` : ''} · read with its story →</p>
                  </button>
                  <div className="flex justify-end mt-1">
                    <button className="text-white/25 hover:text-red-300 text-xs" onClick={() => setPendingRemoveDua(d.id)}>🗑 remove</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : isLoading ? (
          <div className="grid place-items-center py-12"><span className="loading loading-spinner loading-lg text-brand-emerald" /></div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl bg-brand-deep/80 border border-brand-border p-10 text-center space-y-3">
            <div className="text-5xl">🔖</div>
            <p className="text-white font-black">No saved āyāt yet</p>
            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
              While reading, tap the bookmark icon on any āyah that touches your heart — it will wait for
              you here, organized by surah.
            </p>
            <button className="btn btn-sm rounded-xl border-0 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
              onClick={() => navigate('/quran/browse')}>Start reading →</button>
          </div>
        ) : (
          groups.map((g, gi) => {
            const meta = metaOf(g.surah);
            return (
              <motion.div
                key={g.surah}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}
                className="rounded-3xl bg-brand-deep/80 border border-brand-border p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-black text-sm">
                    {g.surah}. {meta?.englishName ?? `Surah ${g.surah}`}
                    <span className="text-white/30 font-normal"> · {g.items.length} saved</span>
                  </h2>
                  <span className="text-lg text-white/60 font-serif" dir="rtl">{meta?.name}</span>
                </div>
                <div className="space-y-2">
                  {g.items.map((b) => {
                    const a = ayahText(b.surah, b.ayah);
                    return (
                      <div key={`${b.surah}:${b.ayah}`} className="rounded-2xl bg-white/3 border border-slate-400/8 p-3.5 hover:border-brand-emerald/30 transition-all">
                        <button className="w-full text-left" onClick={() => navigate(`/quran/read/${b.surah}?start=${b.ayah}`)}>
                          <p className="text-brand-emerald text-[11px] font-black mb-1.5">Āyah {b.ayah} →</p>
                          {a ? (
                            <p dir="rtl" lang="ar" className="text-white/80 font-serif leading-[1.9] text-lg line-clamp-2">{a.arabic}</p>
                          ) : (
                            <span className="loading loading-dots loading-xs text-white/30" />
                          )}
                          {a?.translations?.[0] && (
                            <p className="text-white/40 text-xs mt-1.5 line-clamp-2">{a.translations[0]}</p>
                          )}
                        </button>
                        <div className="flex justify-end mt-1">
                          <button
                            aria-label={`Remove bookmark ${b.surah}:${b.ayah}`}
                            className="text-white/25 hover:text-red-300 text-xs"
                            onClick={() => setPendingRemove(b)}
                          >🗑 remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove this saved āyah?"
        message={pendingRemove ? `Surah ${pendingRemove.surah}, āyah ${pendingRemove.ayah} will be removed from your saved list.` : ''}
        confirmLabel="Yes, remove"
        onConfirm={() => { if (pendingRemove) toggleBookmark.mutate(pendingRemove); setPendingRemove(null); }}
        onCancel={() => setPendingRemove(null)}
      />

      <ConfirmDialog
        open={!!pendingRemoveDua}
        title="Remove this saved duʿā?"
        message="It stays in the Duas list on the Quran page — only your saved tag is removed."
        confirmLabel="Yes, remove"
        onConfirm={() => { if (pendingRemoveDua) toggleDua.mutate(pendingRemoveDua); setPendingRemoveDua(null); }}
        onCancel={() => setPendingRemoveDua(null)}
      />
    </AnimatedBackground>
  );
}
