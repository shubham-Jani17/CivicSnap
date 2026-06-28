import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Compass,
  LayoutDashboard,
  FileText,
  User,
  PlusCircle,
  HelpCircle,
  Shield,
  Clock,
  Sparkles
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: "/", label: "Landing", icon: Compass },
    ...(user
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/create-report", label: "File Report", icon: PlusCircle },
        ]
      : []),
    { to: "/feed", label: "Community Feed", icon: FileText },
    ...(user ? [
      { to: "/profile", label: "Citizen Profile", icon: User }
    ] : []),
  ];

  return (
    <aside id="main-sidebar" className="hidden lg:flex flex-col w-64 bg-slate-950/40 border-r border-slate-900 px-4 py-6 justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation Section Title */}
        <div className="px-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Sector Navigation
          </p>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-slate-800 text-sky-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer statistics panel */}
      {user && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">Municipal Impact</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-1.5">
              <p className="text-[9px] text-slate-400 font-mono">LEVEL</p>
              <p className="text-sm font-bold text-teal-400 font-mono">
                {Math.floor((user.actionPoints || 0) / 300) + 1}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-1.5">
              <p className="text-[9px] text-slate-400 font-mono">REPORTS</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">
                {Math.floor((user.actionPoints || 0) / 50)}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
