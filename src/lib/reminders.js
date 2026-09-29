// Scheduled reminders, set on the phone itself. No server, no push service,
// no Firebase plan upgrade. Every function no-ops on the web, where browsers
// cannot schedule their own notifications at all.
//
// IDs are in fixed ranges so a reschedule can cancel exactly its own
// notifications without touching the others.
import { isNative } from './native';

const DAILY_ID = 1001;
const DUE_MIN = 2000;
const DUE_MAX = 2999;
const DAY = 86400000;

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function notificationsAvailable() {
  if (!isNative()) return false;
  try { await plugin(); return true; } catch { return false; }
}

// Returns 'granted', 'denied', or 'unavailable'. Android 13 and up needs an
// explicit permission; older versions grant it at install.
export async function requestPermission() {
  if (!isNative()) return 'unavailable';
  try {
    const LN = await plugin();
    let p = await LN.checkPermissions();
    if (p.display === 'prompt' || p.display === 'prompt-with-rationale') {
      p = await LN.requestPermissions();
    }
    return p.display === 'granted' ? 'granted' : 'denied';
  } catch { return 'unavailable'; }
}

export async function permissionState() {
  if (!isNative()) return 'unavailable';
  try {
    const LN = await plugin();
    const p = await LN.checkPermissions();
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt';
  } catch { return 'unavailable'; }
}

async function cancelRange(min, max) {
  const LN = await plugin();
  const pending = await LN.getPending();
  const hits = (pending.notifications || []).filter(n => n.id >= min && n.id <= max);
  if (hits.length) await LN.cancel({ notifications: hits.map(n => ({ id: n.id })) });
}

// A repeating daily reminder at a set hour and minute.
export async function scheduleDaily(hour, minute, body) {
  if (!isNative()) return false;
  try {
    const LN = await plugin();
    await cancelRange(DAILY_ID, DAILY_ID);
    await LN.schedule({
      notifications: [{
        id: DAILY_ID,
        title: 'MiFi',
        body: body || 'Log today before it blurs. Twenty seconds.',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        smallIcon: 'ic_stat_mifi',
        iconColor: '#21d4e0',
      }],
    });
    return true;
  } catch { return false; }
}

export async function cancelDaily() {
  if (!isNative()) return;
  try { await cancelRange(DAILY_ID, DAILY_ID); } catch {}
}

/**
 * Reminders for recurring items, fired at 9am the day before each is due.
 *
 * items: [{ id, label, amount, currency, due }] where due is a timestamp.
 * The label goes in the notification, so it reads "Rent due tomorrow,
 * ₦200,000" rather than "open MiFi", which nobody acts on.
 *
 * Rescheduled from scratch each time, because a recurring item's due date
 * moves every time it is logged or skipped.
 */
export async function scheduleDueReminders(items = []) {
  if (!isNative()) return 0;
  try {
    const LN = await plugin();
    await cancelRange(DUE_MIN, DUE_MAX);
    const now = Date.now();
    const list = [];
    items.slice(0, 40).forEach((it, i) => {
      const due = Number(it.due);
      if (!Number.isFinite(due)) return;
      const at = new Date(due - DAY);
      at.setHours(9, 0, 0, 0);
      // Anything already past is skipped. Scheduling a notification in the
      // past either fires immediately or is silently dropped, and both are
      // worse than nothing.
      if (at.getTime() <= now + 60000) return;
      list.push({
        id: DUE_MIN + i,
        title: 'Due tomorrow',
        body: it.label,
        schedule: { at, allowWhileIdle: true },
        smallIcon: 'ic_stat_mifi',
        iconColor: '#21d4e0',
      });
    });
    if (list.length) await LN.schedule({ notifications: list });
    return list.length;
  } catch { return 0; }
}

export async function cancelDueReminders() {
  if (!isNative()) return;
  try { await cancelRange(DUE_MIN, DUE_MAX); } catch {}
}

export async function cancelAll() {
  if (!isNative()) return;
  try { await cancelRange(0, 9999); } catch {}
}

// What is actually queued, for showing the user rather than claiming.
export async function pendingCount() {
  if (!isNative()) return 0;
  try {
    const LN = await plugin();
    const p = await LN.getPending();
    return (p.notifications || []).length;
  } catch { return 0; }
}
