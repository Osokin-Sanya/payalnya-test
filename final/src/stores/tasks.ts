import { defineStore } from "pinia";
import { services } from "@/services";
import type { Task } from "@/types";
import { useProjectStore } from "./projects";

const { tasks: taskApi } = services;

// * Сховище для керування задачами
// * Забезпечує централізоване керування станом задач,
// * включаючи створення, оновлення та видалення задач
export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [] as Task[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getTasksByProject: (state) => (projectId: string) =>
      state.tasks.filter((t) => t.projectId === projectId),

    getTasksByStatus: (state) => (projectId: string, status: Task["status"]) =>
      state.tasks.filter(
        (t) => t.projectId === projectId && t.status === status
      ),
  },

  actions: {
    clearState() {
      this.tasks = [];
      this.loading = false;
      this.error = null;
    },

    async fetchProjectTasks() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await taskApi.getAll();
        this.tasks = data;
      } catch (err) {
        this.error = "Failed to fetch tasks";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async createTask(task: Omit<Task, "id">) {
      try {
        const { data } = await taskApi.create(task);

        return data;
      } catch (err) {
        this.error = "Failed to create task";
        console.error(err);
        throw err;
      }
    },

    async updateTask(updates: Partial<Task>) {
      try {
        await taskApi.update(updates);

        // Оновити локальний стан
        const taskIndex = this.tasks.findIndex((t) => t.id === updates.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
        }

        // Оновити статус проекту, якщо статус завдання змінився
        if ("status" in updates && updates.projectId) {
          const projectStore = useProjectStore();
          await projectStore.updateProjectStatus(updates.projectId);
        }
      } catch (err) {
        this.error = "Failed to update task";
        console.error(err);
        throw err;
      }
    },

    async deleteTask(taskId: string) {
      try {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Видаляємо завдання
        await services.tasks.delete(taskId);
        this.tasks = this.tasks.filter((t) => t.id !== taskId);

       // Оновлюємо статус проекту
        const projectStore = useProjectStore();
        await projectStore.updateProjectStatus(task.projectId);
      } catch (err) {
        console.error("Failed to delete task", err);
        throw err;
      }
    },
  },
});
