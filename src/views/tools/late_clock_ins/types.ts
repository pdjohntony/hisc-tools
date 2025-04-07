export type ClockInEntry = {
  client_name: string
  caregiver_name: string
  actual_clock_in: Date | null
  scheduled_clock_in: Date | null
  late_min: number | null
  late: boolean
}

export type ClockInData = ClockInEntry[]
