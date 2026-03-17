import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  linkWithPopup,
  GithubAuthProvider,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { trackLogin, trackLogout } from "../analytics";

const AuthContext = createContext();

const githubProvider = new GithubAuthProvider();
const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pendingCred, setPendingCred] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAuthError = (error, providerName) => {
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

  const loginWithGithub = () =>
    signInWithPopup(auth, githubProvider)
      .then((result) => {
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
    signInWithPopup(auth, googleProvider)
      .then((result) => {
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

  const logout = () => signOut(auth).then(() => trackLogout());

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGithub, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
