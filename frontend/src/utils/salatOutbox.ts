import type { UpdatePrayerVars, UpdateNaflVars } from '../hooks/useSalatLog.js';

// Offline outbox for salat prayer/nafl updates. Unlike the zikr counter,
// salat status changes had zero local persistence — a network failure while
// tapping "Done" just silently rolled the optimistic UI back and lost the
// tap. This queues the PATCH so it can be replayed once the connection
// returns, instead of asking the user to notice and re-tap.
const STORAGE_KEY = 'ihsan_salat_outbox';

interface QueuedPrayerOp {
  id: string;
  kind: 'prayer';
  vars: UpdatePrayerVars;
  queuedAt: number;
}
interface QueuedNaflOp {
  id: string;
  kind: 'nafl';
  vars: UpdateNaflVars;
  queuedAt: number;
}
export type QueuedSalatOp = QueuedPrayerOp | QueuedNaflOp;

// A manual union of two Omits (rather than `Omit<QueuedSalatOp, ...>`) so the
// discriminant stays tied to the right `vars` shape — Omit collapses a
// discriminated union into `{ kind: 'prayer' | 'nafl'; vars: A | B }`, which
// loses the correlation and breaks narrowing on `op.kind`.
type NewSalatOp = Omit<QueuedPrayerOp, 'id' | 'queuedAt'> | Omit<QueuedNaflOp, 'id' | 'queuedAt'>;

function readQueue(): QueuedSalatOp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSalatOp[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSalatOp[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full — the optimistic UI is still correct in memory; the next
     * successful flush will just have less to replay than intended */
  }
}

// One queued op per (kind, date, target field) — a later tap on the same
// prayer/nafl entry replaces the earlier queued one rather than stacking,
// since each op already carries the FULL desired end state, not a delta.
function opKey(op: NewSalatOp): string {
  return op.kind === 'prayer'
    ? `prayer:${op.vars.date ?? ''}:${op.vars.prayer}`
    : `nafl:${op.vars.date ?? ''}`;
}

export function enqueueSalatOp(op: NewSalatOp): void {
  const key = opKey(op);
  const queue = readQueue().filter((existing) => opKey(existing) !== key);
  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: Date.now(),
  } as QueuedSalatOp);
  writeQueue(queue);
}

export function peekSalatOutbox(): QueuedSalatOp[] {
  return readQueue();
}

export function getSalatOutboxSize(): number {
  return readQueue().length;
}

export function removeSalatOp(id: string): void {
  writeQueue(readQueue().filter((op) => op.id !== id));
}
