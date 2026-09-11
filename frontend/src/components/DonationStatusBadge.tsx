import { useTranslation } from 'react-i18next';
import type { DonationStatus } from '../types/api.js';

const STYLES: Record<DonationStatus, string> = {
  pending: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
  verified: 'bg-brand-emerald/15 text-brand-emerald border-brand-emerald/30',
  rejected: 'bg-red-500/15 text-red-300 border-red-400/30',
};

export default function DonationStatusBadge({ status }: { status: DonationStatus }) {
  const { t } = useTranslation();
  const labels: Record<DonationStatus, string> = {
    pending: t('adminSadaqah.statusPending', 'Pending'),
    verified: t('adminSadaqah.statusVerified', 'Verified'),
    rejected: t('adminSadaqah.statusRejected', 'Rejected'),
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${STYLES[status]}`}
    >
      {labels[status]}
    </span>
  );
}
