import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  usePushPreferences,
  useSubscribeToPush,
  useUnsubscribeFromPush,
  useUpdatePushPreferences,
  type PushCategories,
} from '../hooks/usePush.js';
import { isPushSupported } from '../utils/push.js';

function SettingToggle({
  checked,
  onChange,
  disabled,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex items-center gap-4 p-3 rounded-xl border border-brand-border bg-brand-deep/50 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-emerald/20'
      }`}
    >
      <input
        type="checkbox"
        className="toggle toggle-success"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="min-w-0">
        <p className="font-semibold text-white/80 text-sm">{title}</p>
        <p className="text-white/30 text-xs leading-snug">{detail}</p>
      </div>
    </label>
  );
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { data, isLoading } = usePushPreferences();
  const subscribeMut = useSubscribeToPush();
  const unsubscribeMut = useUnsubscribeFromPush();
  const updateMut = useUpdatePushPreferences();
  const [permissionDenied, setPermissionDenied] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'denied'
  );

  if (!isPushSupported()) {
    return (
      <p className="text-white/30 text-xs leading-relaxed">
        {t('settings.notificationsUnsupported', "Your browser doesn't support push notifications.")}
      </p>
    );
  }

  if (isLoading) return null;

  const subscribed = !!data?.subscribed;
  const pending = subscribeMut.isPending || unsubscribeMut.isPending;

  // The master toggle IS the permission control — flipping it on requests OS
  // notification permission (via the browser's native prompt) and subscribes
  // this device; flipping it off fully unsubscribes and deletes the
  // subscription server-side (see useUnsubscribeFromPush). There's no
  // separate "ask me later" step: nothing is ever created without this
  // explicit action, and turning it off leaves nothing behind.
  const handleToggle = async (wantOn: boolean) => {
    if (wantOn) {
      try {
        await subscribeMut.mutateAsync(undefined);
        toast.success(t('settings.notificationsEnabled', 'Notifications enabled'));
      } catch {
        const nowDenied =
          typeof Notification !== 'undefined' && Notification.permission === 'denied';
        setPermissionDenied(nowDenied);
        if (!nowDenied) {
          toast.error(t('settings.notificationsFailed', 'Could not enable notifications'));
        }
      }
    } else {
      await unsubscribeMut.mutateAsync();
      toast.success(t('settings.notificationsDisabled', 'Notifications turned off'));
    }
  };

  const setCategory = (key: keyof PushCategories, value: boolean) => {
    void updateMut.mutate({ [key]: value });
  };

  return (
    <div className="space-y-3">
      <SettingToggle
        checked={subscribed}
        onChange={(v) => void handleToggle(v)}
        disabled={pending || (permissionDenied && !subscribed)}
        title={t('settings.notificationsSection', 'Notifications')}
        detail={
          subscribed
            ? t('settings.notificationsOnDetail', "On for this device — tune what you'll get below")
            : t(
                'settings.notificationsPrimer',
                "Get a gentle nudge when today's streak needs you, an evening reminder for dhikr, and a weekly summary of your worship — all optional, all from this device only."
              )
        }
      />

      {permissionDenied && !subscribed && (
        <p className="text-brand-gold/80 text-xs leading-relaxed px-1">
          {t(
            'settings.notificationsBlocked',
            "Notifications are blocked for this site in your browser. Re-enable them from your browser's site settings, then reload this page."
          )}
        </p>
      )}

      {subscribed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-3 border-l-2 border-brand-emerald/15">
          <SettingToggle
            checked={data!.categories.streakAtRisk}
            onChange={(v) => setCategory('streakAtRisk', v)}
            title={t('settings.notifStreak', 'Streak reminders')}
            detail={t(
              'settings.notifStreakDetail',
              "An evening nudge if today's goal isn't met yet"
            )}
          />
          <SettingToggle
            checked={data!.categories.adhkarWindows}
            onChange={(v) => setCategory('adhkarWindows', v)}
            title={t('settings.notifAdhkar', 'Adhkar reminders')}
            detail={t('settings.notifAdhkarDetail', 'A general evening reminder for dhikr')}
          />
          <SettingToggle
            checked={data!.categories.weeklySummary}
            onChange={(v) => setCategory('weeklySummary', v)}
            title={t('settings.notifWeekly', 'Weekly summary')}
            detail={t('settings.notifWeeklyDetail', 'A recap of your week, once on Fridays')}
          />
        </div>
      )}
    </div>
  );
}
