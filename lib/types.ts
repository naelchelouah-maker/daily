export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface Exercise {
  name: string
  sets: number
  reps: string
}

export interface Workout {
  id: string
  day_of_week: DayOfWeek
  name: string
  exercises: Exercise[]
}

export interface WorkoutLog {
  id: string
  date: string
  workout_id: string
  exercise: string
  sets: number | null
  reps: string | null
  weight: number | null
  rpe: number | null
  notes: string | null
  completed: boolean
}

export interface Grocery {
  id: string
  item: string
  category: string
  checked: boolean
  created_at: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  date: string
  completed: boolean
}
