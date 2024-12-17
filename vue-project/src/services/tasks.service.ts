/**
 * Сервіс для роботи з задачами через API
 * Надає методи для CRUD операцій з задачами
 */

import type { Task } from "@/types";
import { api } from "./api";

export const tasks = {
  async getAll() {
    return api.get<Task[]>("/tasks");
  },

  async get(taskId: Task["id"]) {
    return api.get<Task>(`/tasks/${taskId}`);
  },

  async create(task: Omit<Task, "id">) {
    return api.post<Task>("/tasks", task);
  },

  async update(params:  Partial<Task>) {
    const { id: taskId, ...dto } = params;
    return api.put<Task>(`/tasks/${taskId}`, dto);
  },

  async delete(id: string) {
    return api.delete(`/tasks/${id}`);
  },
};
