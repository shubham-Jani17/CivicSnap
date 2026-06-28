import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { Issue, Category, Severity, Status } from "../types/index";
import { motion, AnimatePresence } from "motion/react";
import { CivicMap } from "../components/CivicMap";
import {
  Search,
  Filter,
  ArrowUp,
  Heart,
  Users,
  MapPin,
  Calendar,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";

export const CommunityFeedPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");

  useEffect(() => {
    async function loadIssues() {
      try {
        const feed = await apiService.getIssues();
        setIssues(feed);
      } catch (err) {
        console.warn("Failed to fetch community issues feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, [user]);

  const handleUpvote = async (issueId: string) => {
    if (!user) {
      alert("Verification required. Please register/sign in to endorse civic actions.");
      return;
    }

    try {
      const res = await apiService.upvoteIssue(issueId);
      if (res && res.success) {
        // Optimistically update the upvotes list in local state
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue.id === issueId) {
              const userUid = user.uid;
              const hasUpvoted = issue.upvotes.includes(userUid);
              const updatedUpvotes = hasUpvoted
                ? issue.upvotes.filter((uid) => uid !== userUid)
                : [...issue.upvotes, userUid];
              return { ...issue, upvotes: updatedUpvotes };
            }
            return issue;
          })
        );
        refreshProfile(); // Sync points
      }
    } catch (err) {
      console.error("Failed to toggle upvote:", err);
    }
  };

  const handleVolunteer = async (issueId: string) => {
    if (!user) {
      alert("Verification required. Please register/sign in to volunteer.");
      return;
    }

    try {
      const res = await apiService.volunteerForEvent(issueId);
      if (res && res.success) {
        setIssues((prev) =>
          prev.map((issue) => {
            if (issue.id === issueId) {
              const userUid = user.uid;
              const isVolunteered = issue.volunteers.includes(userUid);
              const updatedVolunteers = isVolunteered ? issue.volunteers : [...issue.volunteers, userUid];
              return { ...issue, volunteers: updatedVolunteers };
            }
            return issue;
          })
        );
        refreshProfile(); // Sync points
      }
    } catch (err) {
      console.error("Failed to join volunteer squad:", err);
    }
  };

  // Run filters
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter ? issue.category === categoryFilter : true;
    const matchesSeverity = severityFilter ? issue.severity === severityFilter : true;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            Neighborhood Sector Feed
          </h1>
          <p className="text-xs text-slate-400">
            Real-time public hazard index & collaborative volunteer coordination
          </p>
        </div>
        <Link
          to="/create-report"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 shadow-md transition duration-150"
        >
          Snap New Issue
        </Link>
      </div>

      {/* Search & Filters Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reports, hazards, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-900 focus:border-teal-500/50 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-900 focus:border-teal-500/50 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none transition cursor-pointer"
          >
            <option value="" className="bg-slate-950">All Categories</option>
            <option value="ROAD_HAZARD" className="bg-slate-950">Road Hazards</option>
            <option value="WASTE_MANAGEMENT" className="bg-slate-950">Waste Management</option>
            <option value="INFRASTRUCTURE" className="bg-slate-950">Infrastructure Defects</option>
            <option value="PARK_MAINTENANCE" className="bg-slate-950">Park Maintenance</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-900 focus:border-teal-500/50 rounded-xl py-3 px-4 text-xs text-slate-300 focus:outline-none transition cursor-pointer"
          >
            <option value="" className="bg-slate-950">All Severities</option>
            <option value="LOW" className="bg-slate-950">Low Severity</option>
            <option value="MEDIUM" className="bg-slate-950">Medium Severity</option>
            <option value="HIGH" className="bg-slate-950">High Severity</option>
            <option value="CRITICAL" className="bg-slate-950">Critical Safety Threat</option>
          </select>
        </div>
      </div>

      {/* Geographical Distribution Interactive Map Panel */}
      {!loading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sector Geographic Map Anchors
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              {filteredIssues.filter(i => i.coordinates && typeof i.coordinates.latitude === 'number').length} of {filteredIssues.length} spots plotted
            </span>
          </div>
          <div className="h-[320px] w-full rounded-2xl overflow-hidden border border-slate-900 shadow-md">
            <CivicMap issues={filteredIssues} />
          </div>
        </div>
      )}

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-44 bg-slate-900/20 rounded-2xl animate-pulse border border-slate-900"></div>
          ))}
        </div>
      ) : filteredIssues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const hasUpvoted = user ? issue.upvotes.includes(user.uid) : false;
            const isVolunteered = user ? issue.volunteers.includes(user.uid) : false;

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-slate-900/20 border border-slate-900/80 hover:border-slate-800 p-5 space-y-4 transition"
              >
                {/* Upper Metadata */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider font-mono">
                        {issue.category.replace("_", " ")}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-950 border border-slate-800 text-teal-400 uppercase">
                        {issue.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(issue.createdAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-sky-400 transition">
                      <Link to={`/report/${issue.id}`}>{issue.title}</Link>
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{issue.locationName}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-xl bg-slate-950 text-slate-400 border border-slate-850 font-bold uppercase shrink-0">
                    {issue.status}
                  </span>
                </div>

                {/* Report Description Summary */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {issue.summary || issue.description}
                </p>

                {/* Footer Action buttons row */}
                <div className="flex items-center justify-between border-t border-slate-900 pt-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {/* Upvote button */}
                    <button
                      onClick={() => handleUpvote(issue.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                        hasUpvoted
                          ? "bg-sky-500/10 border-sky-400 text-sky-400"
                          : "bg-slate-950/60 border-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      <ArrowUp className={`w-3.5 h-3.5 ${hasUpvoted ? "animate-bounce" : ""}`} />
                      <span>{issue.upvotes.length}</span>
                    </button>

                    {/* Volunteer RSVP button */}
                    <button
                      onClick={() => handleVolunteer(issue.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        isVolunteered
                          ? "bg-emerald-500/10 border-emerald-400 text-emerald-400"
                          : "bg-slate-950/60 border-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>{isVolunteered ? "Volunteering" : "Join Cleanup"}</span>
                      {issue.volunteers.length > 0 && (
                        <span className="font-mono text-[10px] opacity-75">({issue.volunteers.length})</span>
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/report/${issue.id}`}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
          No active civic reports found matching filters.
        </div>
      )}
    </div>
  );
};
