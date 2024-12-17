declare module "@tanstack/table-core" {
  interface ColumnMeta<TData, TValue> {
    enableFiltering?: boolean;
  }
}

export type ProjectStatus = "new" | "in-progress" | "done";

export type TaskStatus = "new" | "in-progress" | "done";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  status: TaskStatus;
  assignedTo: string | null;
  endDate: number | null;
  order?: number;
}

export interface User {
  id: string;
  name: string;
}
export interface ProjectWithTasks extends Project {
  tasks: number;
  enableFiltering?: boolean;
}
