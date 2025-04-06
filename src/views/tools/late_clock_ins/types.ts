export type ClockInEntry = {
  client_name: string
  caregiver_name: string
  actual_clock_in: Date
  scheduled_clock_in: Date
  late_min: number | null
  late: boolean
}

export type ClockInData = ClockInEntry[]
