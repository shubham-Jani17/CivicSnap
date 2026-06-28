export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum Category {
  ROAD_HAZARD = "ROAD_HAZARD",
  WASTE_MANAGEMENT = "WASTE_MANAGEMENT",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  PARK_MAINTENANCE = "PARK_MAINTENANCE",
}

export enum Status {
  REPORTED = "REPORTED",
  TRIAGED = "TRIAGED",
  WORK_IN_PROGRESS = "WORK_IN_PROGRESS",
  RESOLVED = "RESOLVED",
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category | string;
  severity: Severity | string;
  authority: string;
  summary: string;
  locationName: string;
  coordinates: Coordinates;
  status: Status | string;
  reporterUid: string;
  reporterName?: string;
  createdAt: number; // Unix timestamp
  upvotes: string[]; // Array of user UIDs
  volunteers: string[]; // Array of user UIDs
  comments?: Comment[];
  complaintLetterDraft?: string;
  volunteerEvent?: {
    title: string;
    description: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  picture: string;
  soundEnabled: boolean;
  actionPoints: number;
  createdAt: number;
}

export interface IssueAnalysisResult {
  title: string;
  description: string;
  category: string;
  severity: string;
  authority: string;
  summary: string;
}

export interface IssueAnalysisResponse {
  success: boolean;
  isMock?: boolean;
  analysis: IssueAnalysisResult;
}
