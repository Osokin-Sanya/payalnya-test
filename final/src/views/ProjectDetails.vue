<template>
  <div class="project-details">
    <div class="header" v-if="project">
      <div class="title-section">
        <router-link to="/" class="back-link">← Back to Projects</router-link>
        <h1>{{ project.name }}</h1>
        <div>{{ project.description }}</div>
        <span :class="['status-badge', project.status]">{{
          project.status
        }}</span>
      </div>
      <button @click="showCreateTaskModal = true" class="btn-primary">
        Add Task
      </button>
    </div>

    <div class="task-board">
      <div
        v-for="status in taskStatuses"
        :key="status"
        :data-status="status"
        class="task-column"
        :class="status"
      >
        <h3 class="column-title">
          <span>{{ formatStatus(status) }} </span>
          <span class="task-count"> {{ localTasks[status].length }}</span>
        </h3>
        <VueDraggableNext
          class="dragArea list-group"
          :list="localTasks[status]"
          @end="handleDragEnd"
          :group="{ name: 'shared', pull: true, put: true }"
        >
          <div
            class="list-group-item"
            v-for="task in localTasks[status]"
            :key="task.id"
            :data-id="task.id"
          >
            <div class="task-card">
              <div class="task-header">
                <h4>{{ task.name }}</h4>
                <button class="delete-btn" @click="deleteTask(task.id)">
                  ×
                </button>
              </div>

              <div class="task-meta">
                <span v-if="task.assignedTo" class="assignee">
                  {{ getUserName(task.assignedTo) }}
                </span>
                <div class="task-dates">
                  <span v-if="task.endDate" class="due-date">
                    Due: {{ formatDate(task.endDate) }}
                  </span>
                  <span class="due-date"> ID: {{ task.id }} </span>
                </div>
              </div>
            </div>
          </div>
        </VueDraggableNext>
      </div>
    </div>
    <div v-if="showCreateTaskModal" class="modal">
      <div class="modal-content">
        <h2>Create New Task</h2>
        <form @submit.prevent="createTask">
          <div class="form-group">
            <label for="taskName">Task Name *</label>
            <input
              v-model="newTask.name"
              id="taskName"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="assignee">Assignee</label>
            <select
              v-model="newTask.assignedTo"
              id="assignee"
              class="form-input"
            >
              <option value="">Unassigned</option>
              <option
                v-for="user in userStore.users"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="endDate">Due Date</label>
            <input
              v-model="newTask.endDate"
              id="endDate"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-actions">
            <button
              type="button"
              @click="showCreateTaskModal = false"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { Task, TaskStatus } from "@/types";
import { VueDraggableNext } from "vue-draggable-next";
import { useRoute, useRouter } from "vue-router";
import { useProjectStore } from "@/stores/projects";
import { useTaskStore } from "@/stores/tasks";
import { useUserStore } from "@/stores/users";

const showCreateTaskModal = ref(false);
const taskStatuses = <TaskStatus[]>["new", "in-progress", "done"];
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const taskStore = useTaskStore();
const userStore = useUserStore();
const projectId = computed(() => route.params.id);
const project = computed(() =>
  projectStore.getProjectById(projectId.value as string)
);

