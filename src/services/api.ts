import axios from "axios";
import { getIdToken } from "./firebase";
import { Issue, UserProfile, IssueAnalysisResponse } from "../types/index";

// Base API URL configuration
const API_BASE_URL = ""; // Relative URL points to port 3000 where our express proxy is listening

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Automatic request interceptor to attach Firebase Authentication Bearer ID Tokens
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Could not inject Firebase Token to outbound request:", err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fallback in-memory database of issues in case backend is offline
const FALLBACK_ISSUES_KEY = "civicsnap_fallback_issues";
const getFallbackIssues = (): Issue[] => {
  const data = localStorage.getItem(FALLBACK_ISSUES_KEY);
  if (!data) {
    const bootstrapIssues: Issue[] = [
      {
        id: "issue-1",
        title: "Broken Playground Swings",
        description: "Two swings at Glen Canyon Park are completely unchained and laying on the ground, creating a hazard for small children.",
        category: "PARK_MAINTENANCE",
        severity: "MEDIUM",
        authority: "Parks & Recreation Dept",
        summary: "The swing structures at Glen Canyon Park are detached and broken. Safe repairs are recommended to prevent child injuries.",
        locationName: "Glen Canyon Park, San Francisco",
        coordinates: { latitude: 37.7397, longitude: -122.4385 },
        status: "REPORTED",
        reporterUid: "mock-user-1",
        reporterName: "Officer Alex Mercer",
        createdAt: Date.now() - 24 * 60 * 60 * 1000,
        upvotes: ["mock-user-2"],
        volunteers: [],
      },
      {
        id: "issue-2",
        title: "Large Pavement Crater & Fragmented Asphalt",
        description: "A wide, hazardous pothole measuring over 3 feet across. Exposed rebar is visible, posing severe blowout dangers to evening commuters.",
        category: "ROAD_HAZARD",
        severity: "CRITICAL",
        authority: "Department of Public Works",
        summary: "Deep crater on Oakwood Lane Boulevard. Sharp asphalt erosion warrants immediate municipal patching.",
        locationName: "Oakwood Lane Blvd, Sector 7",
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        status: "WORK_IN_PROGRESS",
        reporterUid: "mock-user-2",
        reporterName: "Claire Redfield",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        upvotes: ["mock-user-1", "mock-user-3"],
        volunteers: ["mock-user-1"],
      }
    ];
    localStorage.setItem(FALLBACK_ISSUES_KEY, JSON.stringify(bootstrapIssues));
    return bootstrapIssues;
  }
  return JSON.parse(data);
};

const saveFallbackIssues = (issues: Issue[]) => {
  localStorage.setItem(FALLBACK_ISSUES_KEY, JSON.stringify(issues));
};

