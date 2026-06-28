import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { UserProfile } from "../types/index";
import { motion } from "motion/react";
import {
  Award,
  AwardIcon,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Settings,
  Heart,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user, updateProfilePrefs } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Edit states
  const [editName, setEditName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
    }
  }, [user]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const board = await apiService.getLeaderboard();
        setLeaderboard(board);
      } catch (err) {
        console.warn("Failed to retrieve citizen leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    loadLeaderboard();
  }, [user]);

  if (!user) {
    return (
      <div className="py-12 text-center text-slate-400">
        Please sign in to view your profile settings.
      </div>
    );
  }

  const handleUpdatePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setUpdating(true);
    setUpdateSuccess(false);

    try {
      await updateProfilePrefs({ name: editName });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleSound = async () => {
    try {
      await updateProfilePrefs({ soundEnabled: !user.soundEnabled });
    } catch (err) {
      console.error(err);
    }
  };

  // Determine gamified badges earned based on points
  const points = user.actionPoints || 0;
  const badges = [
    { title: "Triage Pioneer", req: 100, desc: "Earned for registering on CivicSnap and triaging your initial hazard.", earned: points >= 100 },
    { title: "Community Guardian", req: 500, desc: "Endorsed active neighborhood hazard reports to mobilize repair trucks.", earned: points >= 500 },
    { title: "Sovereign Defender", req: 1000, desc: "Joined multiple collaborative weekend cleanups as a leading citizen organizer.", earned: points >= 1000 },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Upper header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400 animate-spin-slow" />
          Citizen Command Center
        </h1>
        <p className="text-xs text-slate-400">
          Calibrate portal parameters, evaluate active badges, and inspect global leaderboards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 sections): preferences editor and earned badges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preferences editor card */}
          <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
              <User className="w-5 h-5 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Citizen Preferences
              </h2>
            </div>

            <form onSubmit={handleUpdatePrefs} className="space-y-4">
              {updateSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Citizen configurations synchronized successfully.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Unified Citizen Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              {/* Sound alert toggle row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    {user.soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    Triage Sound Alerts
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Triggers a high-frequency chirp when Gemini completes an incident triage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    user.soundEnabled ? "bg-teal-500" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition ${
                      user.soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-sky-500/10 transition"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Earned badges section */}
          <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
              <Award className="w-5 h-5 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                My Gamified Badges
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {badges.map((badge, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 text-center flex flex-col items-center justify-center space-y-2 relative overflow-hidden transition ${
                    badge.earned
                      ? "bg-slate-900/40 border-slate-850"
                      : "bg-slate-950/20 border-slate-950 opacity-40"
                  }`}
                >
                  <div className={`p-3 rounded-full ${badge.earned ? "bg-gradient-to-tr from-sky-500/10 to-emerald-500/10 text-teal-400" : "bg-slate-900 text-slate-600"}`}>
                    <AwardIcon className="w-6 h-6 stroke-[2px]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{badge.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Req: {badge.req} XP</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Global Active Scoreboard Leaderboard */}
        <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Users className="w-4.5 h-4.5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Sector Leaderboard
            </h3>
          </div>

          {loadingLeaderboard ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-12 bg-slate-950 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((citizen, rank) => {
                const isCurrent = citizen.uid === user.uid;
                return (
                  <div
                    key={citizen.uid}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isCurrent
                        ? "bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border-slate-800"
                        : "bg-slate-950/40 border-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank counter */}
                      <span className="text-xs font-mono font-bold text-slate-500 w-4">
                        #{rank + 1}
                      </span>
                      <img
                        src={citizen.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${citizen.uid}`}
                        alt={citizen.name}
                        className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                      />
                      <div className="leading-tight">
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                          {citizen.name}
                          {isCurrent && (
                            <span className="text-[8px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-full uppercase font-mono font-bold">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{citizen.email}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {citizen.actionPoints} XP
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center italic">Scoreboard registers empty.</p>
          )}
        </section>
      </div>
    </div>
  );
};
