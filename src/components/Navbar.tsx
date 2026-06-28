import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Award, LogOut, Settings, User, Bell, Shield, Sparkles } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-black shadow-lg shadow-sky-500/10">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-bold font-sans tracking-tight bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            CivicSnap
          </span>
        </Link>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-teal-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Sector Portal Live
        </span>
      </div>

      {/* Action / Widgets */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Action Points Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-teal-400">
              <Award className="w-4 h-4 text-emerald-400 animate-bounce" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs text-slate-400 font-mono">Civic Points</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {user.actionPoints || 0}
                </span>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="profile-dropdown-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all duration-200"
              >
                <img
                  src={user.picture || "https://api.dicebear.com/7.x/bottts/svg?seed=citizen"}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                />
                <span className="hidden sm:inline text-sm font-medium text-slate-200 pr-1 max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-850 shadow-2xl backdrop-blur-xl p-2 animate-slide-up">
                  <div className="px-3 py-2 border-b border-slate-800/60 mb-1.5">
                    <p className="text-xs text-slate-400 font-medium">Verified Citizen</p>
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    My Citizen Profile
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/login?signup=true"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-sky-500/10 transition"
            >
              Register Portal
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
