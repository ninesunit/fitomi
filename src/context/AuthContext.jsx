import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext(null);

/** Firebase's error codes are not something to show a hunter mid-workout. */
const AUTH_ERRORS = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No hunter registered with that email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'That email is already registered. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/popup-closed-by-user': 'Sign-in window closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup.',
  'auth/cancelled-popup-request': 'Sign-in already in progress.',
  'auth/network-request-failed': 'Network unreachable. Check your connection.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for the project.',
};

export const authMessage = (error) =>
  AUTH_ERRORS[error?.code] || error?.message?.replace('Firebase: ', '') || 'Something went wrong.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when the Firebase project has no Auth configuration at all — a
  // deployment problem, not a user problem, so it gets its own screen.
  const [unconfigured, setUnconfigured] = useState(false);
  const [redirectError, setRedirectError] = useState(null);

  // When the popup is blocked we fall back to a full-page redirect. Reading the
  // result on mount is what surfaces a failure from that leg — otherwise a
  // rejected redirect just lands back on the sign-in screen with no explanation.
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      if (error?.code === 'auth/configuration-not-found') setUnconfigured(true);
      setRedirectError(error);
    });
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (next) => {
          setUser(next);
          setLoading(false);
        },
        (error) => {
          if (error?.code === 'auth/configuration-not-found') setUnconfigured(true);
          setLoading(false);
        },
      ),
    [],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      unconfigured,
      redirectError,
      reportAuthError: (error) => {
        if (error?.code === 'auth/configuration-not-found') setUnconfigured(true);
      },

      async signIn(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        return cred.user;
      },

      async signUp(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        return cred.user;
      },

      async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          const cred = await signInWithPopup(auth, provider);
          return cred.user;
        } catch (error) {
          // Popups are blocked outright in some in-app browsers (Instagram,
          // Messenger) and in strict privacy modes — fall back to a redirect
          // rather than dead-ending the only social sign-in option.
          if (
            error?.code === 'auth/popup-blocked' ||
            error?.code === 'auth/operation-not-supported-in-this-environment'
          ) {
            await signInWithRedirect(auth, provider);
            return null;
          }
          throw error;
        }
      },

      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim());
      },

      async updateDisplayName(name) {
        if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
      },

      signOut: () => signOut(auth),
    }),
    [user, loading, unconfigured, redirectError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
