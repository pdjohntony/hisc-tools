<script setup lang="ts">
import type { ClockInData, ClockInEntry } from '@/views/tools/late_clock_ins/types.ts'
import type { WorkSheet, WorkBook, ColInfo } from 'xlsx'

import { ref } from 'vue'
import { read, utils, writeFile } from 'xlsx'

import { AlertCircleIcon, Loader2Icon } from 'lucide-vue-next'
import notify from '@/lib/notify.ts'
import FileUpload from '@/components/FileUpload.vue'
import columns from '@/views/tools/late_clock_ins/components/columns.ts'
import DataTable from '@/views/tools/late_clock_ins/components/DataTable.vue'

// States
let errorMessage = ref<string | null>(null)
let file = ref<File | null>(null)
let clockInData = ref<ClockInData | undefined>(undefined)
let processingFile = ref(false)
let savingFile = ref(false)

function resetState() {
  console.log('Resetting states')
  errorMessage.value = null
  file.value = null
  clockInData.value = undefined
}

async function onFileUploaded(files: FileList) {
  try {
    resetState()

    processingFile.value = true

    file.value = files[0]

    const { worksheet } = await readFileAsWorkbook(file.value)

    let { data } = getSheetData(worksheet)

    clockInData.value = calculateLateStatus(data)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
      errorMessage.value = error.message
    } else {
      console.error('Unexpected error:', error)
      errorMessage.value = 'An unexpected error occurred'
    }
  } finally {
    processingFile.value = false
  }
}

async function readFileAsWorkbook(
  file: File
): Promise<{ workbook: WorkBook; worksheet: WorkSheet }> {
  console.log('Reading file as workbook...')

  const fileData = await file.arrayBuffer()
  const workbook = read(fileData, { cellDates: true })
  // console.log('Workbook:', workbook)

  if (!workbook || !workbook.Sheets || Object.keys(workbook.Sheets).length === 0) {
    throw new Error('No sheets found in the workbook')
  }

  console.log('Worksheet found:', workbook.SheetNames[0])

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  updateSheetRange(worksheet)
  // console.log('Worksheet:', worksheet)

  return {
    workbook,
    worksheet
  }
}

function getSheetData(worksheet: WorkSheet): { headers: string[]; data: Record<string, any>[] } {
  console.log('Getting sheet data...')

  validateSheet(worksheet)

  const data = utils.sheet_to_json(worksheet) as Record<string, any>[]
  const headers = Object.keys(data[0])

  validateReqCols(headers)

  // console.log(data)
  return { headers, data }
}

function validateSheet(worksheet: WorkSheet) {
  console.log('Validating worksheet...')
  // console.log('Worksheet:', worksheet)

  // Make sure the sheet has data, and check for required columns
  if (!worksheet || !worksheet['!ref']) {
    throw new Error('No data found in the worksheet')
  }

  // Check ref sheet range has more than 1 row `A1:A2` by splitting the string by : and checking the number in the second part of the range
  const [, endCell] = worksheet['!ref'].split(':')
  const endRow = parseInt(endCell.replace(/[^0-9]/g, ''), 10)
  if (endRow < 2) {
    throw new Error('The worksheet must contain at least a header row and one data row')
  }
}

function validateReqCols(headers: string[]): void {
  console.log('Headers:', headers)
  const requiredCols = ['Actual Clock In', 'Scheduled Clock In']

  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      throw new Error(`Required column not found: ${col}`)
    }
  }
}

function calculateLateStatus(data: Record<string, any>[]): ClockInData {
  console.log('Calculating late status...')
  const lateThresholdMinutes = 7

  const updatedData: ClockInData = data.map((row): ClockInEntry => {
    let actualClockIn = null
    let scheduledClockIn = null

    if (row['Actual Clock In']) {
      actualClockIn = new Date(row['Actual Clock In'])
    }
    if (row['Scheduled Clock In']) {
      scheduledClockIn = new Date(row['Scheduled Clock In'])
    }
    let late_min = 0
    let late = false

    if (scheduledClockIn && actualClockIn) {
      const diffMinutes = (actualClockIn.getTime() - scheduledClockIn.getTime()) / (1000 * 60)
      late_min = diffMinutes >= 0 ? Math.ceil(diffMinutes) : 0
      late = diffMinutes >= lateThresholdMinutes
    }

    return {
      client_name: row['Client Name'] || '',
      caregiver_name: row['Caregiver Name'] || '',
      actual_clock_in: actualClockIn,
      scheduled_clock_in: scheduledClockIn,
      late_min,
      late
    }
  })

  return updatedData
}

