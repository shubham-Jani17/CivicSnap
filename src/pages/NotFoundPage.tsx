import React from "react";
import { Link } from "react-router-dom";
import { Compass, AlertTriangle } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-md mx-auto">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <AlertTriangle className="w-10 h-10 animate-bounce" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Sector Out of Bounds
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested coordinate grid or document reference does not exist in our localized public Works directory registries.
        </p>
      </div>

      <Link
        to="/"
        className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white flex items-center gap-1.5 transition"
      >
        <Compass className="w-4 h-4 text-sky-400" />
        Return to Safety Portal
      </Link>
    </div>
  );
};
