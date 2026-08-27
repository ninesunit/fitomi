// ---------------------------------------------------------------------------
// Install / standalone helpers.
//
// iOS gives web apps no install API at all — no `beforeinstallprompt`, no
// programmatic trigger. The only route onto an iPhone home screen is the user
// tapping Share → Add to Home Screen, so the app has to detect iOS Safari and
// *tell them how*, rather than waiting for an event that will never fire.
// ---------------------------------------------------------------------------

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Safari's own non-standard flag, still the only reliable iOS signal.
    window.navigator.standalone === true
  );
}

export function isIos() {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as a Mac; the touch-point check separates them.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isSafari() {
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Registered after load so it never competes with the first paint.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* an unavailable worker is not worth surfacing — the app works without it */
    });
  });
}

const DISMISS_KEY = 'fitomi:install-dismissed';

export function installPromptDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    // Re-offer after a fortnight rather than never again.
    return at && Date.now() - at < 14 * 86400000;
  } catch {
    return false;
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
