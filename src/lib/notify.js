// ---------------------------------------------------------------------------
// System notifications.
//
// A rest timer is useless if it only fires while you are staring at it. When
// the app is backgrounded — phone in a pocket between sets — a real
// notification is the only thing that reaches the user.
//
// On iOS this needs 16.4 or newer AND the app installed to the home screen;
// Safari tabs cannot receive them at all. Everything here degrades quietly
// rather than nagging on a device that will never deliver.
// ---------------------------------------------------------------------------

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

/** Ask once, from a user gesture — browsers reject the request otherwise. */
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Show a notification.
 *
 * Routed through the service worker registration when one exists: on Android
 * and in installed PWAs the page-level `new Notification()` constructor is
 * unavailable, and `showNotification` is the supported path.
 */
export async function notify(title, options = {}) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;

  const payload = {
    body: options.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: options.tag || 'fitomi',
    renotify: true,
    silent: false,
    vibrate: options.vibrate ?? [120, 60, 120],
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, payload);
        return true;
      }
    }
    new Notification(title, payload);
    return true;
  } catch {
    return false;
  }
}
