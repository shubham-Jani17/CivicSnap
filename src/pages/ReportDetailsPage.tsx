import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { Issue, Comment } from "../types/index";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ArrowUp,
  Heart,
  Send,
  MessageSquare,
  FileText,
  AlertTriangle,
  Award,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Users,
  Download
} from "lucide-react";

export const ReportDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment input states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    async function loadIssueDetails() {
      if (!id) return;
      try {
        const feed = await apiService.getIssues();
        const found = feed.find((i) => i.id === id);
        if (found) {
          setIssue(found);
          // Load comments from localStorage for this issue to make it persistent
          const storedComments = localStorage.getItem(`civicsnap_comments_${id}`);
          if (storedComments) {
            setComments(JSON.parse(storedComments));
          } else {
            // Seed initial mock comments
            const defaultComments: Comment[] = [
              {
                id: "comment-1",
                userId: "mock-user-1",
                userName: "Officer Alex Mercer",
                userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
                text: "I visited this coordinates earlier. The hazard is indeed highly problematic during morning school hours. Submitting this draft is highly appropriate.",
                createdAt: Date.now() - 10 * 60 * 60 * 1000,
              },
              {
                id: "comment-2",
                userId: "mock-user-2",
                userName: "Claire Redfield",
                userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=claire",
                text: "Signed up for the cones warning volunteer squad. Planning to bring spare barricades around 5:00 PM.",
                createdAt: Date.now() - 4 * 60 * 60 * 1000,
              }
            ];
            localStorage.setItem(`civicsnap_comments_${id}`, JSON.stringify(defaultComments));
            setComments(defaultComments);
          }
        } else {
          setError("Incident dossier could not be located in public registries.");
        }
      } catch (err) {
        console.warn("Failed to load report dossier:", err);
        setError("Network gateway interrupted.");
      } finally {
        setLoading(false);
      }
    }
    loadIssueDetails();
  }, [id, user]);

  const handleUpvote = async () => {
    if (!issue) return;
    if (!user) {
      alert("Verification required. Please register/sign in to endorse civic actions.");
      return;
    }

    try {
      const res = await apiService.upvoteIssue(issue.id);
      if (res && res.success) {
        const userUid = user.uid;
        const hasUpvoted = issue.upvotes.includes(userUid);
        const updatedUpvotes = hasUpvoted
          ? issue.upvotes.filter((uid) => uid !== userUid)
          : [...issue.upvotes, userUid];
        setIssue({ ...issue, upvotes: updatedUpvotes });
        refreshProfile(); // Sync points
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVolunteer = async () => {
    if (!issue) return;
    if (!user) {
      alert("Verification required. Please register/sign in to join this volunteer cleanup event.");
      return;
    }

    try {
      const res = await apiService.volunteerForEvent(issue.id);
      if (res && res.success) {
        const userUid = user.uid;
        const isVolunteered = issue.volunteers.includes(userUid);
        const updatedVolunteers = isVolunteered ? issue.volunteers : [...issue.volunteers, userUid];
        setIssue({ ...issue, volunteers: updatedVolunteers });
        refreshProfile(); // Sync points (+100 XP!)
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user || !id) return;

    const newComment: Comment = {
      id: `comment-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      text: newCommentText.trim(),
      createdAt: Date.now(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(`civicsnap_comments_${id}`, JSON.stringify(updatedComments));
    setNewCommentText("");
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
        <p className="text-xs text-slate-400 font-mono">Retrieving incident dossier...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="py-12 text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Dossier Unavailable</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{error || "Dossier not found."}</p>
        <Link
          to="/feed"
          className="inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  const hasUpvoted = user ? issue.upvotes.includes(user.uid) : false;
  const isVolunteered = user ? issue.volunteers.includes(user.uid) : false;

  // Custom visual markdown draft compiler in case the report doesn't contain a draft
  const defaultMarkdownDraft = `### **Subject:** Urgent Remedial Request — public works safety alert near ${issue.locationName}

Dear Municipal Public Works Commissioner,

I am writing on behalf of the CivicSnap community sector regarding a reported visual hazard: **${issue.title}**.

An objective visual inspection classifies this issue as a **${issue.severity}** severity risk. Our citizens have documented localized structural cracking and safety concerns under the category **${issue.category.replace("_", " ")}**.

Given the surrounding community foot traffic, this safety defect poses immediate public hazards. We request your municipal department (**${issue.authority}**) dispatch technicians to evaluate and initiate safe patching.

Thank you for your active attention to neighborhood infrastructure.

Sincerely,  
*CivicSnap Citizen Action Portal*`;

  const exportPDF = () => {
    if (!issue) return;
    const rawText = issue.complaintLetterDraft || defaultMarkdownDraft;
    
    // Create new PDF instance
    const doc = new jsPDF("p", "mm", "a4");
    
    // Page dimensions
    const margin = 20;
    const pageWidth = 210;
    let yPos = 25;
    
    // Brand Header Strip (Teal colored)
    doc.setFillColor(20, 184, 166); // Teal
    doc.rect(margin, yPos, pageWidth - (margin * 2), 4, "F");
    
    yPos += 14;
    
    // Document Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("MUNICIPAL COMPLAINT DOSSIER", margin, yPos);
    yPos += 6;
    
    // Subtitle
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("GENERATED VIA CIVICSNAP CITIZEN REPAIR NETWORK", margin, yPos);
    yPos += 8;
    
    // Horizontal rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Metadata Block (2 columns)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    // Row 1
    doc.text("TICKET REF:", margin, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`CS-${issue.id.substring(0, 8).toUpperCase()}`, margin + 35, yPos);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("DATE REPORTED:", 115, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(new Date(issue.createdAt).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 155, yPos);
    
    yPos += 7;
    
    // Row 2
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("CATEGORY:", margin, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(issue.category.replace("_", " "), margin + 35, yPos);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("SEVERITY RATE:", 115, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(issue.severity, 155, yPos);
    
    yPos += 7;
    
    // Row 3
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("AUTHORITY:", margin, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(issue.authority || "Municipal Public Works Department", margin + 35, yPos);
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("INCIDENT STATUS:", 115, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(issue.status, 155, yPos);
    
    yPos += 7;

    // Row 4 (Location)
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("LOCATION:", margin, yPos);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(issue.locationName, margin + 35, yPos, { maxWidth: pageWidth - margin - (margin + 35) });

    yPos += 14;
    
    // Horizontal divider
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;
    
    // Letter Subject or Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("OFFICIAL COMPLAINT STATEMENT:", margin, yPos);
    yPos += 8;
    
    // Clean and split body text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    // Clean markdown characters from draft text
    const cleanLines = rawText
      .split("\n")
      .map(line => {
        // Strip markdown styling for PDF rendering
        let clean = line
          .replace(/###\s*\*\*Subject:\*\*\s*/i, "Subject: ")
          .replace(/###\s*/g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/__/g, "");
        return clean;
      });
      
    cleanLines.forEach(line => {
      if (line.trim() === "") {
        yPos += 5; // space between paragraphs
        return;
      }
      
      const wrapped = doc.splitTextToSize(line, pageWidth - (margin * 2));
      wrapped.forEach((textLine: string) => {
        if (yPos > 265) { // Page limit check, add new page if needed
          doc.addPage();
          yPos = 25;
        }
        doc.text(textLine, margin, yPos);
        yPos += 5.5;
      });
    });
    
    // Footer section
    yPos = 275;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 6;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This complaint dossier was assembled with verified coordinate telemetry and neighborhood consensus.", margin, yPos);
    
    // Save generated file
    doc.save(`CivicSnap_Complaint_CS-${issue.id.substring(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Upper Navigation Back bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sector Feed
        </Link>
        <span className="text-[10px] text-slate-500 font-mono">
          Report Reference: CS-{issue.id.substring(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 sections): Report details card and Markdown complaint letter */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Details block */}
          <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
                    {issue.category.replace("_", " ")}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-950 border border-slate-800 text-teal-400 uppercase">
                    {issue.severity}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {issue.title}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{issue.locationName}</span>
                </div>
              </div>

              <span className="text-[10px] px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-850 font-bold uppercase">
                {issue.status}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-900 pb-1.5">
                AI ANALYSIS SUMMARY
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {issue.summary || issue.description}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-900 pb-1.5">
                DETAILED INVESTIGATION REPORT
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {issue.description}
              </p>
            </div>

            {/* Support counters bar */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-900">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  hasUpvoted
                    ? "bg-sky-500/10 border-sky-400 text-sky-400"
                    : "bg-slate-950/60 border-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <ArrowUp className={`w-4 h-4 ${hasUpvoted ? "animate-bounce" : ""}`} />
                <span>{issue.upvotes.length} Citizen Upvotes</span>
              </button>
            </div>
          </section>

          {/* Markdown Complaint letter dossier */}
          <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Municipal Letter Draft
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const txt = issue.complaintLetterDraft || defaultMarkdownDraft;
                    navigator.clipboard.writeText(txt);
                    alert("Letter draft copied to clipboard.");
                  }}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/5 px-2.5 py-1.5 rounded-xl border border-sky-500/10"
                >
                  Copy Draft
                </button>
                <button
                  onClick={exportPDF}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-5 md:p-6 overflow-x-auto text-xs md:text-sm leading-relaxed font-sans">
              <div className="markdown-body">
                <ReactMarkdown>
                  {issue.complaintLetterDraft || defaultMarkdownDraft}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Volunteer RSVP card and comments section */}
        <div className="space-y-6">
          {/* Volunteer Event card */}
          <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-gradient-to-bl from-emerald-500/10 to-transparent text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
              Volunteering
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Community Alert event</h3>
              </div>
              <p className="text-xs font-bold text-emerald-400 font-sans">
                {issue.volunteerEvent?.title || `Safety Warning Cones Setup — CS-${issue.id.substring(0, 4).toUpperCase()}`}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {issue.volunteerEvent?.description || "Let's place safety markers or flags around this spot to warn other neighborhood commuters until county repair trucks arrive."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-slate-500 font-mono" />
                <span>Scheduled Date: Next Saturday</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Volunteers: {issue.volunteers.length} Citizens enlisted</span>
              </div>
            </div>

            <button
              onClick={handleVolunteer}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                isVolunteered
                  ? "bg-emerald-500/15 border-emerald-400 text-emerald-400 font-semibold"
                  : "bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-sky-500/5"
              }`}
            >
              <Heart className={`w-4 h-4 ${isVolunteered ? "fill-emerald-400 text-emerald-400" : ""}`} />
              {isVolunteered ? "Enlisted (100 Points Awarded)" : "RSVP & Earn 100 Points"}
            </button>
          </section>

          {/* Comments and safety logs thread */}
          <section className="rounded-3xl bg-slate-900/20 border border-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-900 pb-2.5">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              Safety Discussion ({comments.length})
            </h3>

            {/* List comment loops */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="text-xs space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img src={comment.userAvatar} alt={comment.userName} className="w-5 h-5 rounded-md object-cover bg-slate-800" />
                      <span className="font-semibold text-slate-300">{comment.userName}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed pl-1">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Input Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-900">
                <input
                  type="text"
                  placeholder="Post coordinate notes..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <p className="text-[10px] text-slate-500 text-center italic">
                Sign in to post coordinate logs.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
