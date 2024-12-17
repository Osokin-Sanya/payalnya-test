<template>
  <div class="p-2">
    <div class="header">
      <h1>Projects</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        Add Project
      </button>
    </div>

    <div>
      <DebouncedInput
        :modelValue="globalFilter ?? ''"
        @update:modelValue="(value:any) => (globalFilter = String(value))"
        className="debounced-input"
        placeholder="Search all columns..."
      />
    </div>
    <table>
      <thead>
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="headerGroup"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :colSpan="header.colSpan"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
            <template
              v-if="
                header.column.getCanFilter() &&
                !header.column.columnDef.meta?.enableFiltering
              "
            >
              <Filter :column="header.column" :table="table" />
            </template>
          </th>
        </tr>
      </thead>
    </table>
    <table>
      <thead>
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :colSpan="header.colSpan"
            :class="
              header.column.getCanSort() ? 'cursor-pointer select-none ' : ''
            "
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <template v-if="!header.isPlaceholder" class="column-name">
              <div class="column-name">
                <div>
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </div>
                <div>
                  {{
                    { asc: " 🔼", desc: " 🔽" }[
                      header.column.getIsSorted() as string
                    ]
                  }}
                </div>
              </div>
            </template>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in table.getRowModel().rows.slice(0, 10)"
          :key="row.id"
          @click="navigateToProject(row.original.id)"
        >
          <td v-for="cell in row.getVisibleCells()" :key="cell.id">
            <FlexRender
              :render="cell.column.columnDef.cell"
              :props="cell.getContext()"
            />
          </td>
        </tr>
      </tbody>

      <tfoot>
        <tr
          v-for="footerGroup in table.getFooterGroups()"
          :key="footerGroup.id"
        >
          <th
            v-for="header in footerGroup.headers"
            :key="header.id"
            :colSpan="header.colSpan"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.footer"
              :props="header.getContext()"
            />
          </th>
        </tr>
      </tfoot>
    </table>

    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>Create New Project</h2>
        <form @submit.prevent="createProject">
          <div class="form-group">
            <label for="name">Project Name *</label>
            <input
              v-model="newProject.name"
              id="name"
              type="text"
              required
              class="form-input"
            />
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
            <button
              type="button"
              @click="showCreateModal = false"
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
import { ref, watch, onMounted, computed } from "vue";
import { useProjectStore } from "@/stores/projects";
import { useTaskStore } from "@/stores/tasks";
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
  getSortedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
} from "@tanstack/vue-table";
import type { ColumnFiltersState } from "@tanstack/table-core";

import type { Project, ProjectWithTasks } from "@/types";
import DebouncedInput from "@/components/DebouncedInput.vue";
import Filter from "@/components/Filter.vue";
import { useRouter } from "vue-router";
import { columns } from "./column.config";

const projectStore = useProjectStore();
const taskStore = useTaskStore();
const dataProject = ref<Project[]>([]);
const showCreateModal = ref(false);

const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref("");
const currentTask = ref<any>([]);
const router = useRouter();
const navigateToProject = (projectId: string) => {
  router.push(`/project/${projectId}`);
};
const newProject = ref({
  name: "",
  description: "",
});

const projectsWithTasks = computed<ProjectWithTasks[]>(() => {
  return dataProject.value.map((project) => ({
    ...project,
    tasks: taskStore.getTasksByProject(project.id).length,
  }));
});

const sorting = ref<any>([]);

const table = useVueTable({
  get data() {
    return projectsWithTasks.value;
  },
  columns,
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
  },
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting.value)
        : updaterOrValue;
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters.value)
        : updaterOrValue;
  },
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === "function"
        ? updaterOrValue(globalFilter.value)
        : updaterOrValue;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
  debugTable: true,
});

watch(
  () => projectStore.projects,
  () => {
    dataProject.value = projectStore.projects;
  }
);

const createProject = async () => {
  try {
    await projectStore.createProject({
      name: newProject.value.name,
      description: newProject.value.description,
      status: "new",
      createdAt: Date.now(),
    });
    showCreateModal.value = false;
    newProject.value = { name: "", description: "" };
  } catch (error) {
    console.error("Failed to create project:", error);
  }
};

onMounted(async () => {
  try {
    await projectStore.fetchProjects();
    await taskStore.fetchProjectTasks();
    dataProject.value = projectStore.projects.map((project) => ({
      ...project,
      tasks: taskStore.getTasksByProject(project.id).length,
      enableFiltering: false,
    }));
    for (const project of projectStore.projects) {
      await projectStore.updateProjectStatus(project.id);
    }
  } catch (err) {
    console.error(err);
  }
});
</script>

<style lang="scss" scoped>
.p-2 {
  padding: 1rem;
  font-family: Arial, sans-serif;
  color: #333;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h1 {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0;
    }

    .btn-primary {
      padding: 0.5rem 1rem;
      background-color: #4caf50;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;

      &:hover {
        background-color: #45a049;
      }
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;

    thead {
      background-color: #f4f4f4;
      .headerGroup {
        display: flex;
        align-items: stretch;
      }

      th {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid #ddd;

        &.cursor-pointer {
          cursor: pointer;
          user-select: none;
        }
      }

      .column-name {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    tbody {
      tr {
        transition: background-color 0.2s;
        cursor: zoom-in;
        &:hover {
          background-color: #f9f9f9;
        }

        td {
          padding: 0.5rem;
          border-bottom: 1px solid #ddd;
        }
      }
    }

    tfoot {
      th {
        padding: 0.5rem;
        background-color: #f4f4f4;
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;

    .modal-content {
      background-color: #fff;
      padding: 1.5rem;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;

      h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.25rem;
        text-align: center;
      }

      .form-group {
        margin-bottom: 1rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #4caf50;
            box-shadow: 0 0 3px rgba(76, 175, 80, 0.5);
          }
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;

        .btn-secondary {
          background-color: #ccc;
          color: #333;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background-color: #bbb;
          }
        }

        .btn-primary {
          background-color: #4caf50;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background-color: #45a049;
          }
        }
      }
    }
  }

  .debounced-input{
    width: 50%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    margin: 10px auto;
  }
}
</style>
