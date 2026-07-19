// Tafsir editions available in the reader — real scholarly tafsir sourced from
// api.quran.com (proxied by our backend). Ids match the quran.com resource ids.

export interface TafsirEdition {
  id: number;
  name: string;
  language: 'en' | 'bn';
}

export const TAFSIRS: TafsirEdition[] = [
  { id: 169, name: 'Ibn Kathir (Abridged)', language: 'en' },
  { id: 168, name: "Ma'arif al-Qur'an", language: 'en' },
  { id: 817, name: 'Tazkirul Quran', language: 'en' },
  { id: 164, name: 'তাফসীর ইবনে কাসীর', language: 'bn' },
  { id: 165, name: 'তাফসীর আহসানুল বায়ান', language: 'bn' },
  { id: 166, name: 'তাফসীর আবু বকর জাকারিয়া', language: 'bn' },
];

const KEY = 'ihsan_tafsir_edition';

export function getPreferredTafsir(): number {
  const n = Number(localStorage.getItem(KEY));
  return TAFSIRS.some((t) => t.id === n) ? n : 169;
}
export function setPreferredTafsir(id: number): void {
  localStorage.setItem(KEY, String(id));
}