const awardLocalActionPoints = (points: number) => {
  const stored = localStorage.getItem("civicsnap_sandbox_user");
  if (stored) {
    try {
      const profile = JSON.parse(stored);
      profile.actionPoints = Math.max(0, (profile.actionPoints || 0) + points);
      localStorage.setItem("civicsnap_sandbox_user", JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to award local points:", e);
    }
  }
};

export const apiService = {
  /**
   * 1. Analyze Upload (Multimodal form-data to Gemini)
   */
  async analyzeImageUpload(file: File, locationName?: string): Promise<IssueAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (locationName) {
      formData.append("locationName", locationName);
    }

    try {
      const response = await apiClient.post<IssueAnalysisResponse>("/api/issues/analyze/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (err: any) {
      console.warn("analyzeImageUpload server request failed, utilizing local mock parser:", err);
      // Mock parsing helper in case server is not running yet
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        success: true,
        isMock: true,
        analysis: {
          title: "Civic Pavement Failure & Erosion",
          description: "An objective visual inspection reveals localized structural cracking and fragmentation. The adjacent sidewalk exhibits safety risks due to minor shifting.",
          category: "ROAD_HAZARD",
          severity: "MEDIUM",
          authority: "Department of Public Works",
          summary: `Hazardous pavement failure identified near ${locationName || "the sector coordinates"}. Recommended remedial actions: hot mix patching and warning signs placement.`,
        },
      };
    }
  },

  /**
   * 2. Submit New Issue Report to Firestore
   */
  async submitIssue(report: Partial<Issue>): Promise<any> {
    try {
      const response = await apiClient.post("/api/issues", report);
      return response.data;
    } catch (err) {
      console.warn("Backend submitIssue failed, writing to fallback memory:", err);
      // Fallback
      const issues = getFallbackIssues();
      const newIssue: Issue = {
        id: `local-${Math.random().toString(36).substr(2, 9)}`,
        title: report.title || "Untitled Issue",
        description: report.description || "",
        category: report.category || "ROAD_HAZARD",
        severity: report.severity || "MEDIUM",
        authority: report.authority || "Department of Public Works",
        summary: report.summary || "",
        locationName: report.locationName || "Unspecified Location",
        coordinates: report.coordinates || { latitude: 37.7749, longitude: -122.4194 },
        status: "REPORTED",
        reporterUid: report.reporterUid || "sandbox-current",
        createdAt: Date.now(),
        upvotes: [],
        volunteers: [],
      };
      issues.unshift(newIssue);
      saveFallbackIssues(issues);
      awardLocalActionPoints(50);
      return { success: true, id: newIssue.id, message: "Report saved locally." };
    }
  },

  /**
   * 3. Fetch All Issues Feed
   */
  async getIssues(): Promise<Issue[]> {
    try {
      const response = await apiClient.get<Issue[]>("/api/issues");
      return response.data;
    } catch (err) {
      console.warn("Backend getIssues failed, loading fallback local data:", err);
      return getFallbackIssues();
    }
  },

  /**
   * 4. Toggle Issue Upvote
   */
  async upvoteIssue(issueId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/api/issues/${issueId}/upvote`);
      return response.data;
    } catch (err) {
      console.warn("Backend upvote failed, syncing local memory:", err);
      const issues = getFallbackIssues();
      const issue = issues.find((i) => i.id === issueId);
      if (issue) {
        const uid = "mock-current-user"; // mock current
        if (issue.upvotes.includes(uid)) {
          issue.upvotes = issue.upvotes.filter((id) => id !== uid);
          awardLocalActionPoints(-10);
        } else {
          issue.upvotes.push(uid);
          awardLocalActionPoints(15);
        }
        saveFallbackIssues(issues);
        return { success: true, issue };
      }
      throw err;
    }
  },

  /**
   * 5. Join Volunteer Event
   */
  async volunteerForEvent(issueId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/api/issues/${issueId}/volunteer`);
      return response.data;
    } catch (err) {
      console.warn("Backend volunteer request failed, syncing local memory:", err);
      const issues = getFallbackIssues();
      const issue = issues.find((i) => i.id === issueId);
      if (issue) {
        const uid = "mock-current-user";
        if (!issue.volunteers.includes(uid)) {
          issue.volunteers.push(uid);
          awardLocalActionPoints(100);
        }
        saveFallbackIssues(issues);
        return { success: true, issue };
      }
      throw err;
    }
  },

  /**
   * 6. Retrieve User Profile from Firestore
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>("/api/auth/profile");
      return response.data;
    } catch (err) {
      console.warn("Backend getProfile failed, using local profile state:", err);
      // Return a robust default local mock profile
      const stored = localStorage.getItem("civicsnap_sandbox_user");
      if (stored) return JSON.parse(stored);
      
      const defaultProfile: UserProfile = {
        uid: "mock-current-user",
        name: "Citizen Defender",
        email: "citizen@civicsnap.org",
        picture: "https://api.dicebear.com/7.x/bottts/svg?seed=defender",
        soundEnabled: true,
        actionPoints: 150,
        createdAt: Date.now(),
      };
      localStorage.setItem("civicsnap_sandbox_user", JSON.stringify(defaultProfile));
      return defaultProfile;
    }
  },

  /**
   * 7. Update User Profile Settings
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<any> {
    try {
      const response = await apiClient.put("/api/auth/profile", updates);
      return response.data;
    } catch (err) {
      console.warn("Backend updateProfile failed, updating local state:", err);
      const stored = localStorage.getItem("civicsnap_sandbox_user");
      if (stored) {
        const profile = JSON.parse(stored);
        const updated = { ...profile, ...updates };
        localStorage.setItem("civicsnap_sandbox_user", JSON.stringify(updated));
        return { success: true, message: "Profile synchronized locally." };
      }
      throw err;
    }
  },

  /**
   * 8. Fetch Civic Leaderboard
   */
  async getLeaderboard(): Promise<UserProfile[]> {
    try {
      const response = await apiClient.get<UserProfile[]>("/api/leaderboard");
      return response.data;
    } catch (err) {
      console.warn("Backend getLeaderboard failed, loading default rankings:", err);
      const data = localStorage.getItem("civicsnap_sandbox_users");
      if (data) {
        return JSON.parse(data).sort((a: any, b: any) => b.actionPoints - a.actionPoints);
      }
      return [
        {
          uid: "mock-user-1",
          name: "Officer Alex Mercer",
          email: "alex@mercer.gov",
          picture: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
          soundEnabled: true,
          actionPoints: 1250,
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
        {
          uid: "mock-user-2",
          name: "Claire Redfield",
          email: "claire@stars.org",
          picture: "https://api.dicebear.com/7.x/bottts/svg?seed=claire",
          soundEnabled: true,
          actionPoints: 940,
          createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        },
        {
          uid: "mock-user-3",
          name: "Marcus Aurelius",
          email: "marcus@philosophy.edu",
          picture: "https://api.dicebear.com/7.x/bottts/svg?seed=marcus",
          soundEnabled: false,
          actionPoints: 720,
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        }
      ];
    }
  },
};
