import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  Shield
} from "lucide-react";

export const MobileNav: React.FC = () => {
  const { user } = useAuth();

  return (
    <nav id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-900/90 py-2.5 px-4 flex justify-around items-center backdrop-blur-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? "text-sky-400" : "text-slate-500"
          }`
        }
      >
        <Compass className="w-5 h-5" />
        Home
      </NavLink>

      {user && (
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
              isActive ? "text-sky-400" : "text-slate-500"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
      )}

      {user && (
        <NavLink
          to="/create-report"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition -translate-y-2 relative`
          }
        >
          <div className="p-3 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-transform duration-150">
            <PlusCircle className="w-5 h-5 text-slate-950 stroke-[2.5px]" />
          </div>
          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Snap</span>
        </NavLink>
      )}

      <NavLink
        to="/feed"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? "text-sky-400" : "text-slate-500"
          }`
        }
      >
        <FileText className="w-5 h-5" />
        Feed
      </NavLink>

      <NavLink
        to={user ? "/profile" : "/login"}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? "text-sky-400" : "text-slate-500"
          }`
        }
      >
        <User className="w-5 h-5" />
        Profile
      </NavLink>
    </nav>
  );
};
