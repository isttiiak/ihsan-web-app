import mongoose, { Schema, Document } from 'mongoose';

/** Standard Madani mushaf page count */
export const QURAN_TOTAL_PAGES = 604;
/** Total ayat in the Quran (Kufan count — the standard numbering) */
export const QURAN_TOTAL_AYAT = 6236;

export interface IQuranProfile extends Document {
  userId: string;
  /** Daily reading goal in pages */
  dailyGoalPages: number;
  /** Pages completed of the current khatm (0..603); reaching 604 completes it */
  currentPage: number;
  /** Number of complete read-throughs */
  khatmCount: number;
  /** Daily reading goal in AYAT (v4 engine; ~10 ayat ≈ 1 page). Default 0 —
   * fully OPT-IN (Istiak's spec): the user sets it themselves in settings. */
  dailyGoalAyat: number;
  /** Global ayah index of the khatam bookmark (0..6235) */
  currentAyah: number;
  /** When the user explicitly began their khatam journey (opt-in); null = not started */
  khatamStartedAt: Date | null;
  /** Reader resume positions per surah ("1".."114" → ayah) — server-side so
   * "continue where you left off" is consistent across devices */
  readerPos: Map<string, number>;
  /** Saved duʿā ids from the curated "Duas from the Quran" list */
  savedDuas: string[];
  /** Times each surah has been read to the end ("1".."114") — powers the
   * "top surahs" list (completions, not raw ayat). */
  surahCounts: Map<string, number>;
  /** Saved ayat [{surah, ayah}] — capped at 100 */
  bookmarks: Array<{ surah: number; ayah: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const quranProfileSchema = new Schema<IQuranProfile>(
  {
    userId: { type: String, required: true, unique: true },
    dailyGoalPages: { type: Number, default: 2, min: 1, max: 604 },
    currentPage: { type: Number, default: 0, min: 0, max: QURAN_TOTAL_PAGES - 1 },
    khatmCount: { type: Number, default: 0, min: 0 },
    dailyGoalAyat: { type: Number, default: 0, min: 0, max: 6236 },
    currentAyah: { type: Number, default: 0, min: 0, max: 6235 },
    khatamStartedAt: { type: Date, default: null },
    readerPos: { type: Map, of: Number, default: {} },
    savedDuas: { type: [String], default: [] },
    surahCounts: { type: Map, of: Number, default: {} },
    bookmarks: {
      type: [{ surah: { type: Number, min: 1, max: 114 }, ayah: { type: Number, min: 1, max: 286 }, _id: false }],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IQuranProfile>('QuranProfile', quranProfileSchema);
