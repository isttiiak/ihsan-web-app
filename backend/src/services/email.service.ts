import nodemailer, { Transporter } from 'nodemailer';

/**
 * Generic SMTP transport — the app's first backend-originated email
 * capability (Feedback/Contact send client-side via Web3Forms, which can't
 * be triggered from an admin action). No-ops with a warning if ZOHO_SMTP_*
 * is unset, so a missing/misconfigured mail setup degrades gracefully
 * instead of blocking the feature that triggered it — same tolerance this
 * app already gives an unset GROQ_API_KEY.
 */
let transporter: Transporter | null | undefined;

const getTransporter = (): Transporter | null => {
  if (transporter !== undefined) return transporter;

  const { ZOHO_SMTP_HOST, ZOHO_SMTP_PORT, ZOHO_SMTP_USER, ZOHO_SMTP_PASS } = process.env;
  if (!ZOHO_SMTP_HOST || !ZOHO_SMTP_PORT || !ZOHO_SMTP_USER || !ZOHO_SMTP_PASS) {
    console.warn('Email not configured (ZOHO_SMTP_* env vars missing) — emails will be skipped.');
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: ZOHO_SMTP_HOST,
    port: Number(ZOHO_SMTP_PORT),
    secure: Number(ZOHO_SMTP_PORT) === 465,
    auth: { user: ZOHO_SMTP_USER, pass: ZOHO_SMTP_PASS },
  });
  return transporter;
};

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Explicit Message-ID for this send (angle-bracket form, e.g.
   *  "<sadaqah-<id>@bustandeen.com>") — set on the FIRST email in a thread so
   *  later replies can reference it via inReplyTo/references. */
  messageId?: string;
  /** Threads this send as a reply in the recipient's mail client (Gmail,
   *  Outlook) so a donation's received/verified/rejected emails group into
   *  one conversation instead of three separate ones. */
  inReplyTo?: string;
  references?: string;
}

/**
 * Always awaited by callers before they respond to the client — Vercel can
 * freeze a serverless function right after the response is sent, so a
 * fire-and-forget send here would intermittently just never go out. Never
 * throws: a failed/unsent email should not fail the request that triggered
 * it (the donation record is already the source of truth either way).
 *
 * Returns the Message-ID actually used (nodemailer generates one when
 * `messageId` isn't passed), or null if nothing was sent/it failed — the
 * caller can store this to thread later replies against it.
 */
export const sendMail = async (opts: SendMailOptions): Promise<string | null> => {
  const t = getTransporter();
  if (!t) return null;
  try {
    const info = await t.sendMail({
      from: `"Bustandeen" <${process.env.ZOHO_SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      messageId: opts.messageId,
      inReplyTo: opts.inReplyTo,
      references: opts.references,
    });
    return info.messageId ?? null;
  } catch (err) {
    console.error('Failed to send email:', err);
    return null;
  }
};
