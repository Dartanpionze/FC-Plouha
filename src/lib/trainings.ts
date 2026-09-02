export type TrainingSlot = {
  id: number
  team_id: number
  weekday: number
  start_time: string
  end_time: string | null
  location: string | null
  coach: string | null
  start_date: string | null
  end_date: string | null
  active: boolean
  teams?: {
    id: number
    name: string
    category: string | null
  } | null
}

export type TrainingException = {
  id: number
  training_slot_id: number
  original_date: string
  status: 'cancelled' | 'modified'
  replacement_date: string | null
  replacement_start_time: string | null
  replacement_end_time: string | null
  replacement_location: string | null
  note: string | null
}

export type NextTraining = {
  slotId: number
  teamId: number
  teamName: string
  category: string | null
  date: string
  startTime: string
  endTime: string | null
  location: string | null
  coach: string | null
  note: string | null
  modified: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')

export function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function mondayBasedWeekday(date: Date) {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function combineLocalDateTime(dateValue: string, timeValue: string) {
  const date = parseLocalDate(dateValue)
  const [hours, minutes] = timeValue.slice(0, 5).split(':').map(Number)
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return date
}

function getNextRecurringDate(slot: TrainingSlot, from: Date) {
  const cursor = new Date(from)
  cursor.setSeconds(0, 0)

  for (let offset = 0; offset <= 14; offset += 1) {
    const candidate = new Date(cursor)
    candidate.setDate(cursor.getDate() + offset)

    if (mondayBasedWeekday(candidate) !== slot.weekday) continue

    const candidateDate = toLocalDateString(candidate)
    if (slot.start_date && candidateDate < slot.start_date) continue
    if (slot.end_date && candidateDate > slot.end_date) return null

    const candidateDateTime = combineLocalDateTime(candidateDate, slot.start_time)
    if (candidateDateTime >= from) return candidateDate
  }

  return null
}

export function getNextTraining(
  slots: TrainingSlot[],
  exceptions: TrainingException[],
  from = new Date(),
): NextTraining | null {
  const exceptionBySlotAndDate = new Map<string, TrainingException>()

  exceptions.forEach((exception) => {
    exceptionBySlotAndDate.set(
      `${exception.training_slot_id}:${exception.original_date}`,
      exception,
    )
  })

  const candidates: NextTraining[] = []

  slots
    .filter((slot) => slot.active)
    .forEach((slot) => {
      let searchFrom = new Date(from)

      for (let attempts = 0; attempts < 8; attempts += 1) {
        const recurringDate = getNextRecurringDate(slot, searchFrom)
        if (!recurringDate) break

        const exception = exceptionBySlotAndDate.get(`${slot.id}:${recurringDate}`)

        if (exception?.status === 'cancelled') {
          const nextDay = parseLocalDate(recurringDate)
          nextDay.setDate(nextDay.getDate() + 1)
          nextDay.setHours(0, 0, 0, 0)
          searchFrom = nextDay
          continue
        }

        const date = exception?.replacement_date || recurringDate
        const startTime = exception?.replacement_start_time || slot.start_time
        const endTime = exception?.replacement_end_time ?? slot.end_time
        const location = exception?.replacement_location ?? slot.location
        const dateTime = combineLocalDateTime(date, startTime)

        if (dateTime < from) {
          const nextDay = parseLocalDate(recurringDate)
          nextDay.setDate(nextDay.getDate() + 1)
          nextDay.setHours(0, 0, 0, 0)
          searchFrom = nextDay
          continue
        }

        candidates.push({
          slotId: slot.id,
          teamId: slot.team_id,
          teamName: slot.teams?.name || 'Équipe',
          category: slot.teams?.category || null,
          date,
          startTime,
          endTime,
          location,
          coach: slot.coach,
          note: exception?.note || null,
          modified: exception?.status === 'modified',
        })
        break
      }
    })

  candidates.sort((a, b) => {
    const aTime = combineLocalDateTime(a.date, a.startTime).getTime()
    const bTime = combineLocalDateTime(b.date, b.startTime).getTime()
    return aTime - bTime
  })

  return candidates[0] ?? null
}

export const weekdayLabels: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}
