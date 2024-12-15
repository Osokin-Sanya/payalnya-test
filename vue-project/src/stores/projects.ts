import { defineStore } from 'pinia'
import type { Project } from '@/types'
import { services } from '@/services'
import { updateProjectStatus } from '@/utils/projectStatus'
import { useTaskStore } from './tasks'

const { projects: projectApi } = services

/**
 * Сховище для керування проектами
 * Забезпечує централізоване управління станом проектів,
 * включаючи створення, оновлення та автоматичне оновлення статусу
 */
export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getProjectById: (state) => (id: string) => state.projects.find((p) => p.id === id),
  },

  actions: {
    async fetchProjects() {
      this.loading = true
      try {
        const { data } = await projectApi.getAll()
        this.projects = data

        const taskStore = useTaskStore()
        this.projects = this.projects.map((project) => {
          const projectTasks = taskStore.getTasksByProject(project.id)
          return updateProjectStatus(project, projectTasks)
        })
      } catch (err) {
        this.error = 'Failed to fetch projects'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async createProject(project: Omit<Project, 'id'>) {
      try {
        const { data } = await projectApi.create(project)
        this.projects.push(data)
        return data
      } catch (err) {
        this.error = 'Failed to create project'
        console.error(err)
        throw err
      }
    },

    /**
     * Оновлює статус проекту на основі статусів його завдань
     */
    async updateProjectStatus(projectId: string) {
      const project = this.projects.find((p) => p.id === projectId)
      if (!project) return

      const taskStore = useTaskStore()
      const projectTasks = taskStore.getTasksByProject(projectId)
      const updatedProject = updateProjectStatus(project, projectTasks)

      if (updatedProject !== project) {
        try {
          const { data } = await projectApi.update(projectId, {
            ...project,
            status: updatedProject.status,
          })
          const index = this.projects.findIndex((p) => p.id === projectId)
          if (index !== -1) {
            this.projects[index] = data
          }
        } catch (err) {
          this.error = 'Failed to update project status'
          console.error(err)
        }
      }
    },

    async deleteProject(id: string) {
      try {
        await projectApi.delete(id)
        this.projects = this.projects.filter((p) => p.id !== id)
      } catch (err) {
        this.error = 'Failed to delete project'
        console.error(err)
        throw err
      }
    },
  },
})
