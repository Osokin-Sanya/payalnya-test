import type { ProjectWithTasks } from "@/types";
import { createColumnHelper } from "@tanstack/vue-table";
const columnHelper = createColumnHelper<ProjectWithTasks>();

const customDateFilter = (row: any, columnId: any, filterValue: any) => {
  const date = new Date(row.getValue(columnId));
  const [min, max] = filterValue || [];
  if (min && date < new Date(min)) return false;
  if (max && date > new Date(max)) return false;
  return true;
};
export const columns = [
  columnHelper.group({
    header: "Projects",
    columns: [
      columnHelper.accessor("id", {
        header: () => "Id",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("name", {
        header: () => "Name",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("description", {
        header: () => "Description",
        cell: (info) => info.getValue(),
        meta: {
          enableFiltering: true,
        },
      }),
      columnHelper.accessor("status", {
        header: () => "Status",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("tasks", {
        header: () => "Tasks",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("createdAt", {
        header: "Creation",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
        filterFn: customDateFilter,
        meta: {
          enableFiltering: false,
        },
      }),
    ],
  }),
];
