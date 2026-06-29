import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, X, Plus, ChevronRight, Eye, EyeOff } from "lucide-react";
import { hasFirebase, getSandboxUsers } from "../services/firebase";
import { UserProfile } from "../types/index";

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect straight to dashboard
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Listen to query parameters to switch view e.g., /login?signup=true
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(null);
    setLoading(true);

    if (isForgotPassword) {
      if (!email) {
        setError("Please fill in your secure email address.");
        setLoading(false);
        return;
      }
      try {
        await resetPassword(email);
        setResetSuccess("Recovery email sent successfully. Please check your inbox for portal credentials.");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to send reset link. Please verify your email.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError("Please fill in all mandatory credentials.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name) {
          setError("Name is required to register citizen credentials.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please verify your keys.");
          setLoading(false);
          return;
        }
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication rejected. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 shadow-2xl relative overflow-hidden space-y-6"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-emerald-500/5 pointer-events-none"></div>

        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 shadow-lg shadow-sky-500/10 mb-2">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5px]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isForgotPassword
              ? "Recover Portal Security"
              : isSignUp
              ? "Register Portal Access"
              : "Sector Portal Verification"}
          </h2>
          <p className="text-xs text-slate-400">
            {isForgotPassword
              ? "Request a link to restore access keys"
              : isSignUp
              ? "Create your unified citizen identity"
              : "Provide security keys to access municipal feed"}
          </p>
        </div>

        {/* Error notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success notification */}
        <AnimatePresence mode="wait">
          {resetSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-xs flex items-start gap-2"
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{resetSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credential form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Claire Redfield"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Secure Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="citizen@civicsnap.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Portal Security Key (Password)</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setResetSuccess(null);
                      setIsForgotPassword(true);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 focus:outline-none cursor-pointer"
                  >
                    Forgot key?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300">Confirm Security Key (Confirm Password)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition duration-150 cursor-pointer"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent"></div>
            ) : (
              <>
                {isForgotPassword
                  ? "Send Recovery Instructions"
                  : isSignUp
                  ? "Initialize Citizen Profile"
                  : "Verify Citizen Credentials"}
                <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
              </>
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setError(null);
                setResetSuccess(null);
                setIsForgotPassword(false);
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
            >
              Back to Verification Portal
            </button>
          ) : (
            <button
              onClick={() => {
                setError(null);
                setResetSuccess(null);
                setIsSignUp(!isSignUp);
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
            >
              {isSignUp
                ? "Already have portal access? Sign In here"
                : "New citizen? Create portal identity here"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
