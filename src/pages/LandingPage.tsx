import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { 
  fetchMunicipalWeather, 
  fetchCivicGuidelines, 
  fetchIPLocation, 
  reverseGeocode, 
  searchCityCoordinates, 
  WeatherData,
  LocationInfo
} from "../lib/api";
import { LocationSeverityPreview } from "../components/LocationSeverityPreview";
import { Issue } from "../types/index";
import { motion } from "motion/react";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Camera,
  Activity,
  Heart,
  FileText,
  CloudSun,
  AlertTriangle,
  Award,
  Search,
  Compass,
  MapPin,
  X,
  RefreshCw,
  ThumbsUp,
  Filter,
  PlusCircle,
  Send,
  Wrench
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // New states for real/actual weather system
  const [locationName, setLocationName] = useState<string>("San Francisco, CA");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 37.7794, lng: -122.4169 });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Quick ticket raise form states
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState("ROAD_HAZARD");
  const [quickSeverity, setQuickSeverity] = useState("MEDIUM");
  const [quickDesc, setQuickDesc] = useState("");
  const [quickLocation, setQuickLocation] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  // Live feed filter states
  const [feedCategoryFilter, setFeedCategoryFilter] = useState("ALL");
  const [feedSeverityFilter, setFeedSeverityFilter] = useState("ALL");
  const [feedSearch, setFeedSearch] = useState("");
  const [upvotingIds, setUpvotingIds] = useState<string[]>([]);

  const handleUpvote = async (issueId: string) => {
    if (upvotingIds.includes(issueId)) return;
    setUpvotingIds(prev => [...prev, issueId]);
    try {
      await apiService.upvoteIssue(issueId);
      const refreshedIssues = await apiService.getIssues();
      setIssues(refreshedIssues);
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setUpvotingIds(prev => prev.filter(id => id !== issueId));
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setQuickError("You must be signed in to raise a civic issue.");
      return;
    }
    if (!quickTitle.trim() || !quickDesc.trim()) {
      setQuickError("Please fill in the title and description.");
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);
    setQuickSuccess(null);

    try {
      const payload = {
        title: quickTitle,
        description: quickDesc,
        category: quickCategory,
        severity: quickSeverity,
        authority: quickCategory === "ROAD_HAZARD" ? "Department of Public Works" : "Municipal Utility Agency",
        summary: `Citizen raised quick report: ${quickDesc}`,
        locationName: quickLocation.trim() || locationName || "Sector Hub",
        coordinates: { latitude: coords.lat, longitude: coords.lng },
      };

      const result = await apiService.submitIssue(payload);
      if (result && result.success) {
        setQuickSuccess("Civic ticket dispatched successfully! +50 XP");
        setQuickTitle("");
        setQuickDesc("");
        setQuickLocation("");
        const updatedIssues = await apiService.getIssues();
        setIssues(updatedIssues);
        setReportCount(updatedIssues.length);
      } else {
        throw new Error("Dispatch failed.");
      }
    } catch (err) {
      setQuickError("Failed to dispatch ticket. Please retry.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const loadWeatherForCoords = async (latitude: number, longitude: number, name?: string) => {
    setWeatherError(null);
    try {
      const wData = await fetchMunicipalWeather(latitude, longitude);
      setWeather(wData);
      setCoords({ lat: latitude, lng: longitude });
      if (name) {
        setLocationName(name);
      } else {
        const resolvedName = await reverseGeocode(latitude, longitude);
        setLocationName(resolvedName);
      }
    } catch (err) {
      console.error("Failed to load weather:", err);
      setWeatherError("Could not retrieve weather conditions.");
    }
  };

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLocating(true);
    setWeatherError(null);
    try {
      const result = await searchCityCoordinates(searchQuery);
      if (result) {
        const displayName = `${result.city}${result.region ? `, ${result.region}` : ""}${result.countryCode ? ` (${result.countryCode})` : ""}`;
        await loadWeatherForCoords(result.lat, result.lng, displayName);
        setSearchMode(false);
        setSearchQuery("");
      } else {
        setWeatherError("City not found. Try another query.");
      }
    } catch (err) {
      setWeatherError("Error looking up city coordinates.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setWeatherError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadWeatherForCoords(latitude, longitude);
        setIsLocating(false);
      },
      async (error) => {
        console.warn("GPS access denied or failed, using IP fallback:", error);
        // Fallback to IP lookup
        try {
          const ipLoc = await fetchIPLocation();
          const displayName = `${ipLoc.city}${ipLoc.region ? `, ${ipLoc.region}` : ""}${ipLoc.countryCode ? ` (${ipLoc.countryCode})` : ""}`;
          await loadWeatherForCoords(ipLoc.lat, ipLoc.lng, displayName);
        } catch (err) {
          setWeatherError("GPS unavailable and IP lookup failed.");
        } finally {
          setIsLocating(false);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    async function loadData() {
      // Load guidelines and issues
      const guidelines = await fetchCivicGuidelines();
      setTips(guidelines);
      
      try {
        const retrievedIssues = await apiService.getIssues();
        setIssues(retrievedIssues);
        setReportCount(retrievedIssues.length);
      } catch (e) {
        setReportCount(12);
      } finally {
        setLoadingIssues(false);
      }

      // Try background IP location lookup for responsive default (user's real city!)
      setIsLocating(true);
      try {
        const ipLoc = await fetchIPLocation();
        const displayName = `${ipLoc.city}${ipLoc.region ? `, ${ipLoc.region}` : ""}${ipLoc.countryCode ? ` (${ipLoc.countryCode})` : ""}`;
        await loadWeatherForCoords(ipLoc.lat, ipLoc.lng, displayName);
      } catch (err) {
        // Fallback to SF City Hall
        await loadWeatherForCoords(37.7794, -122.4169, "San Francisco, CA");
      } finally {
        setIsLocating(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Visual Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_40%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_40%)]"></div>
        
        <div className="relative space-y-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Empowering Citizen Action with Gemini 2.5 Flash
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight font-sans text-white leading-tight"
          >
            Snap Civic Hazards. <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Mobilize Cleanups.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base md:text-lg leading-relaxed max-w-lg"
          >
            CivicSnap bridges the gap between citizens and municipal repair departments. Take a photo of a hazard to immediately analyze and draft complaint reports.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 justify-center md:justify-start"
          >
            <Link
              to={user ? "/create-report" : "/login"}
              className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Camera className="w-5 h-5 stroke-[2.5px]" />
              Snap New Issue
            </Link>
            <Link
              to="/feed"
              className="px-6 py-3 rounded-2xl font-bold bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center gap-2 transition duration-200"
            >
              Explore Feed
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </motion.div>
        </div>

        {/* Dynamic Weather Widget */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full md:w-80 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-850 p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5">
              <CloudSun className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Real-Time Weather
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchMode(!searchMode)}
                title="Search city"
                className={`p-1.5 rounded-lg border transition ${
                  searchMode 
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDetectGPS}
                disabled={isLocating}
                title="Detect GPS / IP"
                className="p-1.5 rounded-lg border bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50"
              >
                <Compass className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-teal-400" : ""}`} />
              </button>
            </div>
          </div>

          {searchMode ? (
            <form onSubmit={handleSearchCity} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter city (e.g. London)"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2 px-3 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLocating || !searchQuery.trim()}
                  className="flex-1 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                >
                  {isLocating ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode(false);
                    setSearchQuery("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {!searchMode && isLocating && (
            <div className="py-6 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-[10px] text-slate-400 font-mono">Syncing Station...</span>
            </div>
          )}

          {!searchMode && !isLocating && (
            <>
              {weatherError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                  <p className="text-[11px] text-red-400">{weatherError}</p>
                  <button
                    onClick={handleDetectGPS}
                    className="text-[10px] text-sky-400 hover:underline font-mono font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Try Again
                  </button>
                </div>
              )}

              {weather && !weatherError && (
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-white truncate max-w-[190px]" title={locationName}>
                        {locationName}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono pl-4.5">
                      GPS: {coords.lat.toFixed(3)}°, {coords.lng.toFixed(3)}°
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-slate-850/60 pt-2.5">
                    <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {weather.temperature}°C
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      (() => {
                        const code = weather.weathercode;
                        const wind = weather.windspeed;
                        if (code >= 95 && code <= 99) return "text-red-400 bg-red-400/5 border-red-400/10";
                        if (code >= 80 && code <= 82) return "text-rose-400 bg-rose-400/5 border-rose-400/10";
                        if (wind > 35) return "text-amber-400 bg-amber-400/5 border-amber-400/10";
                        if (code >= 51 && code <= 67) return "text-yellow-400 bg-yellow-400/5 border-yellow-400/10";
                        if (code >= 45 && code <= 48) return "text-sky-300 bg-sky-300/5 border-sky-300/10";
                        return "text-emerald-400 bg-emerald-400/5 border-emerald-400/10";
                      })()
                    }`}>
                      {(() => {
                        const code = weather.weathercode;
                        const wind = weather.windspeed;
                        if (code >= 95 && code <= 99) return "Stormy";
                        if (code >= 80 && code <= 82) return "Heavy Rain";
                        if (wind > 35) return "High Wind";
                        if (code >= 51 && code <= 67) return "Slippery";
                        if (code >= 45 && code <= 48) return "Low Vis";
                        return "Stable";
                      })()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Atmosphere: <strong className="text-teal-400">{weather.description}</strong>
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-850/40 pt-2 bg-slate-950/20 -mx-3 px-3 -mb-3 pb-3 rounded-b-2xl">
                    <span>Wind: {weather.windspeed} km/h</span>
                    <span>Safety: Optimal</span>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </section>

      {/* Gamified Core Metrics Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            title: "Community Active Reports",
            value: reportCount || 12,
            icon: FileText,
            color: "text-sky-400",
            bg: "bg-sky-500/5",
            border: "border-sky-500/10"
          },
          {
            title: "Volunteers Engaged",
            value: "28 Citizens",
            icon: Heart,
            color: "text-emerald-400",
            bg: "bg-emerald-500/5",
            border: "border-emerald-500/10"
          },
          {
            title: "Avg Resolution Rate",
            value: "84% Triaged",
            icon: Activity,
            color: "text-teal-400",
            bg: "bg-teal-500/5",
            border: "border-teal-500/10"
          }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl bg-slate-900/20 backdrop-blur-sm border ${stat.border} p-5 flex items-center gap-4`}
            >
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{stat.title}</p>
                <p className="text-xl font-bold text-white font-mono mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Location-Based Severity Monitor */}
      <section className="space-y-4">
        {loadingIssues ? (
          <div className="rounded-3xl bg-slate-900/10 border border-slate-900 p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent"></div>
            <p className="text-xs text-slate-500 font-mono">Loading Regional Severity Metrics...</p>
          </div>
        ) : (
          <LocationSeverityPreview issues={issues} />
        )}
      </section>

      {/* Live Civic Snap Tracker & Dispatch Portal */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Column: Quick Ticket Dispatcher Terminal */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sky-400" />
              Quick Dispatch Terminal
            </h2>
            <p className="text-xs text-slate-400">
              Spotted an issue? Generate and broadcast a civic ticket instantly to the community.
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-850 p-6 space-y-4 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full pointer-events-none filter blur-xl"></div>
            
            {user ? (
              <form onSubmit={handleQuickSubmit} className="space-y-4 relative z-10">
                {quickError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{quickError}</span>
                  </div>
                )}
                {quickSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-400 animate-bounce" />
                    <span>{quickSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Issue Title</label>
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="e.g., Blocked Drainage Valve or Broken Pavement"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none transition font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Category</label>
                    <select
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none transition font-sans cursor-pointer"
                    >
                      <option value="ROAD_HAZARD">Road Hazard</option>
                      <option value="POWER_OUTAGE">Power Outage</option>
                      <option value="WATER_LEAK">Water Leak</option>
                      <option value="VANDALISM">Vandalism</option>
                      <option value="PUBLIC_SAFETY">Public Safety</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Severity</label>
                    <select
                      value={quickSeverity}
                      onChange={(e) => setQuickSeverity(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none transition font-sans cursor-pointer"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                      <option value="CRITICAL">Critical Risk</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Target Location</label>
                    <span className="text-[9px] text-teal-400 font-mono">GPS Anchored</span>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={quickLocation}
                      onChange={(e) => setQuickLocation(e.target.value)}
                      placeholder={locationName || "Detecting your current location..."}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Description</label>
                  <textarea
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    placeholder="Provide dynamic, precise details for the repair dispatcher cell..."
                    rows={3}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/50 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none transition font-sans resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
                >
                  {quickSubmitting ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      Broadcasting Incident...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      Dispatch Ticket to Live Feed
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-8 px-4 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-teal-400">
                  <Wrench className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Dispatcher Key Required
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    You must sign in to access the direct community reporting line and log active hazards on the live stream.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-block px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
                >
                  Access Portal / Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Incident stream tracker board */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                Live Dispatch stream
              </h2>
              <p className="text-xs text-slate-400">
                Citizen reports triaged, dispatched, and tracked transparently.
              </p>
            </div>

            {/* Quick Live Search */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search live stream..."
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-white placeholder-slate-500 focus:outline-none transition font-sans"
              />
            </div>
          </div>

          {/* Stream Filters block */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/10 border border-slate-900 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Filter Stream:
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <select
                value={feedCategoryFilter}
                onChange={(e) => setFeedCategoryFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-850 text-slate-300 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-teal-500/50 cursor-pointer font-sans"
              >
                <option value="ALL">All Categories</option>
                <option value="ROAD_HAZARD">Road Hazard</option>
                <option value="POWER_OUTAGE">Power Outage</option>
                <option value="WATER_LEAK">Water Leak</option>
                <option value="VANDALISM">Vandalism</option>
                <option value="PUBLIC_SAFETY">Public Safety</option>
              </select>

              <select
                value={feedSeverityFilter}
                onChange={(e) => setFeedSeverityFilter(e.target.value)}
                className="bg-slate-950/60 border border-slate-850 text-slate-300 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-teal-500/50 cursor-pointer font-sans"
              >
                <option value="ALL">All Severities</option>
                <option value="LOW">Low Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="HIGH">High Severity</option>
                <option value="CRITICAL">Critical Severity</option>
              </select>
            </div>
          </div>

          {/* Issues feed list with live status */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingIssues ? (
              <div className="py-16 text-center space-y-4">
                <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
                <p className="text-[11px] text-slate-500 font-mono">Synchronizing telemetry logs...</p>
              </div>
            ) : (() => {
              const filteredList = issues.filter(issue => {
                if (feedCategoryFilter !== "ALL" && issue.category !== feedCategoryFilter) return false;
                if (feedSeverityFilter !== "ALL" && issue.severity !== feedSeverityFilter) return false;
                if (feedSearch.trim()) {
                  const query = feedSearch.toLowerCase();
                  return (
                    issue.title.toLowerCase().includes(query) ||
                    issue.description.toLowerCase().includes(query) ||
                    issue.locationName.toLowerCase().includes(query)
                  );
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="py-16 border border-dashed border-slate-850 rounded-3xl text-center px-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-300">No Incidents Match Search Criteria</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                      All systems green. If you see a civic defect in the field, use the Terminal on the left to raise the alert.
                    </p>
                  </div>
                );
              }

              return filteredList.map((issue) => {
                // Get style classes based on severity
                const getSeverityClasses = (sev: string) => {
                  switch (sev) {
                    case "CRITICAL": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    case "HIGH": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    case "MEDIUM": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
                    default: return "text-teal-400 bg-teal-500/10 border-teal-500/20";
                  }
                };

                // Get icon for progress status
                const getStatusStep = (status: string) => {
                  const lower = (status || "").toLowerCase();
                  if (lower.includes("resolved") || lower.includes("complete")) return 4;
                  if (lower.includes("progress") || lower.includes("action")) return 3;
                  if (lower.includes("triage") || lower.includes("assign")) return 2;
                  return 1;
                };

                const currentStep = getStatusStep(issue.status);

                return (
                  <motion.div
                    key={issue.id}
                    layoutId={`issue-${issue.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-slate-900/20 border border-slate-900 hover:border-slate-800 transition duration-200 space-y-4 shadow-sm"
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-md font-mono text-slate-300 font-bold uppercase tracking-wider">
                            {issue.category.replace("_", " ")}
                          </span>
                          <span className={`text-[9px] border px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider ${getSeverityClasses(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition leading-snug">
                          {issue.title}
                        </h3>
                      </div>

                      {/* Detail CTA Link */}
                      <Link
                        to={`/report/${issue.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        Portal View
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {issue.description}
                    </p>

                    {/* Live Progress Tracker bar */}
                    <div className="space-y-2 border-t border-slate-900/60 pt-3.5">
                      <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        <span>Incident Progress Tracker</span>
                        <span className={currentStep === 4 ? "text-emerald-400 animate-pulse" : "text-sky-400"}>
                          {issue.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: "Reported", step: 1 },
                          { label: "Triaged", step: 2 },
                          { label: "Dispatched", step: 3 },
                          { label: "Resolved", step: 4 },
                        ].map((node) => {
                          const isActive = currentStep >= node.step;
                          const isSuccess = currentStep === 4 && node.step === 4;

                          return (
                            <div key={node.step} className="space-y-1">
                              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                                isActive 
                                  ? isSuccess 
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                                    : "bg-gradient-to-r from-sky-500 to-teal-400" 
                                  : "bg-slate-950"
                              }`} />
                              <span className={`text-[8px] font-mono block text-center truncate ${
                                isActive ? "text-slate-300 font-bold" : "text-slate-600"
                              }`}>
                                {node.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer actions */}
                    <div className="border-t border-slate-900/40 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <div className="flex items-center gap-1 text-slate-400 truncate max-w-[180px]" title={issue.locationName}>
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">{issue.locationName}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                        
                        {/* Interactive Upvote trigger */}
                        <button
                          onClick={() => handleUpvote(issue.id)}
                          disabled={upvotingIds.includes(issue.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                            user
                              ? "bg-slate-950/60 border-slate-850 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30"
                              : "bg-slate-950/20 border-slate-900/40 text-slate-500 cursor-not-allowed"
                          }`}
                          title={user ? "Support this dispatch (Upvote)" : "Sign in to support reports"}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${
                            upvotingIds.includes(issue.id) ? "animate-bounce text-emerald-400" : ""
                          }`} />
                          <span className="font-bold font-mono">{(issue.upvotes || []).length}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Dynamic Guidelines & Tips Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-emerald-400" />
          Active Safety & Civic Guidelines
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.length > 0 ? (
            tips.map((tip, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/30 border border-slate-850 p-5 space-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1 bg-gradient-to-bl from-teal-500/10 to-transparent text-teal-400 font-mono text-[9px]">
                  #{idx + 1}
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Guideline
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tip}
                </p>
              </div>
            ))
          ) : (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/30 border border-slate-850 p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-slate-800 rounded"></div>
                  <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
