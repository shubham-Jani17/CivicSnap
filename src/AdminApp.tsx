import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";
import { Shield, LogOut, UserCircle } from "lucide-react";

const AdminLayout: React.FC<{ children: React.ReactNode, onLogout: () => void }> = ({ children, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-400">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <NavLink to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white font-mono">ADMIN_PORTAL</span>
        </NavLink>
        <div className="flex items-center gap-4">
          <NavLink 
            to="/admin/profile" 
            className={({isActive}) => `flex items-center gap-2 text-sm font-medium transition ${isActive ? 'text-sky-400' : 'text-slate-400 hover:text-sky-400'}`}
          >
            <UserCircle className="w-4 h-4" /> Profile
          </NavLink>
          <NavLink to="/" className="text-sm font-medium text-slate-400 hover:text-sky-400 transition">Return to Main App</NavLink>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        {children}
      </main>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("adminAuth") === "true";
  });

  const handleLogin = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem("adminAuth", "true");
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("adminAuth");
  };

  if (!isAdminAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/profile" element={<AdminProfilePage />} />
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

