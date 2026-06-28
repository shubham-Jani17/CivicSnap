import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { UserProfile } from "../types/index";

const metaEnv = (import.meta as any).env || {};

// Standard Firebase configuration
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "",
};

const hasFirebaseEnv = !!(
  metaEnv.VITE_FIREBASE_API_KEY &&
  metaEnv.VITE_FIREBASE_AUTH_DOMAIN
);

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

if (hasFirebaseEnv) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.info("🔥 Firebase Auth SDK initialized successfully.");
  } catch (err) {
    console.warn("⚠️ Firebase Auth SDK initialization failed. Falling back to sandbox mode.", err);
  }
} else {
  console.info("ℹ️ No VITE_FIREBASE_API_KEY detected. Running in local Sandbox Auth fallback mode.");
}

// Simulated Local Auth database for Sandbox Mode
const STORAGE_USER_KEY = "civicsnap_sandbox_user";
const STORAGE_REGISTERED_USERS = "civicsnap_sandbox_users";

const getSavedProfile = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_USER_KEY);
  return data ? JSON.parse(data) : null;
};

const saveSavedProfile = (profile: UserProfile | null) => {
  if (profile) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

export const getSandboxUsers = (): UserProfile[] => {
  const data = localStorage.getItem(STORAGE_REGISTERED_USERS);
  if (!data) {
    return [];
  }
  try {
    const parsed: UserProfile[] = JSON.parse(data);
    // Filter out all fake/mock accounts
    const filtered = parsed.filter(
      (u) =>
        u.uid &&
        !u.uid.startsWith("mock-user-") &&
        u.email &&
        !u.email.endsWith("@mercer.gov") &&
        !u.email.endsWith("@stars.org") &&
        !u.email.endsWith("@philosophy.edu") &&
        !u.email.endsWith("@civicsnap.org") &&
        u.email.toLowerCase() !== "google.citizen@civicsnap.org"
    );
    // Overwrite with clean list if there's any difference
    if (parsed.length !== filtered.length) {
      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(filtered));
    }
    return filtered;
  } catch (e) {
    return [];
  }
};

// Sandbox Auth Session Service
class SandboxAuthService {
  private listeners: Array<(user: UserProfile | null) => void> = [];
  private currentUser: UserProfile | null = null;

  constructor() {
    this.currentUser = getSavedProfile();
  }

  async resetPassword(email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const users = getSandboxUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      throw new Error("No citizen account found with this email address.");
    }
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private emitState() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  async signInWithEmail(email: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const users = getSandboxUsers();
    let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existing) {
      // Auto-create profile in sandbox
      existing = {
        uid: `sandbox-${Math.random().toString(36).substr(2, 9)}`,
        name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
        email: email,
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        soundEnabled: true,
        actionPoints: 100,
        createdAt: Date.now(),
      };
      users.push(existing);
      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(users));
    }
    
    this.currentUser = existing;
    saveSavedProfile(existing);
    this.emitState();
    return existing;
  }

  async signUpWithEmail(name: string, email: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const users = getSandboxUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      throw new Error("Citizen with this email is already registered.");
    }

    const newProfile: UserProfile = {
      uid: `sandbox-${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      email: email,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      soundEnabled: true,
      actionPoints: 150, // +50 bonus on sign-up
      createdAt: Date.now(),
    };

    users.push(newProfile);
    localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(users));
    
    this.currentUser = newProfile;
    saveSavedProfile(newProfile);
    this.emitState();
    return newProfile;
  }

  async signInWithGoogle(mockEmail?: string, mockName?: string): Promise<UserProfile> {
    const email = mockEmail || "shubhamjani2004@gmail.com";
    const name = mockName || "Shubham Jani";
    
    await new Promise((resolve) => setTimeout(resolve, 600));
    const users = getSandboxUsers();
    let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existing) {
      existing = {
        uid: `google-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        email: email,
        picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        soundEnabled: true,
        actionPoints: 200, // Google authentication welcome points
        createdAt: Date.now(),
      };
      users.push(existing);
      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(users));
    }
    
    this.currentUser = existing;
    saveSavedProfile(existing);
    this.emitState();
    return existing;
  }

  async signOut() {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.currentUser = null;
    saveSavedProfile(null);
    this.emitState();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async getIdToken(): Promise<string> {
    return "sandbox-session-mock-token-123456789";
  }
}

export const sandboxAuth = new SandboxAuthService();

// Unified methods
export const resetPassword = async (email: string): Promise<void> => {
  if (hasFirebaseEnv && auth) {
    await sendPasswordResetEmail(auth, email);
  } else {
    await sandboxAuth.resetPassword(email);
  }
};

export const getActiveAuth = () => {
  return hasFirebaseEnv && auth ? auth : null;
};

export const hasFirebase = () => {
  return hasFirebaseEnv && !!auth;
};

export const getIdToken = async (): Promise<string | null> => {
  if (hasFirebaseEnv && auth && auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.error("Failed to fetch Firebase ID token:", e);
      return null;
    }
  }
  return await sandboxAuth.getIdToken();
};

export const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
  if (hasFirebaseEnv && auth) {
    const creds = await signInWithEmailAndPassword(auth, email, password);
    const u = creds.user;
    return {
      uid: u.uid,
      name: u.displayName || email.split("@")[0],
      email: u.email || email,
      picture: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
      soundEnabled: true,
      actionPoints: 100,
      createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : Date.now(),
    };
  } else {
    return await sandboxAuth.signInWithEmail(email);
  }
};

export const registerWithEmail = async (name: string, email: string, password: string): Promise<UserProfile> => {
  if (hasFirebaseEnv && auth) {
    const creds = await createUserWithEmailAndPassword(auth, email, password);
    const u = creds.user;
    await updateProfile(u, {
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    });
    return {
      uid: u.uid,
      name: name,
      email: email,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      soundEnabled: true,
      actionPoints: 150,
      createdAt: Date.now(),
    };
  } else {
    return await sandboxAuth.signUpWithEmail(name, email);
  }
};

export const loginWithGoogle = async (mockEmail?: string, mockName?: string): Promise<UserProfile> => {
  if (hasFirebaseEnv && auth && googleProvider) {
    const creds = await signInWithPopup(auth, googleProvider);
    const u = creds.user;
    return {
      uid: u.uid,
      name: u.displayName || "Google Citizen",
      email: u.email || "",
      picture: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
      soundEnabled: true,
      actionPoints: 100,
      createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : Date.now(),
    };
  } else {
    return await sandboxAuth.signInWithGoogle(mockEmail, mockName);
  }
};

export const citizenSignOut = async (): Promise<void> => {
  if (hasFirebaseEnv && auth) {
    await signOut(auth);
  } else {
    await sandboxAuth.signOut();
  }
};

export const subscribeToCitizenAuth = (callback: (user: UserProfile | null) => void) => {
  if (hasFirebaseEnv && auth) {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        callback({
          uid: u.uid,
          name: u.displayName || u.email?.split("@")[0] || "Citizen",
          email: u.email || "",
          picture: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
          soundEnabled: true,
          actionPoints: 100, // This will be synchronized with profile fetch
          createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : Date.now(),
        });
      } else {
        callback(null);
      }
    });
  } else {
    return sandboxAuth.onAuthStateChanged(callback);
  }
};
