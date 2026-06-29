import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Mail, Lock, User, Save, CheckCircle, Eye, EyeOff } from "lucide-react";

export const AdminProfilePage: React.FC = () => {
  const [email, setEmail] = useState("shubhamjani1726@gmail.com");
  const [password, setPassword] = useState("Shubham@1726");
  const [showPassword, setShowPassword] = useState(false);
  const [authorityName, setAuthorityName] = useState("Central Civic Authority");
  const [authorityLevel, setAuthorityLevel] = useState("Super Admin");
  const [contactPhone, setContactPhone] = useState("+1-800-CIVIC-HERO");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage if exists
    const storedEmail = localStorage.getItem("adminEmail");
    const storedPassword = localStorage.getItem("adminPassword");
    const storedAuthName = localStorage.getItem("adminAuthorityName");
    const storedAuthLevel = localStorage.getItem("adminAuthorityLevel");
    const storedPhone = localStorage.getItem("adminContactPhone");

    if (storedEmail) setEmail(storedEmail);
    if (storedPassword) setPassword(storedPassword);
    if (storedAuthName) setAuthorityName(storedAuthName);
    if (storedAuthLevel) setAuthorityLevel(storedAuthLevel);
    if (storedPhone) setContactPhone(storedPhone);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("adminEmail", email);
    localStorage.setItem("adminPassword", password);
    localStorage.setItem("adminAuthorityName", authorityName);
    localStorage.setItem("adminAuthorityLevel", authorityLevel);
    localStorage.setItem("adminContactPhone", contactPhone);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-sky-400 mb-2">
          <Shield className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest font-mono">Administration</h2>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Admin Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage credentials and authority details.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Login Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Login Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500/50 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-300">Authority Details</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Higher Authority Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={authorityName}
                  onChange={(e) => setAuthorityName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. City Council Department"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Authority Role/Level</label>
                <input
                  type="text"
                  value={authorityLevel}
                  onChange={(e) => setAuthorityLevel(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. Regional Manager"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none transition"
                  placeholder="e.g. +1 555-1234"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end items-center gap-4">
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-sm font-medium flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Profile Updated
              </motion.span>
            )}
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-900/20"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
