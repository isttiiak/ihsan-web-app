// Short "wooden bead click" sound played on each zikr tap. Uses a small pool
// of Audio elements (not one shared instance) since taps can happen faster
// than the clip's own ~50ms duration — a single instance would cut itself off
// mid-playback on rapid taps.
const POOL_SIZE = 4;
const VOLUME = 0.45;

let pool: HTMLAudioElement[] | null = null;
let poolIdx = 0;

function getPool(): HTMLAudioElement[] {
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio('/audio/click.wav');
      audio.preload = 'auto';
      audio.volume = VOLUME;
      return audio;
    });
  }
  return pool;
}

export function playZikrClick(): void {
  const p = getPool();
  const audio = p[poolIdx];
  poolIdx = (poolIdx + 1) % p.length;
  if (!audio) return;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Autoplay can be blocked before any user gesture has registered yet —
    // safe to ignore, the next tap (a real gesture) will succeed.
  });
}
