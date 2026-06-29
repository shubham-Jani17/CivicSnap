import React from "react";
import { IntroProvider, useIntro } from "./IntroAnimation/IntroProvider";
import { BootScreen } from "./IntroAnimation/BootScreen";

const IntroAnimationContent: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { isIntroActive, completeIntro } = useIntro();

  const handleComplete = () => {
    completeIntro();
    onComplete();
  };

  if (!isIntroActive) return null;

  return <BootScreen onComplete={handleComplete} />;
};

export const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <IntroProvider>
      <IntroAnimationContent onComplete={onComplete} />
    </IntroProvider>
  );
};
