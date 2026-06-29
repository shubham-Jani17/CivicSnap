import React from "react";
import { motion } from "motion/react";
import { Shield, Cpu } from "lucide-react";

export const AnimatedLogo: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Background ambient glow behind the logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl z-0"
      />

      {/* Cybernetic outer rings (government/security agency vibe) */}
      <motion.div
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.3 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute w-36 h-36 rounded-full border border-dashed border-cyan-500/30 z-10"
      />
      <motion.div
        initial={{ rotate: 180, opacity: 0 }}
        animate={{ rotate: -180, opacity: 0.15 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute w-40 h-40 rounded-full border border-double border-emerald-400/20 z-10"
      />

      {/* Glassmorphic Logo Shell */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 18,
          delay: 0.8,
        }}
        className="relative w-28 h-28 rounded-3xl bg-slate-950/40 border border-white/10 backdrop-blur-xl flex items-center justify-center p-[2px] shadow-[0_0_40px_rgba(0,212,255,0.15)] z-20"
      >
        <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-slate-900/90 to-slate-950/95 flex items-center justify-center relative overflow-hidden">
          {/* Inner futuristic layout grid accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:12px_12px] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-emerald-500/5" />

          {/* Glowing central core */}
          <div className="relative">
            <Shield className="w-14 h-14 text-cyan-400 fill-cyan-400/5 stroke-[1.25]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
