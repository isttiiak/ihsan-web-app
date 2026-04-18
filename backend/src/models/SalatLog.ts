import mongoose, { Schema, Document } from 'mongoose';

export type PrayerStatus = 'completed' | 'kaza' | 'missed' | 'pending';
export type PrayerLocation = 'home' | 'mosque' | 'jamat';

export const NAFL_TYPE_IDS = [
  'tahajjud', 'ishraq', 'duha', 'awwabin', 'witr',
  'tahiyyat_wudu', 'tahiyyat_masjid', 'hajat', 'istikharah', 'tarawih',
] as const;
export type NaflType = (typeof NAFL_TYPE_IDS)[number];

export const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];

export interface IPrayerEntry {
  status: PrayerStatus;
  prayedAt?: Date;
  location?: PrayerLocation;
  tasbeeh?: boolean;
  ayatulKursi?: boolean;
}

export interface INaflEntry {
  completed: boolean;
  types: NaflType[];
  rakat: number;
  completedAt?: Date;
}

export interface ISalatLog extends Document {
  userId: string;
  date: string;
  prayers: Record<PrayerId, IPrayerEntry>;
  nafl: INaflEntry;
  createdAt: Date;
  updatedAt: Date;
}

const prayerEntrySchema = new Schema<IPrayerEntry>(
  {
    status: { type: String, enum: ['completed', 'kaza', 'missed', 'pending'], default: 'pending' },
    prayedAt: { type: Date },
    location: { type: String, enum: ['home', 'mosque', 'jamat'] },
    tasbeeh: { type: Boolean, default: false },
    ayatulKursi: { type: Boolean, default: false },
  },
  { _id: false }
);

const naflEntrySchema = new Schema<INaflEntry>(
  {
    completed: { type: Boolean, default: false },
    types: [{ type: String, enum: NAFL_TYPE_IDS }],
    rakat: { type: Number, default: 2, min: 2 },
    completedAt: { type: Date },
  },
  { _id: false }
);

const defaultEntry = (): IPrayerEntry => ({ status: 'pending' });
const defaultNafl = (): INaflEntry => ({ completed: false, types: [], rakat: 2 });

const salatLogSchema = new Schema<ISalatLog>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    prayers: {
      fajr:    { type: prayerEntrySchema, default: defaultEntry },
      dhuhr:   { type: prayerEntrySchema, default: defaultEntry },
      asr:     { type: prayerEntrySchema, default: defaultEntry },
      maghrib: { type: prayerEntrySchema, default: defaultEntry },
      isha:    { type: prayerEntrySchema, default: defaultEntry },
    },
    nafl: { type: naflEntrySchema, default: defaultNafl },
  },
  { timestamps: true }
);

salatLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<ISalatLog>('SalatLog', salatLogSchema);
