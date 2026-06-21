import type { AssignmentType } from './llmTypes'

export interface AuthUser {
  id: string
  role: 'teacher' | 'student'
  name: string
  tenantId: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  fields?: Record<string, string[]>
}

export interface ClassSummary {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
  _count: { students: number }
}

export interface StudentRecord {
  id: string
  username: string
  displayName: string | null
  createdAt: string
}

export interface ClassDetail {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
  students: StudentRecord[]
}

export interface MLLabelSummary {
  id: string
  name: string
  imageCount: number
  images: { id: string }[]
}

export interface ClassMLProject {
  id: string
  clientId: string
  name: string
  modelTrained: boolean
  modelVersion: number
  trainedAt: string | null
  updatedAt: string
  student: { id: string; username: string; displayName: string | null }
  labels: MLLabelSummary[]
}

export interface Assignment {
  id: string
  classId: string
  title: string
  description: string
  type: AssignmentType
  dueAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  _count: { submissions: number }
}

export interface BotExample {
  input: string
  output: string
}

export interface BotSummary {
  id: string
  name: string
  instruction: string
  examples: BotExample[]
  classId: string | null
  createdAt: string
  updatedAt: string
}

export interface TeacherStats {
  classCount: number
  studentCount: number
  projectCount: number
  imagesLast24h: number
  lastSync: {
    updatedAt: string
    student: { username: string; displayName: string | null }
  } | null
}
