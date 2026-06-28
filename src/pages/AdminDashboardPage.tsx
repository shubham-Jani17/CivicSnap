import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { apiService } from "../services/api";
import { Issue } from "../types/index";
import { Shield, Trash2, Edit3, CheckCircle, AlertTriangle, Clock, MapPin, X, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  
  // Insights state
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Form states for editing
  const [editStatus, setEditStatus] = useState<Issue["status"]>("REPORTED");
  const [editSeverity, setEditSeverity] = useState<Issue["severity"]>("MEDIUM");
  const [editCategory, setEditCategory] = useState<Issue["category"]>("ROAD_HAZARD");
  
  useEffect(() => {
    // Optionally check if user is admin here
    loadIssues();
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await apiService.getMonthlyInsights();
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const loadIssues = async () => {
    setLoading(true);
    try {
      const data = await apiService.getIssues();
      setIssues(data);
    } catch (err) {
      console.error("Failed to load issues for admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this issue?")) return;
    try {
      await apiService.deleteIssue(id);
      setIssues(issues.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Error deleting issue.");
    }
  };

  const handleEditClick = (issue: Issue) => {
    setEditingIssue(issue);
    setEditStatus(issue.status);
    setEditSeverity(issue.severity);
    setEditCategory(issue.category);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;
    try {
      await apiService.updateIssue(editingIssue.id, {
        status: editStatus,
        severity: editSeverity,
        category: editCategory
      });
      setIssues(issues.map(i => i.id === editingIssue.id ? { ...i, status: editStatus, severity: editSeverity, category: editCategory } : i));
      setEditingIssue(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating issue.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED": return <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-400 text-xs font-bold border border-teal-500/30">RESOLVED</span>;
      case "WORK_IN_PROGRESS": return <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">IN PROGRESS</span>;
      case "TRIAGED": return <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">TRIAGED</span>;
      default: return <span className="px-2 py-1 rounded bg-slate-500/20 text-slate-400 text-xs font-bold border border-slate-500/30">REPORTED</span>;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <Shield className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono">Administration</h2>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            System Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage and moderate community civic reports.</p>
        </div>
      </header>

      {/* AI Insights Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-sky-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-slate-100">AI Monthly Insights</h2>
          <span className="ml-2 text-xs font-mono px-2 py-1 bg-slate-950 border border-slate-700 text-slate-400 rounded-md">
            {insights?.month || "Loading..."}
          </span>
        </div>
        
        {loadingInsights ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full" />
            Analyzing reports via Gemini API...
          </div>
        ) : insights ? (
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Top Issues Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{insights.top_issues_summary}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Actionable Advice</h3>
                <p className="text-sm text-sky-300 bg-sky-950/30 p-3 rounded-lg border border-sky-900/50">{insights.actionable_advice}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Trend</h3>
              <div className="flex items-center gap-2">
                {insights.trend?.toLowerCase() === 'increasing' && <TrendingUp className="w-8 h-8 text-rose-400" />}
                {insights.trend?.toLowerCase() === 'decreasing' && <TrendingDown className="w-8 h-8 text-emerald-400" />}
                {insights.trend?.toLowerCase() === 'stable' && <Minus className="w-8 h-8 text-slate-400" />}
                <span className="text-lg font-semibold text-slate-200 capitalize">{insights.trend}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Failed to load insights.</div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase font-mono text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Issue Title</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {issues.map(issue => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={issue.id} 
                    className="hover:bg-slate-800/20 transition group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200 group-hover:text-sky-400 transition cursor-pointer" onClick={() => navigate(`/report/${issue.id}`)}>
                        {issue.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{issue.summary}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[150px]">{issue.locationName}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{issue.category.replace('_', ' ')}</td>
                    <td className="px-6 py-4">{getStatusBadge(issue.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(issue)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition"
                          title="Edit Status"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(issue.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                          title="Delete Issue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-mono text-sm">
                      No issues reported in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                Update Issue
              </h3>
              <button 
                onClick={() => setEditingIssue(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Issue Title</label>
                <div className="text-sm font-medium text-slate-200 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {editingIssue.title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="REPORTED">REPORTED</option>
                  <option value="TRIAGED">TRIAGED</option>
                  <option value="WORK_IN_PROGRESS">WORK IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Severity</label>
                <select 
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="ROAD_HAZARD">ROAD HAZARD</option>
                  <option value="SANITATION">SANITATION</option>
                  <option value="PARK_MAINTENANCE">PARK MAINTENANCE</option>
                  <option value="STREET_LIGHTING">STREET LIGHTING</option>
                  <option value="PUBLIC_SAFETY">PUBLIC SAFETY</option>
                  <option value="VANDALISM">VANDALISM</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-900/20 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
