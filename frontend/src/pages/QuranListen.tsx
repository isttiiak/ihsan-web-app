import AnimatedBackground from '../components/AnimatedBackground.js';
import QuranTabNav from '../components/QuranTabNav.js';
import QuranAudioPlayer from '../components/QuranAudioPlayer.js';

/** Dedicated listening room — full-surah recitation with the sound controls. */
export default function QuranListen() {
  return (
    <AnimatedBackground variant="dark">
      <h1 className="sr-only">Listen to the Quran</h1>
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <QuranTabNav active="listen" />
        <QuranAudioPlayer />
        <p className="text-white/30 text-[11px] leading-relaxed px-1">
          🌸 Listening is beloved in every state — the Prophet ﷺ loved to hear the Quran from others
          (<a className="underline" href="https://sunnah.com/bukhari:5049" target="_blank" rel="noreferrer">Bukhārī 5049</a>).
          Every ~3 minutes of listening counts toward your daily goal and streak.
        </p>
      </div>
    </AnimatedBackground>
  );
}
