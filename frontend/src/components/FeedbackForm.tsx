import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore.js';
import { celebrateSmall } from '../utils/celebrate.js';

/**
 * Shared interactive form for /feedback and /contact.
 *
 * Delivery uses Web3Forms — a free, backend-less form API: the browser POSTs
 * straight to their endpoint and they email the submission on. The access key
 * is a PUBLIC form identifier (not a secret), read from
 * VITE_WEB3FORMS_ACCESS_KEY. A honeypot field blocks the usual spam bots.
 */

export interface FormType {
  id: string;
  label: string;
  emoji: string;
  /** tailwind classes for the selected state */
  active: string;
  hint: string;
}

const ENDPOINT = 'https://api.web3forms.com/submit';

// Web3Forms access keys are PUBLIC form identifiers (they ship in the client
// bundle by design) — not secrets. Shared with the portfolio site; the subject
// line is prefixed "[Ihsan …]" so submissions are easy to tell apart.
const DEFAULT_ACCESS_KEY = '9ea1dea7-c9e9-428f-ad38-4dc061d2e057';

export default function FeedbackForm({
  kind,
  types,
  submitLabel = 'Send',
}: {
  kind: 'feedback' | 'contact';
  types: FormType[];
  submitLabel?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const accessKey = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined) || DEFAULT_ACCESS_KEY;

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [typeId, setTypeId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [botcheck, setBotcheck] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = types.find((t) => t.id === typeId) ?? null;
  const canSend = !!name.trim() && !!email.trim() && !!typeId && message.trim().length >= 10 && !sending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    if (!accessKey) {
      setError('The form isn\'t connected yet — please email us directly for now.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          from_name: 'Ihsan app',
          subject: `[Ihsan ${kind}] ${selected?.label ?? 'Message'}`,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          category: selected?.label ?? '',
          signed_in: user ? 'yes' : 'guest',
          botcheck,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) throw new Error(data.message ?? 'Failed');
      setSent(true);
      celebrateSmall();
    } catch {
      setError('Could not send right now — please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-brand-emerald/30 bg-brand-emerald/[0.07] p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: 0.1 }}
        >
          <CheckCircleIcon className="w-16 h-16 text-brand-emerald mx-auto" />
        </motion.div>
        <h2 className="text-white font-black text-xl mt-3">JazākAllāhu khayran! 💚</h2>
        <p className="text-white/55 text-sm mt-2 leading-relaxed max-w-md mx-auto">
          Your {kind === 'feedback' ? 'feedback' : 'message'} reached us. Every note genuinely shapes what
          Ihsan becomes next — and if it needs a reply, we'll write back to <b className="text-white/75">{email}</b>.
        </p>
        <button
          className="btn btn-sm mt-5 rounded-xl bg-white/5 border-emerald-500/15 text-white/70"
          onClick={() => { setSent(false); setMessage(''); setTypeId(''); }}
        >
          Send another
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* honeypot — hidden from humans, catches bots */}
      <input
        type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off"
        className="hidden" checked={!!botcheck} onChange={(e) => setBotcheck(e.target.checked ? 'bot' : '')}
      />

      {/* ── Type (required — becomes the subject) ── */}
      <div>
        <label className="text-white/70 text-sm font-bold">
          What's this about? <span className="text-red-400">*</span>
        </label>
        <p className="text-white/30 text-xs mt-0.5 mb-2.5">Pick one — it becomes the subject.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {types.map((t, i) => {
            const on = typeId === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTypeId(t.id)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  on ? t.active : 'bg-white/[0.03] border-emerald-500/12 text-white/60 hover:border-emerald-500/25 hover:text-white/80'
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <p className="font-bold text-sm mt-0.5">{t.label}</p>
                <p className={`text-[11px] mt-0.5 leading-snug ${on ? 'opacity-80' : 'text-white/30'}`}>{t.hint}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Name + email ── */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-white/70 text-sm font-bold" htmlFor="fb-name">
            Your name <span className="text-red-400">*</span>
          </label>
          <input
            id="fb-name" type="text" required value={name} readOnly={!!user?.displayName}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Abdullah"
            className={`input input-bordered w-full mt-1.5 bg-white/5 border-emerald-500/15 text-white ${user?.displayName ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label className="text-white/70 text-sm font-bold" htmlFor="fb-email">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="fb-email" type="email" required value={email} readOnly={!!user?.email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`input input-bordered w-full mt-1.5 bg-white/5 border-emerald-500/15 text-white ${user?.email ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
      {user && (
        <p className="text-white/25 text-[11px] -mt-2">
          Filled in from your account so we can reply to the right person.
        </p>
      )}

      {/* ── Message ── */}
      <div>
        <div className="flex items-end justify-between">
          <label className="text-white/70 text-sm font-bold" htmlFor="fb-msg">
            Tell us more <span className="text-red-400">*</span>
          </label>
          <span className={`text-[11px] ${message.trim().length >= 10 ? 'text-white/25' : 'text-brand-gold/60'}`}>
            {message.trim().length < 10 ? `${10 - message.trim().length} more characters` : `${message.length} characters`}
          </span>
        </div>
        <textarea
          id="fb-msg" required rows={6} value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          placeholder={
            kind === 'feedback'
              ? "What happened, or what would make Ihsan better for you? Steps to reproduce a bug are gold."
              : 'How can we help?'
          }
          className="textarea textarea-bordered w-full mt-1.5 bg-white/5 border-emerald-500/15 text-white leading-relaxed"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-400 text-sm"
          >{error}</motion.p>
        )}
      </AnimatePresence>

      {!accessKey && (
        <p className="text-brand-gold/70 text-xs rounded-xl border border-brand-gold/25 bg-brand-gold/5 p-3">
          ⚠️ This form needs <code className="text-white/70">VITE_WEB3FORMS_ACCESS_KEY</code> set before it can send.
        </p>
      )}

      <motion.button
        type="submit"
        whileTap={{ scale: 0.98 }}
        disabled={!canSend}
        className="w-full btn h-12 rounded-2xl border-0 text-white font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-90 disabled:opacity-40 gap-2"
      >
        {sending ? <span className="loading loading-spinner loading-sm" /> : <PaperAirplaneIcon className="w-5 h-5" />}
        {sending ? 'Sending…' : submitLabel}
      </motion.button>
      <p className="text-white/25 text-[11px] text-center">
        We only use what you send here to reply and improve Ihsan — never for anything else.
      </p>
    </form>
  );
}
