<template>
  <div class="project-details" v-if="project">
    <div class="header">
      <div class="title-section">
        <router-link to="/" class="back-link">← Back to Projects</router-link>
        <h1>{{ project.name }}</h1>
        <span :class="['status-badge', project.status]">{{ project.status }}</span>
      </div>
      <button @click="showCreateTaskModal = true" class="btn-primary">Add Task</button>
    </div>

    <p class="description">{{ project.description }}</p>

    <div class="task-board">
      <div
        v-for="status in taskStatuses"
        :key="status"
        :data-status="status"
        class="task-column"
        :class="status"
      >
        <h3 class="column-title">
          {{ formatStatus(status) }}
          <span class="task-count">{{ localTasks[status].length }}</span>
        </h3>

        <Draggable
          v-model="localTasks[status]"
          class="list-group"
          ghost-class="ghost"
          group="tasks"
          :sort="true"
          item-key="id"
          @end="handleDragEnd"
          :animation="200"
          :delay="50"
          :delayOnTouchOnly="true"
        >
          <template #item="{ element: task }">
            <div class="task-card">
              <div class="task-header">
                <h4>{{ task.name }}</h4>
                <button class="delete-btn" @click="deleteTask(task.id)">×</button>
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
          </template>
        </Draggable>
      </div>
    </div>

    <!-- Create Task Modal -->
    <div v-if="showCreateTaskModal" class="modal">
      <div class="modal-content">
        <h2>Create New Task</h2>
        <form @submit.prevent="createTask">
          <div class="form-group">
            <label for="taskName">Task Name *</label>
            <input v-model="newTask.name" id="taskName" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="assignee">Assignee</label>
            <select v-model="newTask.assignedTo" id="assignee" class="form-input">
              <option value="">Unassigned</option>
              <option v-for="user in userStore.users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="endDate">Due Date</label>
            <input v-model="newTask.endDate" id="endDate" type="date" class="form-input" />
          </div>
          <div class="form-actions">
            <button type="button" @click="showCreateTaskModal = false" class="btn-secondary">
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { useUserStore } from '@/stores/users'
import Draggable from 'vuedraggable'

import type { Task } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
console.log(userStore.users);

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.getProjectById(projectId.value))

// Захист від невалідного ID проекту
watch(
  () => projectId.value,
  async (newId) => {
    if (!newId) {
      router.push({ name: 'projects' })
      return
    }

    if (!project.value) {
      await projectStore.fetchProjects()
      if (!project.value) {
        router.push({ name: 'projects' })
      }
    }
  },
  { immediate: true },
)

const taskStatuses = ['new', 'in-progress', 'done'] as const
const localTasks = ref<Record<string, Task[]>>({
  new: [],
  'in-progress': [],
  done: [],
})

// Оновлення локальних завдань при зміні завдань у store
watch(
  () => taskStore.tasks,
  (tasks) => {
    taskStatuses.forEach((status) => {
      localTasks.value[status] = taskStore
        .getTasksByStatus(projectId.value, status)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  },
  { deep: true },
)

const handleDragEnd = async (event: any) => {
  const task = event.item.__draggable_context.element
  console.log(event);
  
  const newStatus = event.to.parentElement.getAttribute('data-status')
  const newIndex = event.newIndex

  if (task && newStatus) {
    try {
      const updates: Partial<Task> = {
        status: newStatus,
        order: newIndex,
      }

      // Оптимістичне оновлення UI
      const oldStatus = task.status
      if (oldStatus !== newStatus) {
        const taskIndex = localTasks.value[oldStatus].findIndex((t) => t.id === task.id)
        if (taskIndex !== -1) {
          const [movedTask] = localTasks.value[oldStatus].splice(taskIndex, 1)
          movedTask.status = newStatus
          movedTask.order = newIndex
          localTasks.value[newStatus].splice(newIndex, 0, movedTask)
        }
      }

      await taskStore.updateTask(task.id, updates)
    } catch (error) {
      console.error('Failed to update task:', error)
      // Відновлення стану у разі помилки
      await taskStore.fetchProjectTasks()
    }
  }
}

const deleteTask = async (taskId: string) => {
  if (confirm('Are you sure you want to delete this task?')) {
    await taskStore.deleteTask(taskId)
  }
}

const createTask = async () => {
  try {
    const task = await taskStore.createTask({
      projectId: projectId.value,
      name: newTask.value.name,
      status: 'new',
      assignedTo: newTask.value.assignedTo || null,
      endDate: newTask.value.endDate ? new Date(newTask.value.endDate).getTime() : null,
    })

    // Оновлюємо локальний стан після створення завдання
    localTasks.value['new'] = [...localTasks.value['new'], task].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    )

    showCreateTaskModal.value = false
    newTask.value = { name: '', assignedTo: '', endDate: '' }
  } catch (error) {
    console.error('Failed to create task:', error)
  }
}

const newTask = ref({
  name: '',
  assignedTo: '',
  endDate: '',
})

const showCreateTaskModal = ref(false)

const formatStatus = (status: string): string => {
  switch (status) {
    case 'new':
      return 'To Do'
    case 'in-progress':
      return 'In Progress'
    case 'done':
      return 'Done'
    default:
      return status
  }
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}

const getUserName = (userId: string): string => {
  return userStore.getUserById(userId)?.name || 'Unknown'
}

onMounted(async () => {
  try {
    if (!project.value) {
      await projectStore.fetchProjects()
    }
    await taskStore.fetchProjectTasks()
    await userStore.fetchUsers()
  } catch (error) {
    console.error('Failed to initialize project details:', error)
    router.push({ name: 'projects' })
  }
})
 
onBeforeUnmount(() => {
  taskStore.clearState()
})
</script>

<style lang="scss" scoped>
.project-details {
  padding: 1.5rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;

      .back-link {
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
        transition:
          color 0.2s ease,
          transform 0.2s ease;

        &:hover {
          color: #374151;
          transform: translateX(-2px);
        }
      }

      h1 {
        margin: 0;
        font-size: 1.875rem;
        font-weight: 600;
        color: #1f2937;
      }
    }
  }

  .description {
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .task-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;

    .task-column {
      background: linear-gradient(to bottom, #ffffff, #f9fafb);
      border-radius: 1rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
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

      .column-title {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .task-count {
          margin-left: auto;
          background-color: #f3f4f6;
          color: #6b7280;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
      }

      .list-group {
        min-height: 50px;
        transition: background-color 0.2s ease;

        &:empty {
          background-color: rgba(0, 0, 0, 0.03);
          border-radius: 0.5rem;
          border: 2px dashed #e5e7eb;
        }
      }
    }
  }

  .task-card {
    position: relative;
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: move;
    will-change: transform;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;

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
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.375rem;
        transition: all 0.2s ease;
        line-height: 1;

        &:hover {
          background-color: #fee2e2;
          color: #dc2626;
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

    &:hover {
      transform: translateY(-2px) translate3d(0, 0, 0);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }

  .ghost {
    opacity: 0.5;
    background: #c8ebfb;
    border: 2px dashed #4a9eff;
    box-shadow: none;
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
    }
  }

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
</style>
