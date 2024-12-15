import { defineStore } from 'pinia'
import { services } from '@/services'
import type { Task } from '@/types'
import { useProjectStore } from './projects'

const { tasks: taskApi } = services

/**
 * Сховище для керування задачами
 * Забезпечує централізоване керування станом задач,
 * включаючи створення, оновлення та видалення задач
 */
export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    /**
     * Отримує всі задачі для конкретного проекту
     */
    getTasksByProject: (state) => (projectId: string) =>
      state.tasks.filter((t) => t.projectId === projectId),

    /**
     * Отримує задачі проекту з певним статусом
     */
    getTasksByStatus: (state) => (projectId: string, status: Task['status']) =>
      state.tasks.filter((t) => t.projectId === projectId && t.status === status),
  },

  actions: {
    clearState() {
      this.tasks = []
      this.loading = false
      this.error = null
    },

    async fetchProjectTasks() {
      this.loading = true
      this.error = null
      try {
        const { data } = await taskApi.getAll()
        this.tasks = data
      } catch (err) {
        this.error = 'Failed to fetch tasks'
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    async createTask(task: Omit<Task, 'id'>) {
      try {
        const { data } = await taskApi.create(task)
        // this.tasks.push(data)
        return data
      } catch (err) {
        this.error = 'Failed to create task'
        console.error(err)
        throw err
      }
    },

    /**
     * Оновлює існуючу задачу
     * @param id ID задачі
     * @param updates Поля задачі для оновлення
     * @returns Оновлена задача
     */
    async updateTask(id: string, updates: Partial<Task>) {
      const index = this.tasks.findIndex((t) => t.id === id)

      if (index === -1) return
      try {
        const updatedTask = { ...this.tasks[index], ...updates }
        this.tasks[index] = updatedTask

        const { data } = await taskApi.update(id, updates)
        this.tasks[index] = data

        const projectStore = useProjectStore()
        await projectStore.updateProjectStatus(data.projectId)

        return data
      } catch (err) {
        // Відкатування змін в разі помилки
        await this.fetchProjectTasks()
        this.error = 'Failed to update task'
        console.error(err)
        throw err
      }
    },

    async deleteTask(id: string) {
      try {
        await taskApi.delete(id)
        this.tasks = this.tasks.filter((t) => t.id !== id)
      } catch (err) {
        this.error = 'Failed to delete task'
        console.error(err)
        throw err
      }
    },
  },
})
