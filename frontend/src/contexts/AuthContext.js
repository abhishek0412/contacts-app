import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  linkWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  GithubAuthProvider,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import { trackLogin, trackLogout } from "../analytics";

const AuthContext = createContext();

const githubProvider = new GithubAuthProvider();
const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pendingCred, setPendingCred] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const requireFirebaseConfig = () => {
    if (isFirebaseConfigured && auth) return;
    throw new Error(
      "Firebase authentication is not configured. Set REACT_APP_FIREBASE_* variables and rebuild the frontend image.",
    );
  };

  const handleAuthError = (error, providerName) => {
    if (error.code === "auth/popup-blocked") {
      throw new Error(
        "Login popup was blocked by the browser. Allow popups for this site and try again.",
      );
    }

    if (error.code === "auth/unauthorized-domain") {
      throw new Error(
        "This domain is not authorized for Firebase Auth. Add localhost in Firebase Console -> Authentication -> Settings -> Authorized domains.",
      );
    }

    if (error.code === "auth/operation-not-allowed") {
      throw new Error(
        `The ${providerName} provider is disabled in Firebase Auth. Enable it in Firebase Console -> Authentication -> Sign-in method.`,
      );
    }

    if (error.code === "auth/account-exists-with-different-credential") {
      const credential =
        providerName === "github"
          ? GithubAuthProvider.credentialFromError(error)
          : GoogleAuthProvider.credentialFromError(error);
      setPendingCred(credential);
      const existingProvider = providerName === "github" ? "Google" : "GitHub";
      throw new Error(
        `This email is already registered with ${existingProvider}. Please sign in with ${existingProvider} first to link your accounts.`,
      );
    }
    throw error;
  };

  const signInWithProvider = (provider, providerName) =>
    signInWithPopup(auth, provider).catch((error) => {
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/operation-not-supported-in-this-environment"
      ) {
        return signInWithRedirect(auth, provider).then(() => null);
      }
      return Promise.reject(error);
    });

  const loginWithGithub = () =>
    Promise.resolve()
      .then(() => requireFirebaseConfig())
      .then(() => signInWithProvider(githubProvider, "github"))
      .then((result) => {
        if (!result) return result;
        trackLogin("github");
        if (pendingCred) {
          return linkWithPopup(
            result.user,
            pendingCred.providerId === "github.com"
              ? githubProvider
              : googleProvider,
          ).then(() => {
            setPendingCred(null);
            return result;
          });
        }
        return result;
      })
      .catch((error) => handleAuthError(error, "github"));

  const loginWithGoogle = () =>
    Promise.resolve()
      .then(() => requireFirebaseConfig())
      .then(() => signInWithProvider(googleProvider, "google"))
      .then((result) => {
        if (!result) return result;
        trackLogin("google");
        if (pendingCred) {
          return linkWithPopup(
            result.user,
            pendingCred.providerId === "github.com"
              ? githubProvider
              : googleProvider,
          ).then(() => {
            setPendingCred(null);
            return result;
          });
        }
        return result;
      })
      .catch((error) => handleAuthError(error, "google"));

  const signUp = async (email, password, displayName) => {
    requireFirebaseConfig();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await sendEmailVerification(result.user);
    trackLogin('email-signup');
    return result;
  };

  const signInWithEmail = async (email, password) => {
    requireFirebaseConfig();
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
      await signOut(auth);
      throw new Error('Please verify your email before signing in. A new verification link has been sent.');
    }
    trackLogin('email');
    return result;
  };

  const resetPassword = async (email) => {
    requireFirebaseConfig();
    await sendPasswordResetEmail(auth, email);
  };

  const logout = () => {
    if (!auth) return Promise.resolve();
    return signOut(auth).then(() => trackLogout());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGithub,
        loginWithGoogle,
        signUp,
        signInWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