const localTasks = ref<Record<string, Task[]>>({
  new: [],
  "in-progress": [],
  done: [],
});
const newTask = ref({
  name: "",
  assignedTo: "",
  endDate: "",
});
const deleteTask = async (taskId: string) => {
  if (confirm("Are you sure you want to delete this task?")) {
    await taskStore.deleteTask(taskId);
  }
};
const createTask = async () => {
  try {
    const task = await taskStore.createTask({
      projectId: projectId.value as string,
      name: newTask.value.name,
      status: "new",
      assignedTo: newTask.value.assignedTo || null,
      endDate: newTask.value.endDate
        ? new Date(newTask.value.endDate).getTime()
        : null,
    });

    // Оновлюємо локальний стан після створення завдання
    localTasks.value["new"] = [...localTasks.value["new"], task].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    showCreateTaskModal.value = false;
    newTask.value = { name: "", assignedTo: "", endDate: "" };
  } catch (error) {
    console.error("Failed to create task:", error);
  }
};
const handleDragEnd = async (event: any) => {
  const { newIndex } = event;
  const taskId = event.item.getAttribute("data-id");
  const newStatus = event.to.parentElement.getAttribute("data-status");

  if (!taskId || !newStatus) {
    console.error("Invalid task ID or status");
    return;
  }

  const currentTask = taskStore.tasks.find((task) => task.id === taskId);

  if (!currentTask) {
    console.error("Task not found:", taskId);
    return;
  }

  try {
    const updates: Partial<Task> = {
      ...currentTask,
      status: newStatus,
      order: newIndex,
    };

    await taskStore.updateTask(updates);
  } catch (error) {
    console.error("Failed to update task:", error);
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "new":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
};
watch(
  () => taskStore.tasks,
  (tasks) => {
    taskStatuses.forEach((status) => {
      localTasks.value[status] = tasks
        .filter((task) => {
          return task.status === status && task.projectId === projectId.value;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  },
  { deep: true }
);

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

const getUserName = (userId: string): string => {
  return userStore.getUserById(userId)?.name || "Unknown";
};

onMounted(async () => {
  try {
    if (!project.value) {
      await projectStore.fetchProjects();
    }
    await taskStore.fetchProjectTasks();
    await userStore.fetchUsers();
  } catch (error) {
    console.error("Failed to initialize project details:", error);
    router.push({ name: "projects" });
  }
});
</script>

<style scoped lang="scss">
.header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin: 15px auto;

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    .back-link {
      text-decoration: none;
      color: #4a90e2;
      font-size: 0.9rem;

      &:hover {
        background: none;
      }
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
      color: #333;
    }

    div {
      font-size: 1rem;
      color: #666;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
      text-transform: capitalize;

      &.active {
        background-color: #4caf50;
        color: white;
      }

      &.completed {
        background-color: #17ad2b;
        color: white;
      }

      &.pending {
        background-color: #ffc107;
        color: white;
      }
    }
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    background-color: #4caf50;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;

    &:hover {
      background-color: #45a049;
    }
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;

    &.new {
      background-color: #f3f4f6;
      color: #4b5563;
    }

    &.in-progress {
      background-color: #dbeafe;
      color: #1e40af;
    }

    &.done {
      background-color: #d1fae5;
      color: #065f46;
    }
  }
}

.dragArea {
  display: flex;
  flex-direction: column;
  min-height: 50%;
  background: linear-gradient(145deg, #f0f4f8, #e1e9f0);
  border: 2px solid #dfe6eb;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.list-group-item {
  font-size: 1.125rem;
  font-weight: 600;
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 1rem;
  padding: 12px;
  cursor: grab;
  transition: all 0.2s ease;
  margin: 8px;
}

.list-group-item:hover {
  background-color: #f7fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dragArea:hover {
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.dragArea:active .list-group-item {
  cursor: grabbing;
}
.task-board {
  display: flex;
  gap: 1rem;
  .task-column {
    min-width: 300px;
    background-color: #f7fafc;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 8px;
    min-height: 300px;

    .column-title {
      display: flex;
      padding: 0 15px;
      margin: 10px 0;
      span:first-child {
        font-weight: 600;
      }

      .task-count {
        margin-left: auto;
        background-color: #f3f4f6;
        color: #6b7280;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 500;
      }
    }
    &.new {
      border-top: 4px solid #3b82f6;
      .column-title {
        color: #2563eb;
      }
    }

    &.in-progress {
      border-top: 4px solid #8b5cf6;
      .column-title {
        color: #6d28d9;
      }
    }

    &.done {
      border-top: 4px solid #10b981;
      .column-title {
        color: #059669;
      }
    }
  }
}

.task-card {
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: #111827;
    }

    .delete-btn {
      cursor: pointer;

      &:hover {
        color: #ff0000;
      }
    }
  }

  .task-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #6b7280;

    .assignee {
      background-color: #f3f4f6;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      color: #4b5563;
      font-weight: 500;
      margin: auto 0;
    }

    .task-dates {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: right;

      .due-date {
        color: #9ca3af;
      }
    }
  }
}
.modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);

  .modal-content {
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    width: 100%;
    max-width: 28rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0 0 1.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
      }

      input,
      select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        color: #1f2937;
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      .btn-primary {
        background-color: #3b82f6;
        color: white;
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #2563eb;
        }
      }

      .btn-secondary {
        background-color: #f3f4f6;
        color: #4b5563;
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #e5e7eb;
        }
      }
    }
  }
}
</style>
