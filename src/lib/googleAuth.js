// Native Google sign-in.
//
// Google refuses to serve its sign-in page inside an app's embedded browser,
// so signInWithPopup cannot work in the APK. On Android we ask Google Play
// Services instead, which already knows the accounts on the phone, and hand
// the resulting token to the Firebase JS SDK.
//
// skipNativeAuth is on, so the plugin only performs the Google sign-in and
// returns a token. The JS SDK stays the single source of auth state, which is
// what the rest of the app listens to. Two SDKs both holding auth state is a
// good way to get a user who is signed in according to one and not the other.
//
// Every export here is web-safe: on the web they throw a clear error rather
// than touching a plugin that does not exist.
import { GoogleAuthProvider, signInWithCredential, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import { isNative } from './native';

async function googleCredential() {
  if (!isNative()) throw new Error('Native Google sign-in is only available in the app.');
  // Imported lazily so the plugin never loads in the browser bundle.
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result && result.credential && result.credential.idToken;
  if (!idToken) {
    const e = new Error('Google did not return a sign-in token.');
    e.code = 'auth/no-id-token';
    throw e;
  }
  return GoogleAuthProvider.credential(idToken, result.credential.accessToken);
}

export async function nativeGoogleSignIn() {
  return signInWithCredential(auth, await googleCredential());
}

export async function nativeGoogleReauth() {
  return reauthenticateWithCredential(auth.currentUser, await googleCredential());
}

// Sign out of the native Google session too. Without this the account chooser
// is skipped next time and the user cannot switch accounts.
export async function nativeSignOut() {
  if (!isNative()) return;
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    await FirebaseAuthentication.signOut();
  } catch { /* the JS sign-out is what matters; this is housekeeping */ }
}