function autoFitColumns(worksheet: WorkSheet): void {
  if (!worksheet['!ref']) {
    throw new Error(
      'Cannot auto-fit columns: worksheet does not have a valid reference range (!ref)'
    )
  }
  const [firstCol, lastCol] = worksheet['!ref']?.replace(/\d/, '').split(':')

  const numRegexp = new RegExp(/\d+$/g)

  const firstColIndex = firstCol.charCodeAt(0),
    lastColIndex = lastCol.charCodeAt(0),
    rows = +numRegexp.exec(lastCol)![0]

  const objectMaxLength: ColInfo[] = []

  // Loop on columns
  for (let colIndex = firstColIndex; colIndex <= lastColIndex; colIndex++) {
    const col = String.fromCharCode(colIndex)
    let maxCellLength = 0

    // Loop on rows
    for (let row = 1; row <= rows; row++) {
      const cell = worksheet[`${col}${row}`]
      const cellLength = cell && cell.v ? cell.v.length + 1 : 0
      if (cellLength > maxCellLength) maxCellLength = cellLength
    }

    objectMaxLength.push({ wch: maxCellLength })
  }
  worksheet['!cols'] = objectMaxLength
}

function dataToSheet(data: Record<string, any>[]): { worksheet: WorkSheet; headers: string[] } {
  console.log('Converting new data to sheet...')

  let worksheet = utils.json_to_sheet(data, {
    cellDates: true,
    dateNF: 'mm/dd/yyyy hh:mm AM/PM'
  })

  const headers = [
    'Client Name',
    'Caregiver Name',
    'Actual Clock In',
    'Scheduled Clock In',
    'Late Minutes',
    '7+ Min Late'
  ]

  // Rename headers
  worksheet = utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })

  // console.log('worksheet:', worksheet)
  return { worksheet, headers }
}

function saveResultsToFile(data: Record<string, any>[], ogFilename: string | undefined): void {
  try {
    console.log('Preparing to save results to file...')
    savingFile.value = true

    const { worksheet, headers } = dataToSheet(data)

    // Enable autofilter
    worksheet['!autofilter'] = {
      ref: worksheet['!ref']
    } as any

    // Change column widths by getting the data key character lengths
    autoFitColumns(worksheet)
    if (!worksheet['!cols']) {
      worksheet['!cols'] = []
    }
    worksheet['!cols'][headers.findIndex((header) => header === 'Actual Clock In')] = { wch: 19 }
    worksheet['!cols'][headers.findIndex((header) => header === 'Scheduled Clock In')] = {
      wch: 19
    }
    console.log('Autofit columns applied')

    // Create a new workbook and append the worksheet
    const new_workbook = utils.book_new()
    utils.book_append_sheet(new_workbook, worksheet)

    // Get filename and extension separately
    if (!ogFilename) {
      ogFilename = 'clock ins.xlsx'
    }
    const fnParts = ogFilename.match(/^(.+)(\.[^.]+)$/)
    const baseFilename = fnParts ? fnParts[1] : ogFilename
    const extension = fnParts ? fnParts[2] : '.xlsx'
    const datetime = new Date().toISOString().replace(/[:.-]/g, '')
    const finalFilename = `${baseFilename} late ${datetime}${extension}`

    // Save sheet to a file
    console.log('Saving file...')
    writeFile(new_workbook, finalFilename)
    console.log(`Results saved to file: ${finalFilename}`)
    notify('Saved report', undefined, 'success', 'app')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
      notify('Error saving report', error.message, 'destructive', 'app')
    } else {
      console.error('Unexpected error:', error)
      notify('Error saving report', 'An unexpected error occurred', 'destructive', 'app')
    }
  } finally {
    savingFile.value = false
  }
}

function updateSheetRange(ws: WorkSheet): void {
  var range = { s: { r: Infinity, c: Infinity }, e: { r: 0, c: 0 } }
  Object.keys(ws)
    .filter(function (x) {
      return x.charAt(0) != '!'
    })
    .map(utils.decode_cell)
    .forEach(function (x) {
      range.s.c = Math.min(range.s.c, x.c)
      range.s.r = Math.min(range.s.r, x.r)
      range.e.c = Math.max(range.e.c, x.c)
      range.e.r = Math.max(range.e.r, x.r)
    })
  ws['!ref'] = utils.encode_range(range)
}
</script>

<template>
  <div class="mb-4 text-sm">
    Analyzes a clock in report and returns clock ins that are 7+ minutes later. The report must
    contain the <strong>Actual Clock In</strong>, <strong>Scheduled Clock In</strong> columns, all
    others are optional.
  </div>
  <div v-if="errorMessage" class="flex gap-2 mb-4 bg-destructive p-2 rounded-md items-center">
    <AlertCircleIcon class="size-4" />Error: {{ errorMessage }}
  </div>
  <div v-if="!clockInData && !processingFile">
    <FileUpload
      v-if="!clockInData"
      :allowedFileTypes="['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']"
      @files-uploaded="onFileUploaded"
    />
  </div>
  <div v-else-if="processingFile" class="flex items-center justify-center">
    <Loader2Icon class="animate-spin size-14" />
  </div>
  <div v-else-if="clockInData">
    <DataTable
      :columns="columns"
      :data="clockInData"
      :savingFile="savingFile"
      @save="saveResultsToFile(clockInData, file?.name)"
      @restart="resetState"
    />
  </div>
</template>
