import type { Project } from '@/types'
import { api } from './api'

export const projects = {
  async getAll() {
    return api.get<Project[]>('/projects')
  },

  async get(projectId: Project['id']) {
    return api.get<Project>(`/projects/${projectId}`)
  },

  async create(dto: Omit<Project, 'id'>) {
    return api.post<Project>('/projects', dto)
  },

  async update(projectId: Project['id'], updates: Partial<Project>) {
    console.log(updates);
    
    return api.put<Project>(`/projects/${projectId}`, updates)
  },

  async delete(projectId: Project['id']) {
    return api.delete(`/projects/${projectId}`)
  },
}
