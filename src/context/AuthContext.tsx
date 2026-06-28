import React, { createContext, useContext, useState, useEffect } from "react";
import {
  subscribeToCitizenAuth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  citizenSignOut,
  resetPassword,
} from "../services/firebase";
import { apiService } from "../services/api";
import { UserProfile } from "../types/index";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: (mockEmail?: string, mockName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfilePrefs: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to raw Firebase / Sandbox Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToCitizenAuth(async (authUser) => {
      if (authUser) {
        try {
          // Attempt to pull the fully enriched Firestore profile from FastAPI
          const enrichedProfile = await apiService.getProfile();
          setUser(enrichedProfile);
        } catch (err) {
          console.warn("Could not load enriched profile, using base auth profile:", err);
          setUser(authUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const profile = await loginWithEmail(email, password);
      // Sync with FastAPI
      const enriched = await apiService.getProfile();
      setUser(enriched || profile);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const profile = await registerWithEmail(name, email, password);
      // Let backend initialize the profile in Firestore too
      const enriched = await apiService.getProfile();
      setUser(enriched || profile);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (mockEmail?: string, mockName?: string) => {
    setLoading(true);
    try {
      const profile = await loginWithGoogle(mockEmail, mockName);
      // Enforce FastAPI profile check / sync
      const enriched = await apiService.getProfile();
      setUser(enriched || profile);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await citizenSignOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      await resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const enriched = await apiService.getProfile();
      setUser(enriched);
    } catch (err) {
      console.warn("Failed to refresh citizen profile from Firestore:", err);
    }
  };

  const updateProfilePrefs = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await apiService.updateProfile(updates);
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error("Failed to update profile configurations:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        loginGoogle,
        logout,
        resetPassword: sendPasswordReset,
        refreshProfile,
        updateProfilePrefs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
