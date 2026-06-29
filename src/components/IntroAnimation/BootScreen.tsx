import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedLogo } from "./AnimatedLogo";
import { Sparkles } from "lucide-react";

interface BootScreenProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [titleTyped, setTitleTyped] = useState("");
  
  const fullTitle = "CivicSnap";

  useEffect(() => {
    const generatedParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(generatedParticles);
  }, []);

  useEffect(() => {
    const timerGlow = setTimeout(() => {
      setStage(1);
    }, 600);
    return () => clearTimeout(timerGlow);
  }, []);

  useEffect(() => {
    if (stage !== 1) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < fullTitle.length) {
        setTitleTyped(fullTitle.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStage(2);
          setTimeout(() => {
            onComplete();
          }, 700);
        }, 1500);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [stage, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: stage === 2 ? 0 : 1,
        filter: stage === 2 ? "blur(12px)" : "blur(0px)"
      }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070B1A] text-slate-100 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl"
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: `${p.y}%`, x: `${p.x}%` }}
            animate={{
              opacity: [0, 0.4, 0],
              y: [`${p.y}%`, `${p.y - 12}%`],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
            className="absolute rounded-full bg-cyan-400/40"
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 w-full max-w-md px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: stage === 2 ? 1.08 : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AnimatedLogo />
          </motion.div>
        </AnimatePresence>

        {(stage === 1 || stage === 2) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 h-20 flex flex-col justify-center items-center"
          >
            <h1 className="text-4xl font-black tracking-tight font-sans text-white">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                {titleTyped}
              </span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="inline-block w-2.5 h-7 bg-cyan-400 ml-1.5 align-middle"
              />
            </h1>

            {titleTyped.length === fullTitle.length && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 tracking-widest uppercase"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Powered Community Intelligence</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
