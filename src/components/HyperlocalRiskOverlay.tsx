import React, { useState } from "react";
import { Issue, Severity } from "../types/index";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Copy, 
  Check, 
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface HyperlocalRiskOverlayProps {
  issues: Issue[];
}

export const HyperlocalRiskOverlay: React.FC<HyperlocalRiskOverlayProps> = ({ issues }) => {
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);
  const [activeDraftIssue, setActiveDraftIssue] = useState<Issue | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter issues with coordinate metadata or just pick the top 4 severe ones for plotting
  // To ensure the map always looks beautiful and populated like the screenshot,
  // we'll pick up to 5 issues and assign them visually stunning, responsive coordinate anchors on our abstract canvas
  const displayIssues = issues
    .filter(i => i.status !== "RESOLVED")
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    })
    .slice(0, 5);

  // Pre-defined visual positions on our abstract map paths so they cluster beautifully like the screenshot
  const visualPositions = [
    { left: "75%", top: "42%" },  // Pink (Critical)
    { left: "82%", top: "54%" },  // Orange (High)
    { left: "88%", top: "66%" },  // Blue (Medium)
    { left: "35%", top: "28%" },  // Low / Medium (Green/Teal)
    { left: "55%", top: "58%" },  // Another Low
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500",
          border: "border-rose-400",
          text: "text-rose-400",
          glow: "shadow-rose-500/50",
          badgeBg: "bg-rose-500/10 border-rose-500/20",
        };
      case "HIGH":
        return {
          bg: "bg-amber-500",
          border: "border-amber-400",
          text: "text-amber-400",
          glow: "shadow-amber-500/50",
          badgeBg: "bg-amber-500/10 border-amber-500/20",
        };
      case "MEDIUM":
        return {
          bg: "bg-blue-500",
          border: "border-blue-400",
          text: "text-blue-400",
          glow: "shadow-blue-500/50",
          badgeBg: "bg-blue-500/10 border-blue-500/20",
        };
      default:
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-400",
          text: "text-emerald-400",
          glow: "shadow-emerald-500/50",
          badgeBg: "bg-emerald-500/10 border-emerald-500/20",
        };
    }
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-md border border-slate-850 p-6 space-y-4 relative overflow-hidden shadow-xl flex flex-col justify-between h-[450px]">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full pointer-events-none filter blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full pointer-events-none filter blur-2xl"></div>

      {/* Header Info */}
      <div className="flex justify-between items-center relative z-10 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-500/10">
          <Compass className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
          <span className="text-[10px] font-mono font-semibold text-slate-300 tracking-wider uppercase">
            NEIGHBORHOOD SECTOR 4
          </span>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
          REAL-TIME UPDATE
        </div>
      </div>

      {/* Title */}
      <div className="space-y-0.5 shrink-0">
        <h3 className="text-xl font-bold font-serif text-white italic tracking-wide">
          Hyperlocal Risk Overlay
        </h3>
      </div>

      {/* Abstract Map Canvas */}
      <div className="relative flex-1 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden my-2 min-h-[220px]">
        {/* SVG Street Paths - Custom styled curved streets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Curved Expressway */}
          <path 
            d="M -20,200 Q 150,120 280,220 T 450,150" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="opacity-60"
          />
          <path 
            d="M -20,200 Q 150,120 280,220 T 450,150" 
            fill="none" 
            stroke="#0ea5e9" 
            strokeWidth="1" 
            strokeDasharray="4 6"
            className="opacity-20 animate-pulse"
          />

          {/* Sector Secondary Arcs */}
          <path 
            d="M 120,-20 Q 180,150 160,300" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="opacity-40"
          />
          <path 
            d="M 300,-20 Q 250,140 380,320" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="opacity-50"
          />
          <path 
            d="M 300,-20 Q 250,140 380,320" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="0.75" 
            strokeDasharray="2 4"
            className="opacity-25"
          />

          <path 
            d="M 50,80 C 150,90 280,50 350,100" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="1.5" 
            className="opacity-40"
          />

          {/* Grid Intersections */}
          <circle cx="165" cy="115" r="2.5" fill="#334155" />
          <circle cx="270" cy="180" r="2.5" fill="#334155" />
          <circle cx="340" cy="92" r="2.5" fill="#334155" />
        </svg>

        {/* Dynamic / Falling Grid Dust particles for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

        {/* Interactive Mapped Pins */}
        {displayIssues.map((issue, idx) => {
          const pos = visualPositions[idx % visualPositions.length];
          const colors = getSeverityColor(issue.severity);
          const isHovered = hoveredIssue?.id === issue.id;

          return (
            <div
              key={issue.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
              style={{ left: pos.left, top: pos.top }}
              onMouseEnter={() => setHoveredIssue(issue)}
              onMouseLeave={() => setHoveredIssue(null)}
              onClick={() => setActiveDraftIssue(issue)}
            >
              {/* Ripple Ring */}
              <span className={`absolute -inset-2.5 rounded-full animate-ping opacity-25 pointer-events-none ${colors.bg}`}></span>
              
              {/* Outer Glow container */}
              <div className={`relative w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${colors.bg} ${colors.glow} hover:scale-115 active:scale-95`}>
                <MapPin className="w-4 h-4 text-white" />
                
                {/* Visual marker dot */}
                <span className="absolute bottom-[-2px] w-1 h-1 bg-white rounded-full"></span>
              </div>

              {/* Individual Miniature Hover Popup Card */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-48 bg-slate-950/95 border border-slate-800 p-2.5 rounded-xl shadow-xl backdrop-blur-md pointer-events-none z-50 text-left"
                  >
                    <div className="flex justify-between items-center gap-1.5 mb-1">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${colors.badgeBg} ${colors.text}`}>
                        {issue.severity}
                      </span>
                      <span className="text-[7px] text-slate-500 font-mono">
                        {issue.status}
                      </span>
                    </div>
                    <h4 className="text-[10px] font-bold text-white line-clamp-1">
                      {issue.title}
                    </h4>
                    <p className="text-[8px] text-slate-400 line-clamp-2 leading-normal mt-0.5">
                      {issue.description}
                    </p>
                    <div className="text-[7px] text-slate-500 font-mono mt-1 flex justify-between items-center">
                      <span className="truncate max-w-[100px]">📍 {issue.locationName}</span>
                      <span className="text-sky-400 font-bold">Click to draft</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Empty State warning if no issues */}
        {displayIssues.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-600" />
            <p className="text-[11px] text-slate-400 font-mono">No active issues found to plot overlay.</p>
          </div>
        )}
      </div>

      {/* Legend & Instructions Panel */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-3.5 space-y-2.5 shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-slate-400">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Low</span>
          </div>
        </div>
        <p className="text-[9px] text-slate-500 font-mono text-center">
          Hover pins to preview details; click to open official draft
        </p>
      </div>

      {/* Dynamic Slide-Over / Modal showing the Draft Complaint Letter */}
      <AnimatePresence>
        {activeDraftIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left overflow-hidden"
            >
              {/* Top Banner decoration */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 to-sky-500"></div>

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-400/5 border border-amber-400/10 px-2 py-0.5 rounded">
                    MUNICIPAL LETTER COMPILER
                  </span>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-sky-400" />
                    Civic Complaint Draft Letter
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Auto-generated formal notification addressing: <strong className="text-white">{activeDraftIssue.title}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveDraftIssue(null);
                    setCopied(false);
                  }}
                  className="p-1 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* The Compiled Letter Area */}
              <div className="bg-slate-950 border border-slate-950 rounded-2xl p-4 overflow-y-auto max-h-60 font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeDraftIssue.complaintLetterDraft || `MEMORANDUM OF COMPLAINT

TO: Municipal Public Works Department
REF: CS-${activeDraftIssue.id.substring(0, 8).toUpperCase()}
DATE: ${new Date(activeDraftIssue.createdAt * 1000).toLocaleDateString()}
SUBJECT: ${activeDraftIssue.title.toUpperCase()}

I am writing on behalf of the CivicSnap community regarding a persistent public safety issue located at ${activeDraftIssue.locationName}.

We have recorded a ${activeDraftIssue.severity.toLowerCase()}-severity incident categorized as a ${activeDraftIssue.category.replace("_", " ").toLowerCase()}.

DESCRIPTION:
${activeDraftIssue.description}

Our local coordination cell has cataloged verified coordinate telemetry for this spot. Immediate remediation is requested.

Sincerely,
CivicSnap Citizen Action Portal`}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <Link
                  to={`/report/${activeDraftIssue.id}`}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 transition"
                  onClick={() => setActiveDraftIssue(null)}
                >
                  View full report dossier
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyDraft(
                      activeDraftIssue.complaintLetterDraft || `SUBJECT: ${activeDraftIssue.title}\n\nLOCATION: ${activeDraftIssue.locationName}\n\nDESCRIPTION: ${activeDraftIssue.description}`
                    )}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Draft
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveDraftIssue(null);
                      setCopied(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold hover:brightness-110 transition"
                  >
                    Close Portal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
