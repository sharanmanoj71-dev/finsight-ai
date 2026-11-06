import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "../services/firebase";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    // Check for saved demo/local user session first
    const savedUserJson = localStorage.getItem("finsight_user");
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("finsight_user");
      }
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("finsight_auth_token", token);
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            photoURL: firebaseUser.photoURL
          };
          setUser(userData);
          localStorage.setItem("finsight_user", JSON.stringify(userData));

          // Sync with backend profile & get db status
          const meData = await api.auth.getMe();
          setDbStatus(meData.database_status);
        } catch (err) {
          console.warn("[Auth] Sync with backend notice:", err.message);
        }
      } else {
        // If no Firebase user and no saved demo session, clear
        if (!localStorage.getItem("finsight_user")) {
          setUser(null);
          localStorage.removeItem("finsight_auth_token");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    setError(null);
    try {
      if (!auth) throw new Error("Firebase Auth client not initialized");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      localStorage.setItem("finsight_auth_token", token);
      const userData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split("@")[0]
      };
      setUser(userData);
      localStorage.setItem("finsight_user", JSON.stringify(userData));
      return cred.user;
    } catch (err) {
      // Fallback for demo environments if Firebase returns invalid API key
      if (err.code === "auth/api-key-not-valid" || err.message.includes("API key not valid")) {
        return loginAsDemoUser(email.split("@")[0], email.split("@")[0], email);
      }
      setError(err.message);
      throw err;
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    setError(null);
    try {
      if (!auth) throw new Error("Firebase Auth client not initialized");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      const token = await cred.user.getIdToken();
      localStorage.setItem("finsight_auth_token", token);
      const userData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || email.split("@")[0]
      };
      setUser(userData);
      localStorage.setItem("finsight_user", JSON.stringify(userData));
      await api.auth.syncProfile(displayName);
      return cred.user;
    } catch (err) {
      if (err.code === "auth/api-key-not-valid" || err.message.includes("API key not valid")) {
        return loginAsDemoUser(email.split("@")[0], displayName || email.split("@")[0], email);
      }
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      if (!auth) throw new Error("Firebase Auth client not initialized");
      const cred = await signInWithPopup(auth, googleProvider);
      const token = await cred.user.getIdToken();
      localStorage.setItem("finsight_auth_token", token);
      const userData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split("@")[0],
        photoURL: cred.user.photoURL
      };
      setUser(userData);
      localStorage.setItem("finsight_user", JSON.stringify(userData));
      await api.auth.syncProfile(userData.displayName);
      return cred.user;
    } catch (err) {
      if (err.code === "auth/api-key-not-valid" || err.message.includes("API key not valid")) {
        return loginAsDemoUser("google_user_alex", "Alex Chen (Google)", "alex.chen@gmail.com");
      }
      setError(err.message);
      throw err;
    }
  };

  const sendPasswordlessLink = async (email) => {
    setError(null);
    const actionCodeSettings = {
      url: window.location.origin + "/login?finishSignIn=true",
      handleCodeInApp: true
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      return true;
    } catch (err) {
      if (err.code === "auth/api-key-not-valid" || err.message.includes("API key not valid")) {
        // Mock successful magic link for sandbox
        return true;
      }
      setError(err.message);
      throw err;
    }
  };

  const loginAsDemoUser = (id = "alex_chen", name = "Alex Chen", email = "alex.chen@technovate.ai") => {
    const demoToken = `demo-token-${id}`;
    localStorage.setItem("finsight_auth_token", demoToken);
    const userData = {
      uid: id,
      email: email,
      displayName: name,
      isDemo: true
    };
    setUser(userData);
    localStorage.setItem("finsight_user", JSON.stringify(userData));
    // Fetch profile
    api.auth.getMe().then(res => setDbStatus(res.database_status)).catch(() => {});
    return userData;
  };

  const logout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("finsight_user");
    localStorage.removeItem("finsight_auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        dbStatus,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPasswordlessLink,
        loginAsDemoUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
