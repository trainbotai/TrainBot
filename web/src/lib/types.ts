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
