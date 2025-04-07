import type { ColumnDef, Column } from '@tanstack/vue-table'
import type { ClockInEntry } from '@/views/tools/late_clock_ins/types.ts'

import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronsUpDownIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-vue-next'

const columns: ColumnDef<ClockInEntry>[] = [
  {
    accessorKey: 'client_name',
    header: ({ column }) => createSortableHeader('Client Name', column),
    cell: ({ row }) => {
      return h('div', { class: 'ml-4' }, row.getValue('client_name'))
    }
  },
  {
    accessorKey: 'caregiver_name',
    header: ({ column }) => createSortableHeader('Caregiver Name', column),
    cell: ({ row }) => {
      return h('div', { class: 'ml-4' }, row.getValue('caregiver_name'))
    }
  },
  {
    accessorKey: 'actual_clock_in',
    header: ({ column }) => createSortableHeader('Actual Clock In', column),
    cell: ({ row }) => {
      const dateObj = row.getValue('actual_clock_in') as Date
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      return h('div', { class: 'ml-4' }, `${formattedDate} ${formattedTime}`)
    }
  },
  {
    accessorKey: 'scheduled_clock_in',
    header: ({ column }) => createSortableHeader('Scheduled Clock In', column),
    cell: ({ row }) => {
      const dateObj = row.getValue('scheduled_clock_in') as Date
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      return h('div', { class: 'ml-4' }, `${formattedDate} ${formattedTime}`)
    }
  },
  {
    accessorKey: 'late_min',
    header: ({ column }) => createSortableHeader('Late Minutes', column),
    cell: ({ row }) => {
      return h('div', { class: 'ml-4' }, row.getValue('late_min'))
    }
  },
  {
    accessorKey: 'late',
    header: ({ column }) => createSortableHeader('7+ Min Late', column),
    cell: ({ row }) => {
      const isLate = row.getValue('late') as boolean
      if (isLate) {
        return h(Badge, { variant: 'destructive', class: 'ml-4' }, () => 'Yes')
      } else {
        return h(Badge, { variant: 'outline', class: 'ml-4' }, () => 'No')
      }
    }
  }
]

function createSortableHeader(columnName: string, column: Column<ClockInEntry>) {
  return h(
    Button,
    {
      variant: 'ghost',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    },
    () => {
      const sort = column.getIsSorted()
      return [
        columnName,
        sort === 'asc'
          ? h(ChevronUpIcon, { class: 'h-4 w-4 text-white' })
          : sort === 'desc'
          ? h(ChevronDownIcon, { class: 'h-4 w-4 text-white' })
          : h(ChevronsUpDownIcon, { class: 'h-4 w-4' })
      ]
    }
  )
}

export default columns
