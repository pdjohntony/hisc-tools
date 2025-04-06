<script setup lang="ts">
import { ref } from 'vue'
import { read, utils, WorkSheet, WorkBook, writeFile, ColInfo } from 'xlsx'

import FileUpload from '@/components/FileUpload.vue'

// States
const tableHtml = ref('')

async function onFileUploaded(files: FileList) {
  const { worksheet } = await readFileAsWorkbook(files[0])

  let { headers, data } = getSheetData(worksheet)
  // console.log(data[0])

  data = calculateLateStatus(data)
  // console.log(data[0])

  const new_worksheet = utils.json_to_sheet(data, {
    cellDates: true,
    dateNF: 'mm/dd/yyyy hh:mm AM/PM'
  })
  // console.log('new_worksheet:', new_worksheet)

  // Display sheet as html
  console.log('Converting worksheet to HTML...')
  const table = utils.sheet_to_html(new_worksheet)
  tableHtml.value = table

  // Change column widths by getting the data key character lengths
  autoFitColumns(new_worksheet)
  if (!new_worksheet['!cols']) {
    new_worksheet['!cols'] = []
  }
  new_worksheet['!cols'][headers.findIndex((header) => header === 'Actual Clock In')] = { wch: 19 }
  new_worksheet['!cols'][headers.findIndex((header) => header === 'Scheduled Clock In')] = {
    wch: 19
  }
  console.log('Autofit columns applied')

  // Save sheet to a file
  const new_workbook = utils.book_new()
  utils.book_append_sheet(new_workbook, new_worksheet)
  const datetime = new Date().toISOString().replace(/[:.-]/g, '')
  writeFile(new_workbook, `${files[0].name.replace(/\.[^/.]+$/, '')} late ${datetime}.xlsx`)
}

async function readFileAsWorkbook(
  file: File
): Promise<{ workbook: WorkBook; worksheet: WorkSheet }> {
  console.log('Reading file as workbook...')

  const fileData = await file.arrayBuffer()
  const workbook = read(fileData, { cellDates: true })

  if (!workbook || !workbook.Sheets || Object.keys(workbook.Sheets).length === 0) {
    throw new Error('No sheets found in the workbook')
  }

  console.log('Worksheet found:', workbook.SheetNames[0])

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]

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

function calculateLateStatus(data: Record<string, any>[]): Record<string, any>[] {
  console.log('Calculating late status...')

  const lateThresholdMinutes = 7

  // Loop through each row
  data.forEach((row) => {
    const actualClockIn = new Date(row['Actual Clock In'])
    const scheduledClockIn = new Date(row['Scheduled Clock In'])

    if (scheduledClockIn && actualClockIn) {
      const diffMinutes = (actualClockIn.getTime() - scheduledClockIn.getTime()) / (1000 * 60)

      row['7+ Min Late'] = diffMinutes >= lateThresholdMinutes ? true : false
    } else {
      row['7+ Min Late'] = 'UNKNOWN'
    }
  })

  return data
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
      const cellLength = worksheet[`${col}${row}`].v.length + 1
      if (cellLength > maxCellLength) maxCellLength = cellLength
    }

    objectMaxLength.push({ wch: maxCellLength })
  }
  worksheet['!cols'] = objectMaxLength
}
</script>

<template>
  <FileUpload
    :allowedFileTypes="['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']"
    @files-uploaded="onFileUploaded"
  />

  <div v-html="tableHtml" v-if="tableHtml" />
</template>
