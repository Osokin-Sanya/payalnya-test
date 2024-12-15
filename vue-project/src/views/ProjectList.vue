<template>
  <div class="project-list">
    <div class="header">
      <h1>Projects</h1>
      <button @click="showCreateModal = true" class="btn-primary">Add Project</button>
    </div>

    <div class="filters">
      <input
        v-model="filters.name"
        type="text"
        placeholder="Search by name..."
        class="filter-input"
      />
      <select v-model="filters.status" class="filter-select">
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <ResizableTable v-if="projectStore.loading === false" :columns="columns" @sort="handleSort">
      <tr
        v-for="project in filteredProjects"
        :key="project.id"
        @click="navigateToProject(project.id)"
        class="project-row"
      >
        <td>{{ project.id }}</td>
        <td>{{ project.name }}</td>
        <td>{{ getTaskCount(project.id) }}</td>
        <td>
          <span :class="['status-badge', project.status]">
            {{ project.status }}
          </span>
        </td>
        <td>{{ formatDate(project.createdAt) }}</td>
      </tr>
    </ResizableTable>

    <!-- Створити модель проекту   -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>Create New Project</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label for="name">Project Name *</label>
            <input v-model="newProject.name" id="name" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              v-model="newProject.description"
              id="description"
              class="form-input"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import ResizableTable from '@/components/ResizableTable.vue'
import type { TableColumn, FilterConfig, SortConfig, Project } from '@/types'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: 100 },
  { key: 'name', label: 'Name', sortable: true, width: 300 },
  { key: 'taskCount', label: 'Tasks', sortable: true, width: 100 },
  { key: 'status', label: 'Status', sortable: true, width: 150 },
  { key: 'createdAt', label: 'Created At', sortable: true, width: 200 },
]

const showCreateModal = ref(false)
const filters = ref<FilterConfig>({
  name: '',
  status: '',
})
const currentSort = ref<SortConfig>({
  key: 'createdAt',
  direction: 'desc',
})

const newProject = ref({
  name: '',
  description: '',
})

const filteredProjects = computed(() => {
  let result = [...projectStore.projects]

  if (filters.value.name) {
    result = result.filter((p) => p.name.toLowerCase().includes(filters.value.name!.toLowerCase()))
  }

  if (filters.value.status) {
    result = result.filter((p) => p.status === filters.value.status)
  }

  // Сортування проектів
  result.sort((a, b) => {
    const key = currentSort.value.key
    const modifier = currentSort.value.direction === 'asc' ? 1 : -1

    if (key === 'taskCount') {
      const aCount = getTaskCount(a.id)
      const bCount = getTaskCount(b.id)
      return (aCount - bCount) * modifier
    }

    if ((a[key as keyof Project] as any) < (b[key as keyof Project] as any)) return -1 * modifier
    if ((a[key as keyof Project] as any) > (b[key as keyof Project] as any)) return 1 * modifier

    return 0
  })

  return result
})

const getTaskCount = (projectId: string): number => {
  return taskStore.getTasksByProject(projectId).length
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString()
}

const handleSort = (sortConfig: SortConfig) => {
  currentSort.value = sortConfig
}

const navigateToProject = (id: string) => {
  router.push(`/project/${id}`)
}

const createProject = async () => {
  try {
    await projectStore.createProject({
      name: newProject.value.name,
      description: newProject.value.description,
      status: 'new',
      createdAt: Date.now(),
    })
    showCreateModal.value = false
    newProject.value = { name: '', description: '' }
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}

onMounted(async () => {
  await taskStore.fetchProjectTasks()
  await projectStore.fetchProjects()
})
</script>

<style lang="scss" scoped>
.project-list {
  padding: 1.5rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h1 {
      font-size: 1.875rem;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .project-row {
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0.375rem;

    &:hover {
      background-color: #f3f4f6;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.05);
    }

    td {
      padding: 1rem;
      color: #4b5563;
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

    &.completed {
      background-color: #d1fae5;
      color: #065f46;
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
    padding: 2rem;
    border-radius: 0.75rem;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
}

.form-input,
.filter-input,
.filter-select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  color: #1f2937;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-primary {
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  }
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #4b5563;

  &:hover {
    background-color: #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}
</style>
