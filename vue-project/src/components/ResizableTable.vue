<template>
  <div class="resizable-table">
    <table>
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width + 'px' }"
            @click="column.sortable && sort(column.key)"
          >
            <div class="th-content">
              {{ column.label }}
              <span v-if="column.sortable" class="sort-icon">
                {{ getSortIcon(column.key) }}
              </span>
            </div>
            <div
              v-if="column.width"
              class="resize-handle"
              @mousedown="startResize($event, column)"
            ></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn, SortConfig } from '@/types'

const props = defineProps<{
  columns: TableColumn[]
}>()

const emit = defineEmits<{
  (e: 'sort', sortConfig: SortConfig): void
}>()

const currentSort = ref<SortConfig>({ key: '', direction: 'asc' })

const sort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value = { key, direction: 'asc' }
  }
  emit('sort', currentSort.value)
}

const getSortIcon = (key: string): string => {
  if (currentSort.value.key !== key) return '↕'
  return currentSort.value.direction === 'asc' ? '↑' : '↓'
}

const startResize = (event: MouseEvent, column: TableColumn) => {
  const startX = event.pageX
  const startWidth = column.width || 0

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const diff = moveEvent.pageX - startX
    column.width = Math.max(100, startWidth + diff)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<style lang="scss" scoped>
.resizable-table {
  width: 100%;

  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    th,
    td {
      padding: 0.875rem 1rem;
      text-align: left;
      transition: background-color 0.2s ease;

      &:first-child {
        padding-left: 1.5rem;
      }

      &:last-child {
        padding-right: 1.5rem;
      }
    }

    thead {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1px;
        background-color: #e5e7eb;
      }
    }

    th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
      position: relative;
      user-select: none;
      white-space: nowrap;

      &:first-child {
        border-top-left-radius: 0.5rem;
      }

      &:last-child {
        border-top-right-radius: 0.5rem;
      }

      .th-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.25rem 0;

        .sort-icon {
          color: #9ca3af;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }

        &:hover {
          color: #111827;

          .sort-icon {
            color: #6b7280;
          }
        }
      }
    }

    tbody {
      tr {
        &:hover td {
          background-color: #f9fafb;
        }

        &:last-child td {
          border-bottom: none;

          &:first-child {
            border-bottom-left-radius: 0.5rem;
          }

          &:last-child {
            border-bottom-right-radius: 0.5rem;
          }
        }
      }

      td {
        border-bottom: 1px solid #f3f4f6;
        color: #4b5563;
      }
    }

    .resize-handle {
      position: absolute;
      right: -2px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 24px;
      cursor: col-resize;
      opacity: 0;
      transition: all 0.2s ease;

      border: #111827 solid 5px;
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -4px;
        width: 12px;
        height: 100%;
        cursor: col-resize;
      }

      &:hover,
      &:active {
        opacity: 1;
        background-color: #3b82f6;
      }
    }

    th:hover .resize-handle {
      opacity: 0.5;
    }
  }
}
</style>
