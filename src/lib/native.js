// Native shell behaviour. Every function here is a no-op on the web, so the
// Vercel build is completely unaffected by any of it.
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

// Android's back button closes the app by default, from any screen. That is
// wrong for a tabbed app: back should return to Home first, and only exit
// from there.
export function wireBackButton({ getView, setView, home = 'dashboard' }) {
  if (!isNative()) return () => {};
  let handle;
  CapApp.addListener('backButton', ({ canGoBack }) => {
    const view = getView();
    if (view !== home) { setView(home); return; }
    if (canGoBack && window.history.length > 1) { window.history.back(); return; }
    CapApp.exitApp();
  }).then((h) => { handle = h; }).catch(() => {});
  return () => { try { handle && handle.remove(); } catch {} };
}

// Match the status bar to the app's navy so the top of the screen does not
// sit in a default white or black strip.
export function styleStatusBar(isDark) {
  if (!isNative()) return;
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: isDark ? '#04111b' : '#eef5f5' }).catch(() => {});
}
