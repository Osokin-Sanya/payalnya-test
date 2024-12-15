export type ProjectStatus = 'new' | 'in-progress' | 'done'

export type TaskStatus = 'new' | 'in-progress' | 'done'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  createdAt: number
}

export interface Task {
  id: string
  projectId: string
  name: string
  status: TaskStatus
  assignedTo: string | null
  endDate: number | null
  order?: number
}

export interface User {
  id: string
  name: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: number
}

export interface SortConfig {
  key: string // Ключ для сортування
  direction: 'asc' | 'desc' // Напрямок сортування
}

export interface FilterConfig {
  name?: string
  status?: string
}
