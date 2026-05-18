import type { Example } from './prompt/builder.js';

export type { Example };

export interface SessionSummary {
  id: string;
  name: string;
  assignmentId: string | null;
  currentVersionNumber: number;
  versionsCount: number;
  queriesCount: number;
  flaggedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDetail extends SessionSummary {
  versions: Array<{
    id: string;
    versionNumber: number;
    examples: Example[];
    createdAt: string;
  }>;
}

export interface ChatHistoryItem {
  id: string;
  userPrompt: string;
  aiResponse: string;
  flagged: boolean;
  createdAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}
