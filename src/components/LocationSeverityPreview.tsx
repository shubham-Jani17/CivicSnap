import React, { useState } from "react";
import { Issue, Severity, Category } from "../types/index";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Search,
  MapPin,
  Flame,
  Activity,
  ArrowRight,
  ShieldAlert as AlertIcon,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

interface LocationSeverityPreviewProps {
  issues: Issue[];
}

interface SectorInfo {
  name: string;
  defaultCoords: { lat: number; lon: number };
  fallbackSeverity: string;
  activeCount: number;
  peakSeverity: string;
  issues: Issue[];
  categoriesCount: Record<string, number>;
}

export const LocationSeverityPreview: React.FC<LocationSeverityPreviewProps> = ({ issues }) => {
  const [selectedSectorName, setSelectedSectorName] = useState<string>("Sector 7 (Oakwood Line)");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Process issues into sectors
  const baseSectors = [
    { name: "Sector 7 (Oakwood Line)", defaultCoords: { lat: 37.7749, lon: -122.4194 }, fallbackSeverity: "HIGH" },
    { name: "Glen Canyon Area", defaultCoords: { lat: 37.7397, lon: -122.4385 }, fallbackSeverity: "MEDIUM" },
    { name: "Downtown Civic Center", defaultCoords: { lat: 37.7794, lon: -122.4169 }, fallbackSeverity: "LOW" },
    { name: "Mission District Hub", defaultCoords: { lat: 37.7599, lon: -122.4148 }, fallbackSeverity: "LOW" },
  ];

  const processedSectors: SectorInfo[] = baseSectors.map((sec) => {
    const keyword = sec.name.split(" ")[0].toLowerCase();
    const matchingIssues = issues.filter((issue) => {
      const loc = issue.locationName.toLowerCase();
      if (keyword === "sector" && loc.includes("sector 7")) return true;
      if (keyword === "glen" && loc.includes("glen canyon")) return true;
      if (keyword === "downtown" && loc.includes("civic center")) return true;
      if (keyword === "mission" && loc.includes("mission")) return true;
      return loc.includes(keyword);
    });

    const activeCount = matchingIssues.length;
    
    // Determine peak severity
    let peakSeverity = sec.fallbackSeverity;
    if (activeCount > 0) {
      if (matchingIssues.some((i) => i.severity === Severity.CRITICAL || i.severity === "CRITICAL")) {
        peakSeverity = "CRITICAL";
      } else if (matchingIssues.some((i) => i.severity === Severity.HIGH || i.severity === "HIGH")) {
        peakSeverity = "HIGH";
      } else if (matchingIssues.some((i) => i.severity === Severity.MEDIUM || i.severity === "MEDIUM")) {
        peakSeverity = "MEDIUM";
      } else {
        peakSeverity = "LOW";
      }
    }

    const categoriesCount: Record<string, number> = {};
    matchingIssues.forEach((i) => {
      categoriesCount[i.category] = (categoriesCount[i.category] || 0) + 1;
    });

    return {
      ...sec,
      activeCount,
      peakSeverity,
      issues: matchingIssues,
      categoriesCount,
    };
  });

  // Filter sectors by search query
  const filteredSectors = processedSectors.filter((sec) =>
    sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.issues.some((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSector = processedSectors.find((s) => s.name === selectedSectorName) || processedSectors[0];

  // Helper colors for severities
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/15 border-rose-500/20 text-rose-400",
          ping: "bg-rose-400",
          label: "Critical Threat Level",
          gradient: "from-rose-500/10 to-transparent",
        };
      case "HIGH":
        return {
          bg: "bg-amber-500/15 border-amber-500/20 text-amber-400",
          ping: "bg-amber-400",
          label: "High Safety Risk",
          gradient: "from-amber-500/10 to-transparent",
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-500/15 border-yellow-500/20 text-yellow-400",
          ping: "bg-yellow-400",
          label: "Moderate Threat",
          gradient: "from-yellow-500/10 to-transparent",
        };
      default:
        return {
          bg: "bg-teal-500/15 border-teal-500/20 text-teal-400",
          ping: "bg-teal-400",
          label: "Stable / Low Risk",
          gradient: "from-teal-500/10 to-transparent",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Regional Severity Monitor
          </h2>
          <p className="text-xs text-slate-400">
            Real-time public safety threats and street triage index by sector.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter sector or active hazard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Sectors List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredSectors.length > 0 ? (
            filteredSectors.map((sec) => {
              const sev = getSeverityBadgeClass(sec.peakSeverity);
              const isSelected = selectedSectorName === sec.name;

              return (
                <div
                  key={sec.name}
                  onClick={() => setSelectedSectorName(sec.name)}
                  className={`p-4 rounded-2xl border transition text-left cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-slate-900/50 border-teal-500/40 shadow-lg shadow-teal-500/5"
                      : "bg-slate-900/20 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${sev.gradient} pointer-events-none opacity-40`}></div>
                  
                  <div className="flex justify-between items-start gap-3 relative z-10">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition">
                        {sec.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] text-slate-400 font-mono">
                          GPS: {sec.defaultCoords.lat.toFixed(3)}, {sec.defaultCoords.lon.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1.5 ${sev.bg}`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sev.ping}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sev.ping}`}></span>
                        </span>
                        {sec.peakSeverity}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {sec.activeCount} Active Snaps
                      </span>
                    </div>
                  </div>

                  {/* Summary progress categories block */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex flex-wrap gap-2 relative z-10">
                    {Object.entries(sec.categoriesCount).length > 0 ? (
                      Object.entries(sec.categoriesCount).map(([cat, count]) => (
                        <span key={cat} className="text-[9px] bg-slate-950/60 border border-slate-850 px-1.5 py-0.5 rounded-md text-slate-300 font-mono uppercase">
                          {cat.toLowerCase().replace("_", " ")}: {count}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] text-slate-500 font-mono uppercase">
                        No recent community incidents reported
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 border border-dashed border-slate-850 rounded-2xl text-center text-slate-500 text-xs">
              No matching regional sectors found in municipal directory.
            </div>
          )}
        </div>

        {/* Right Side: Selected Sector Dashboard details */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSector.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-gradient-to-b from-slate-900/40 to-slate-950 border border-slate-900 p-6 space-y-6 relative overflow-hidden h-full shadow-xl"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/5 to-transparent pointer-events-none rounded-full"></div>

              {/* Detail Header */}
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                    Sector Overview Portal
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedSector.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    General jurisdiction aligned to local municipal repair cells.
                  </p>
                </div>

                <div className="text-right">
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${getSeverityBadgeClass(selectedSector.peakSeverity).bg}`}>
                    {getSeverityBadgeClass(selectedSector.peakSeverity).label}
                  </div>
                </div>
              </div>

              {/* Local Incident feed list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                    Incident Logs ({selectedSector.issues.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Updated live
                  </span>
                </div>

                {selectedSector.issues.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedSector.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2 group hover:border-slate-800 transition"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-slate-900 text-teal-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                                {issue.category.replace("_", " ")}
                              </span>
                              <span className="text-[9px] bg-slate-900 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                                {issue.severity}
                              </span>
                            </div>
                            <h5 className="font-semibold text-white text-xs group-hover:text-sky-400 transition">
                              {issue.title}
                            </h5>
                          </div>

                          <Link
                            to={`/report/${issue.id}`}
                            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {issue.summary || issue.description}
                        </p>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(issue.createdAt * 1000).toLocaleDateString()}
                          </span>
                          <span className="uppercase">{issue.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 bg-slate-950/30 rounded-2xl border border-dashed border-slate-850 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-3 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-full">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200">
                        Zero Active Hazards
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-xs">
                        This sector currently exhibits green-grade stability. No urgent threat drafts require community action.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Connected to regional GPS dispatcher cell.
                  </span>
                </div>
                
                <Link
                  to="/create-report"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 inline-flex items-center gap-1 hover:scale-[1.01] transition"
                >
                  Snap Issue in {selectedSector.name.split(" ")[0]}
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2px]" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
