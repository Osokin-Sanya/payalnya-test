import { defineStore } from "pinia";
import type { Project, ProjectStatus } from "@/types";
import { services } from "@/services";

import { useTaskStore } from "./tasks";

const { projects: projectApi } = services;

export const useProjectStore = defineStore("projects", {
  state: () => ({
    projects: [] as Project[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getProjectById: (state) => (id: string) =>
      state.projects.find((p) => p.id === id),
  },

  actions: {
    async fetchProjects() {
      this.loading = true;
      try {
        const { data } = await projectApi.getAll();
        this.projects = data;
      } catch (err) {
        this.error = "Failed to fetch projects";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async createProject(project: Omit<Project, "id">) {
      this.fetchProjects();

      try {
        const { data } = await projectApi.create(project);
        this.projects.push(data);
        return data;
      } catch (err) {
        this.error = "Failed to create project";
        console.error(err);
        throw err;
      }
    },

    async updateProjectStatus(projectId: string) {
      try {
        // Отримуємо tasks, пов'язані з проектом
        const taskStore = useTaskStore();
        const tasks = taskStore.getTasksByProject(projectId);

        if (!tasks || tasks.length === 0) {
          console.warn("No tasks found for this project");
          return;
        }

        // Визначаємо новий статус проекту
        let newStatus: ProjectStatus = "new";
        const hasInProgressTasks = tasks.some(
          (task) => task.status === "in-progress"
        );
        const hasDoneTasks = tasks.every((task) => task.status === "done");

        if (hasDoneTasks) {
          newStatus = "completed" as ProjectStatus;
        } else if (hasInProgressTasks) {
          newStatus = "in-progress";
        }

        // Знаходимо проект
        const project = this.getProjectById(projectId);
        if (!project) {
          console.error("Project not found");
          return;
        }

        // Якщо статус не змінився, виходимо
        if (project.status === newStatus) {
          console.log("Status is already up to date");
          return;
        }

        // Оновлюємо статус проекту, зберігаючи всі інші поля
        const updatedProject = {
          ...project,
          status: newStatus,
        };
        // Оновлюємо проект на сервері
        await services.projects.update(projectId, updatedProject);

        // Оновлюємо локальний стан
        project.status = newStatus;
        console.log(`Project ${projectId} status updated to ${newStatus}`);
      } catch (err) {
        console.error("Failed to update project status", err);
        throw err;
      }
    },

    async deleteProject(id: string) {
      try {
        await projectApi.delete(id);
        this.projects = this.projects.filter((p) => p.id !== id);
      } catch (err) {
        this.error = "Failed to delete project";
        console.error(err);
        throw err;
      }
    },
  },
});
