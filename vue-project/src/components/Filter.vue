<script lang="ts" setup>
import type { Column, Table } from "@tanstack/vue-table";
import { computed } from "vue";
import type { PropType } from "vue";
import DebouncedInput from "../components/DebouncedInput.vue";

const props = defineProps({
  column: {
    type: Object as PropType<Column<any, unknown>>,
    required: true,
  },
  table: {
    type: Object as PropType<Table<any>>,
    required: true,
  },
});

const columnFilterValue = computed(() => props.column.getFilterValue());
</script>

<template>
  <div v-if="column.id === 'createdAt'">
    <div id="created-at">
      <DebouncedInput
        type="date"
        :modelValue="(columnFilterValue as [string, string])?.[0] ?? ''"
        @update:modelValue="
          (value) =>
            column.setFilterValue((old: [string, string]) => [value, old?.[1]])
        "
        placeholder="Min Date"
        class="w-36 border shadow rounded"
      />

      <DebouncedInput
        type="date"
        :modelValue="(columnFilterValue as [string, string])?.[1] ?? ''"
        @update:modelValue="
          (value) =>
            column.setFilterValue((old: [string, string]) => [old?.[0], value])
        "
        placeholder="Max Date"
        class="w-36 border shadow rounded"
      />
    </div>
    <div class="h-1" />
  </div>

  <div v-else>
    <datalist :id="column.id + 'list'">
      <option
        v-for="value in Array.from(column.getFacetedUniqueValues().keys())"
        :key="value"
        :value="value"
      />
    </datalist>
    <DebouncedInput
      type="text"
      :modelValue="(columnFilterValue ?? '') as string"
      @update:modelValue="(value) => column.setFilterValue(value)"
      :placeholder="`Search... (${column.getFacetedUniqueValues().size})`"
      class="w-36 border shadow rounded"
      :list="column.id + 'list'"
    />
  </div>
</template>
