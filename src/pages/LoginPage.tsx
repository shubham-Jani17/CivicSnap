import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, X, Plus, ChevronRight } from "lucide-react";
import { hasFirebase, getSandboxUsers } from "../services/firebase";
import { UserProfile } from "../types/index";

export const LoginPage: React.FC = () => {
  const { signIn, signUp, loginGoogle, resetPassword, user } = useAuth();
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

  // Google Chooser simulation states
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleChooserMode, setGoogleChooserMode] = useState<"list" | "add_email" | "add_name">("list");
  const [chosenGoogleEmail, setChosenGoogleEmail] = useState("");
  const [chosenGoogleName, setChosenGoogleName] = useState("");
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);
  const [googleAccountsList, setGoogleAccountsList] = useState<UserProfile[]>([]);

  useEffect(() => {
    try {
      setGoogleAccountsList(getSandboxUsers());
    } catch (e) {
      console.warn("Failed to retrieve sandbox accounts:", e);
    }
  }, [showGoogleChooser]);

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

  const handleGoogleLogin = async () => {
    setError(null);
    setResetSuccess(null);
    setErrorGoogle(null);
    
    if (hasFirebase()) {
      setLoading(true);
      try {
        await loginGoogle();
        navigate("/dashboard");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Google Single Sign-On was interrupted.");
      } finally {
        setLoading(false);
      }
    } else {
      let accounts: UserProfile[] = [];
      try {
        accounts = getSandboxUsers();
      } catch (e) {
        console.warn("Failed to get sandbox users:", e);
      }
      
      setGoogleAccountsList(accounts);
      
      if (accounts.length > 0) {
        setGoogleChooserMode("list");
        setChosenGoogleEmail("");
        setChosenGoogleName("");
      } else {
        setGoogleChooserMode("add_email");
        setChosenGoogleEmail("");
        setChosenGoogleName("");
      }
      setShowGoogleChooser(true);
    }
  };

  const handleSelectMockGoogleAccount = async (mockEmail: string, mockName: string) => {
    setShowGoogleChooser(false);
    setLoading(true);
    try {
      await loginGoogle(mockEmail, mockName);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google single sign-on simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextGoogleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGoogle(null);
    if (!chosenGoogleEmail || !chosenGoogleEmail.includes("@")) {
      setErrorGoogle("Please enter a valid Google email address.");
      return;
    }
    
    const existing = googleAccountsList.find((u) => u.email.toLowerCase() === chosenGoogleEmail.toLowerCase());
    if (existing) {
      handleSelectMockGoogleAccount(existing.email, existing.name);
    } else {
      setGoogleChooserMode("add_name");
    }
  };

  const handleFinishGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGoogle(null);
    if (!chosenGoogleName.trim()) {
      setErrorGoogle("Please enter your display name.");
      return;
    }
    await handleSelectMockGoogleAccount(chosenGoogleEmail, chosenGoogleName);
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
                />
              </div>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300">Confirm Security Key (Confirm Password)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/60 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-550 focus:outline-none transition duration-150 font-sans"
                />
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

        {/* Divider */}
        {!isForgotPassword && (
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-mono tracking-wider">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        )}

        {/* SSO Button */}
        {!isForgotPassword && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center gap-3 transition duration-150 hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-sans font-medium text-sm">Sign in with Google</span>
          </button>
        )}

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

      {/* Google Sign-In Account Chooser Simulation Overlay */}
      <AnimatePresence>
        {showGoogleChooser && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white text-slate-800 w-full max-w-[440px] rounded-2xl shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col p-8 font-sans space-y-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowGoogleChooser(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Standard Colored Google Logo */}
              <div className="flex justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.55 0 2.94.53 4.03 1.58l3-3C17.22 1.94 14.82 1 12 1 7.42 1 3.51 3.65 1.68 7.5l3.86 3C6.44 7.64 9.02 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.45c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-2 3.73-4.94 3.73-8.56z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.54 14.5c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25L1.68 7.5C.61 9.65 0 12.06 0 14.5s.61 4.85 1.68 7l3.86-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.03 0-5.59-2.05-6.51-4.81l-3.86 3C3.78 20.35 7.6 23 12 23z"
                  />
                </svg>
              </div>

              {/* Sign in with Google Header */}
              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-medium text-slate-900 tracking-tight">
                  Sign in with Google
                </h3>
                <p className="text-xs text-slate-500">
                  to continue to <span className="font-semibold text-sky-600">CivicSnap</span>
                </p>
              </div>

              {errorGoogle && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-medium">{errorGoogle}</span>
                </div>
              )}

              {/* MODE: Account List Selector */}
              {googleChooserMode === "list" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {googleAccountsList.map((account) => (
                      <button
                        key={account.uid}
                        onClick={() => handleSelectMockGoogleAccount(account.email, account.name)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={account.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${account.name}`}
                            alt={account.name}
                            className="w-8 h-8 rounded-full bg-slate-100"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {account.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {account.email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setErrorGoogle(null);
                        setGoogleChooserMode("add_email");
                      }}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition text-sky-600 font-medium text-sm cursor-pointer"
                    >
                      <div className="p-1.5 bg-sky-50 rounded-full text-sky-600">
                        <Plus className="w-4 h-4" />
                      </div>
                      Use another account
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                    To continue, Google will share your name, email address, language preference, and profile picture with CivicSnap. Review CivicSnap's <span className="underline hover:text-slate-600 cursor-pointer">Privacy Policy</span> and <span className="underline hover:text-slate-600 cursor-pointer">Terms of Service</span>.
                  </p>
                </div>
              )}

              {/* MODE: Add Email Screen */}
              {googleChooserMode === "add_email" && (
                <form onSubmit={handleNextGoogleEmail} className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700 font-medium">Email or phone</p>
                    <input
                      type="email"
                      required
                      placeholder="e.g. shubhamjani2004@gmail.com"
                      value={chosenGoogleEmail}
                      onChange={(e) => setChosenGoogleEmail(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-950 placeholder-slate-400 focus:outline-none transition font-sans"
                    />
                    <p className="text-[11px] text-slate-400">
                      Enter your Google Account email to securely link and sign in.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {googleAccountsList.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorGoogle(null);
                          setGoogleChooserMode("list");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                      >
                        Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </form>
              )}

              {/* MODE: Add Name Screen */}
              {googleChooserMode === "add_name" && (
                <form onSubmit={handleFinishGoogleRegister} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {chosenGoogleEmail.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {chosenGoogleEmail}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-slate-700 font-medium">Your display name</p>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shubham Jani"
                        value={chosenGoogleName}
                        onChange={(e) => setChosenGoogleName(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-950 placeholder-slate-400 focus:outline-none transition font-sans"
                      />
                      <p className="text-[11px] text-slate-400">
                        This display name is shared to customize your CivicSnap citizen identity.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorGoogle(null);
                        setGoogleChooserMode("add_email");
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
