<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/vue-table'
import { ref } from 'vue'

import { SaveIcon, Undo2Icon, ClockAlertIcon, ClockIcon } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'

// Props
const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}>()

// Emits
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'restart'): void
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    }
  }
})

table.getColumn('late')?.setFilterValue(true)
table.getColumn('caregiver_name')?.toggleSorting(false)
</script>

<template>
  <div class="flex items-center py-4 gap-2">
    <Button variant="secondary" @click="emit('save')"><SaveIcon />Save Report</Button>
    <Button variant="secondary" @click="emit('restart')"><Undo2Icon />Restart</Button>
    <Button
      v-if="table.getColumn('late')?.getIsFiltered()"
      @click="table.getColumn('late')?.setFilterValue(undefined)"
      variant="secondary"
      ><ClockIcon />Show all Clock Ins</Button
    >
    <Button v-else @click="table.getColumn('late')?.setFilterValue(true)" variant="destructive"
      ><ClockAlertIcon />Show only late Clock Ins</Button
    >
  </div>
  <div class="border rounded-md data-table-container">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center"> No results. </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
<style scoped>
.data-table-container {
  max-height: calc(100vh - 212px);
  overflow-y: auto;
}
</style>
