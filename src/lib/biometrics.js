// Biometric app lock.
//
// This does NOT authenticate against Firebase. Your fingerprint is not a
// password and cannot be sent anywhere. What it does is gate an already
// signed-in session on this device: after the app has been idle, the screen
// covers itself and only a matching fingerprint or face uncovers it.
//
// The alternative, signing out after five minutes, means retyping a password
// a dozen times a day. People stop opening the app instead. A lock protects
// the same screen for a tap.
//
// No-ops on the web, where there is nothing to lock and no sensor to ask.
import { isNative } from './native';

async function plugin() {
  const { BiometricAuth, BiometryType } = await import('@aparajita/capacitor-biometric-auth');
  return { BiometricAuth, BiometryType };
}

// { available, reason, label } where label is what to call it on screen,
// because "use biometrics" is not how anyone thinks about their own thumb.
export async function biometricStatus() {
  if (!isNative()) return { available: false, reason: 'web', label: null };
  try {
    const { BiometricAuth, BiometryType } = await plugin();
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable) {
      return {
        available: false,
        reason: info.reason || 'unavailable',
        // Distinguish "this phone cannot" from "you have not set one up",
        // because only one of those is worth telling the user to fix.
        notEnrolled: info.reason === 'biometryNotEnrolled',
        label: null,
      };
    }
    const label =
      info.biometryType === BiometryType.faceId ? 'Face ID'
      : info.biometryType === BiometryType.faceAuthentication ? 'face unlock'
      : info.biometryType === BiometryType.irisAuthentication ? 'iris unlock'
      : 'fingerprint';
    return { available: true, reason: null, label, type: info.biometryType };
  } catch {
    return { available: false, reason: 'error', label: null };
  }
}

/**
 * Ask for a fingerprint or face. Resolves { ok: true } on success.
 * On failure, ok is false and `cancelled` says whether the person backed out
 * (so we can leave them on the lock screen) rather than failing a match.
 */
export async function verifyIdentity(label = 'fingerprint') {
  if (!isNative()) return { ok: false, cancelled: false, reason: 'web' };
  try {
    const { BiometricAuth } = await plugin();
    await BiometricAuth.authenticate({
      reason: 'Unlock MiFi',
      cancelTitle: 'Use password',
      androidTitle: 'Unlock MiFi',
      androidSubtitle: `Confirm it is you with your ${label}`,
      allowDeviceCredential: true,
      androidConfirmationRequired: false,
    });
    return { ok: true, cancelled: false };
  } catch (e) {
    const code = e && (e.code || e.message) || '';
    const cancelled = /cancel|userCancel|systemCancel|appCancel/i.test(String(code));
    return { ok: false, cancelled, reason: String(code) };
  }
}
