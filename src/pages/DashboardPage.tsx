import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { Issue, Status } from "../types/index";
import { motion } from "motion/react";
import {
  Award,
  PlusCircle,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  Shield,
  Activity,
  UserCheck,
  Flame,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";

export const DashboardPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [volunteeredIssues, setVolunteeredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserContent() {
      if (!user) return;
      try {
        await refreshProfile(); // Refresh points
        const allIssues = await apiService.getIssues();
        const filtered = allIssues.filter((issue) => issue.reporterUid === user.uid);
        setUserIssues(filtered);

        const volunteered = allIssues.filter((issue) => issue.volunteers.includes(user.uid));
        setVolunteeredIssues(volunteered);
      } catch (err) {
        console.warn("Failed to retrieve dashboard reports list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUserContent();
  }, [user]);

  if (!user) {
    return (
      <div className="py-12 text-center text-slate-400">
        Please sign in to view your dashboard.
      </div>
    );
  }

  // Tally stats
  const level = Math.floor((user.actionPoints || 0) / 300) + 1;
  const currentLevelPoints = (user.actionPoints || 0) % 300;
  const pointsToNextLevel = 300 - currentLevelPoints;
  const levelProgressPercent = Math.min(100, (currentLevelPoints / 300) * 100);

  // Status counters
  const reportedCount = userIssues.length;
  const resolvedCount = userIssues.filter((i) => i.status === "RESOLVED").length;
  const progressCount = userIssues.filter((i) => i.status === "WORK_IN_PROGRESS" || i.status === "TRIAGED").length;

  // Categorize user contributions for the BarChart
  const categoriesList = ["ROAD_HAZARD", "WASTE_MANAGEMENT", "INFRASTRUCTURE", "PARK_MAINTENANCE"];
  const categoryNames: Record<string, string> = {
    ROAD_HAZARD: "Road Hazard",
    WASTE_MANAGEMENT: "Waste Management",
    INFRASTRUCTURE: "Infrastructure",
    PARK_MAINTENANCE: "Park Maintenance",
  };

  const hasData = userIssues.length > 0 || volunteeredIssues.length > 0;

  // Real or Fallback Data
  const chartData = categoriesList.map((cat) => {
    const reportsCount = userIssues.filter((i) => i.category === cat).length;
    const volunteerCount = volunteeredIssues.filter((i) => i.category === cat).length;
    
    return {
      name: categoryNames[cat] || cat,
      Reports: hasData ? reportsCount : [3, 1, 2, 0][categoriesList.indexOf(cat)], // Elegant mock values
      Volunteering: hasData ? volunteerCount : [2, 3, 1, 1][categoriesList.indexOf(cat)], // Elegant mock volunteer values
    };
  });

  // Status Breakdown for PieChart
  const rawStatusData = [
    { name: "Reported", value: userIssues.filter(i => i.status === "REPORTED").length, color: "#38bdf8" },
    { name: "Triaged", value: userIssues.filter(i => i.status === "TRIAGED").length, color: "#fbbf24" },
    { name: "In Progress", value: userIssues.filter(i => i.status === "WORK_IN_PROGRESS").length, color: "#f97316" },
    { name: "Resolved", value: userIssues.filter(i => i.status === "RESOLVED").length, color: "#34d399" },
  ];

  // If there's real data, use real values, otherwise use demo values
  const pieChartData = hasData 
    ? rawStatusData.filter(item => item.value > 0)
    : [
        { name: "Reported", value: 3, color: "#38bdf8" },
        { name: "Triaged", value: 1, color: "#fbbf24" },
        { name: "In Progress", value: 2, color: "#f97316" },
        { name: "Resolved", value: 4, color: "#34d399" },
      ];

  return (
    <div className="space-y-8 pb-20">
      {/* Upper Profile Stat Card */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/5 to-transparent pointer-events-none rounded-full"></div>
        
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
              alt={user.name}
              className="w-16 h-16 rounded-2xl bg-slate-850 border border-slate-700 object-cover"
            />
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{user.name}</h1>
              <p className="text-xs text-slate-400 font-mono">Citizen ID: {user.uid.substring(0, 10)}...</p>
            </div>
          </div>

          {/* Gamified Level Progress Bar */}
          <div className="space-y-2 w-full md:w-80">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Level {level}
              </span>
              <span className="text-xs font-bold text-teal-400 font-mono">
                {currentLevelPoints}/300 XP
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${levelProgressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 text-right font-mono">
              {pointsToNextLevel} Points until Level {level + 1}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Counter Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "My Total Snaps", count: reportedCount, icon: FileText, color: "text-sky-400" },
          { label: "Active Triages", count: progressCount, icon: Activity, color: "text-amber-400" },
          { label: "Issues Resolved", count: resolvedCount, icon: UserCheck, color: "text-emerald-400" },
          { label: "Action Points", count: user.actionPoints || 0, icon: Award, color: "text-teal-400 font-mono" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl bg-slate-900/20 backdrop-blur-sm border border-slate-900 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color.split(" ")[0]}`} />
              </div>
              <p className={`text-2xl font-bold text-white ${stat.color.includes("font-mono") ? "font-mono" : ""}`}>
                {stat.count}
              </p>
            </div>
          );
        })}
      </section>

      {/* My Contributions Analytics Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              My Contributions & Impact
            </h2>
            <p className="text-xs text-slate-400">
              A real-time telemetry dashboard representing your reports submitted and active volunteer commitments.
            </p>
          </div>
          {!hasData && (
            <span className="self-start sm:self-center px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-pulse">
              ✨ Practice Mode (Demo Data Activated)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bar Chart: Contributions by Category */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900/10 border border-slate-900 p-6 space-y-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-550/5 rounded-full pointer-events-none filter blur-2xl"></div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-300">Category Engagement</h3>
                <p className="text-[11px] text-slate-500">Distribution of your hazard snaps and volunteer coordination squads</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span className="text-slate-400">Snaps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-400">Volunteer</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      fontSize: "11px",
                      color: "#f8fafc"
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="Reports" name="Filed Snaps" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="Volunteering" name="Volunteer RSVPs" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Status Breakdown */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/10 border border-slate-900 p-6 space-y-4 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-550/5 rounded-full pointer-events-none filter blur-2xl"></div>
            <div>
              <h3 className="text-sm font-bold text-slate-300">Triage Status Progression</h3>
              <p className="text-[11px] text-slate-500">Active status phases for your community-reported incidents</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 items-center gap-4 py-1">
              <div className="h-40 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#f8fafc"
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                
                {/* Center Stats Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-white font-mono leading-none">
                    {hasData ? userIssues.length : 10}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono mt-1">
                    Snaps Filed
                  </span>
                </div>
              </div>

              {/* Status Legend List */}
              <div className="space-y-1.5">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs border-b border-slate-950 pb-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {item.value} {item.value === 1 ? "incident" : "incidents"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections split: left is issues, right is action list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Issues Filed queue */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200">
              My Active Reports
            </h2>
            <Link
              to="/create-report"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Snap New
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="h-24 bg-slate-900/20 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : userIssues.length > 0 ? (
            <div className="space-y-3">
              {userIssues.map((issue) => (
                <Link
                  key={issue.id}
                  to={`/report/${issue.id}`}
                  className="block rounded-2xl bg-slate-900/20 border border-slate-900 hover:border-slate-800 p-4 hover:bg-slate-900/40 transition group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
                          {issue.category.replace("_", " ")}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-950 border border-slate-800 text-teal-400 uppercase">
                          {issue.severity}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm md:text-base group-hover:text-sky-400 transition">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{issue.locationName}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-850 font-semibold uppercase">
                        {issue.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-3">
              <p className="text-slate-400 text-sm">No reports submitted under this citizen credential.</p>
              <Link
                to="/create-report"
                className="inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
              >
                File Your First Report
              </Link>
            </div>
          )}
        </section>

        {/* Right 1 col: Gamified action guidelines */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">
            Action Center
          </h2>
          <div className="rounded-2xl bg-slate-900/30 border border-slate-900 p-5 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Leveling Milestones
              </p>
              <div className="space-y-2.5">
                {[
                  { title: "Triage Reporter", points: "+50 pts", desc: "File a newly parsed multimodal hazard" },
                  { title: "Civic Endorser", points: "+15 pts", desc: "Support another citizen's active report" },
                  { title: "Cleanup Hero", points: "+100 pts", desc: "Enlist in a community volunteer cleanup event" }
                ].map((act, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-800/40 pb-2">
                    <div>
                      <p className="font-semibold text-slate-200">{act.title}</p>
                      <p className="text-[10px] text-slate-400">{act.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">{act.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
