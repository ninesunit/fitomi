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

// ---------------------------------------------------------------------------
// Update lifecycle.
//
// An installed home-screen app is resumed, not reloaded — real navigations are
// rare, so the browser's own update check almost never runs and the app can sit
// on a months-old build indefinitely. This checks explicitly: on registration,
// every time the app comes back to the foreground, and hourly while it is open.
// ---------------------------------------------------------------------------

let waitingWorker = null;
const updateListeners = new Set();

/** Notified when a new build is downloaded and waiting to take over. */
export function onUpdateReady(callback) {
  updateListeners.add(callback);
  if (waitingWorker) callback();
  return () => updateListeners.delete(callback);
}

function announceUpdate(worker) {
  waitingWorker = worker;
  for (const listener of updateListeners) listener();
}

/** Hand control to the new worker and reload onto it. */
export function applyUpdate() {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  // The reload happens on controllerchange, below.
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
    } catch {
      return; // an unavailable worker is not worth surfacing
    }

    // Already waiting from a previous visit.
    if (registration.waiting && navigator.serviceWorker.controller) {
      announceUpdate(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        // `controller` being set means this is an update, not a first install.
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          announceUpdate(installing);
        }
      });
    });

    // Reload exactly once when the new worker takes over.
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    const check = () => registration.update().catch(() => {});
    check();
    // The moment the app is brought back to the foreground.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    window.addEventListener('focus', check);
    // And a slow poll for a session left open all day.
    setInterval(check, 60 * 60 * 1000);
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
