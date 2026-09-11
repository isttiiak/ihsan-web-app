import type { SendMailOptions } from './email.service.js';

// Donor-supplied strings (name, transaction ID) land inside HTML here with no
// framework escaping the way JSX would on the frontend — escape manually so
// a stray "<" or "&" in donor input can't break the email markup.
const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );

interface DonationEmailData {
  donorName: string | null;
  amount: number;
  transactionId: string;
}

const greeting = (donorName: string | null) =>
  donorName ? `Assalamu Alaikum ${escapeHtml(donorName)},` : 'Assalamu Alaikum,';

export const donationReceivedEmail = (d: DonationEmailData): Omit<SendMailOptions, 'to'> => ({
  subject: 'We received your sadaqah — JazakAllahu khayran',
  text: `${greeting(d.donorName)}\n\nWe've received your sadaqah submission of ${d.amount} BDT (transaction ${d.transactionId}). We'll verify it against our records within 24-48 hours and follow up once it's confirmed.\n\nMay Allah accept it from you and make it a means of ongoing reward, in sha Allah.\n\n— Bustandeen`,
  html: `<p>${greeting(d.donorName)}</p><p>We've received your sadaqah submission of <b>${d.amount} BDT</b> (transaction ${escapeHtml(d.transactionId)}). We'll verify it against our records within 24-48 hours and follow up once it's confirmed.</p><p>May Allah accept it from you and make it a means of ongoing reward, in sha Allah.</p><p>— Bustandeen</p>`,
});

export const donationVerifiedEmail = (d: DonationEmailData): Omit<SendMailOptions, 'to'> => ({
  subject: 'Your sadaqah has been verified — JazakAllahu khayran',
  text: `${greeting(d.donorName)}\n\nYour sadaqah of ${d.amount} BDT (transaction ${d.transactionId}) has been verified. JazakAllahu khayran for your generosity — may Allah make it a sadaqah jariyah, a continuing charity that keeps benefiting you.\n\nYou can see how contributions are being used at https://bustandeen.com/sadaqah\n\n— Bustandeen`,
  html: `<p>${greeting(d.donorName)}</p><p>Your sadaqah of <b>${d.amount} BDT</b> (transaction ${escapeHtml(d.transactionId)}) has been verified. JazakAllahu khayran for your generosity — may Allah make it a sadaqah jariyah, a continuing charity that keeps benefiting you.</p><p>You can see how contributions are being used at <a href="https://bustandeen.com/sadaqah">bustandeen.com/sadaqah</a>.</p><p>— Bustandeen</p>`,
});

export const donationRejectedEmail = (
  d: DonationEmailData & { reason: string }
): Omit<SendMailOptions, 'to'> => ({
  subject: "We couldn't verify your sadaqah submission",
  text: `${greeting(d.donorName)}\n\nWe weren't able to match your submission of ${d.amount} BDT (transaction ${d.transactionId}) against our records.\n\n${d.reason}\n\nThis is usually just a mismatched detail — please double-check the transaction ID and amount from your bKash SMS and resubmit at https://bustandeen.com/sadaqah/donate. If you believe this is a mistake, just reply to this email and we'll sort it out.\n\n— Bustandeen`,
  html: `<p>${greeting(d.donorName)}</p><p>We weren't able to match your submission of <b>${d.amount} BDT</b> (transaction ${escapeHtml(d.transactionId)}) against our records.</p><p>${escapeHtml(d.reason)}</p><p>This is usually just a mismatched detail — please double-check the transaction ID and amount from your bKash SMS and resubmit at <a href="https://bustandeen.com/sadaqah/donate">bustandeen.com/sadaqah/donate</a>. If you believe this is a mistake, just reply to this email and we'll sort it out.</p><p>— Bustandeen</p>`,
});
