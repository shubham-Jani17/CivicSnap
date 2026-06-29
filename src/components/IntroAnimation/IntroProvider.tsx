import React, { createContext, useContext, useState, useEffect } from "react";

interface IntroContextType {
  isIntroActive: boolean;
  hasSeenIntro: boolean;
  completeIntro: () => void;
  replayIntro: () => void;
}

const IntroContext = createContext<IntroContextType | undefined>(undefined);

export const IntroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In-memory state to track if we should play the intro on this page load/refresh.
  // Because page refresh reloads the entire JS bundle, this in-memory state will reset to true,
  // whereas navigating routes (SPA) preserves the state and skips the intro!
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);

  useEffect(() => {
    // Also persist completion in localStorage as requested.
    const localCompleted = localStorage.getItem("civicsnap_intro_completed");
    
    // Check if we have seen it in this browser session or page load.
    // If it's a new page load, we want to show it.
    setIsIntroActive(true);
    setHasSeenIntro(false);
  }, []);

  const completeIntro = () => {
    setIsIntroActive(false);
    setHasSeenIntro(true);
    localStorage.setItem("civicsnap_intro_completed", "true");
  };

  const replayIntro = () => {
    setHasSeenIntro(false);
    setIsIntroActive(true);
  };

  return (
    <IntroContext.Provider value={{ isIntroActive, hasSeenIntro, completeIntro, replayIntro }}>
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error("useIntro must be used within an IntroProvider");
  }
  return context;
};
