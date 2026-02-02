export interface Exercise {
  id: number;
  name: string;
  muscle_group: string | null;
}

export interface Template {
  id: number;
  name: string;
  created_at: string;
}

export interface TemplateExercise {
  template_id: number;
  exercise_id: number;
  sort_order: number;
  target_sets: number;
  target_reps: number;
}

export interface WorkoutLog {
  id: number;
  template_id: number | null;
  name: string | null;
  started_at: string;
  finished_at: string;
}

export interface WorkoutSet {
  id: number;
  workout_log_id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
}

export interface PreviousSet {
  set_number: number;
  weight: number;
  reps: number;
}

export interface ActiveExercise {
  exercise_id: number;
  exercise_name: string;
  sets: ActiveSet[];
  previousSets?: PreviousSet[];
}

export interface ActiveSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

export interface WorkoutSummary {
  id: number;
  template_name: string | null;
  started_at: string;
  finished_at: string;
  exercise_count: number;
  total_volume: number;
}

export interface PersonalRecord {
  exercise_id: number;
  exercise_name: string;
  max_weight: number;
  max_weight_reps: number;
  max_volume: number;
  max_volume_weight: number;
  max_volume_reps: number;
  achieved_at: string;
}

export interface CalendarDay {
  day: number;
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasWorkout: boolean;
  workoutId: number | null;
}
