// Types for LLM Module teacher views.

export type AssignmentType = 'ML_TRAINING' | 'LLM_TRAINING' | 'MIXED'

export interface LLMSessionSummary {
  id: string
  name: string
  assignmentId: string | null
  currentVersionNumber: number
  versionsCount: number
  queriesCount: number
  flaggedCount: number
  createdAt: string
  updatedAt: string
}

export interface LLMExample {
  user: string
  ai: string
}

export interface LLMSessionVersion {
  id: string
  versionNumber: number
  examples: LLMExample[]
  createdAt: string
}

export interface LLMSessionDetailWithQueries {
  id: string
  name: string
  assignmentId: string | null
  currentVersionNumber: number
  versionsCount: number
  queriesCount: number
  flaggedCount: number
  createdAt: string
  updatedAt: string
  versions: LLMSessionVersion[]
  queries: LLMChatItem[]
}

export interface LLMChatItem {
  id: string
  userPrompt: string
  aiResponse: string
  flagged: boolean
  createdAt: string
}

export interface LLMReport {
  id: string
  sessionId: string
  sessionName: string
  studentName: string
  reason: string | null
  reviewed: boolean
  reviewedAt: string | null
  createdAt: string
}

export interface LLMAssignmentSessionsResponse {
  sessions: LLMSessionSummary[]
}

export interface LLMReportsResponse {
  reports: LLMReport[]
}
