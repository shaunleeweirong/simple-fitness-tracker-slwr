import { create } from 'zustand';
import type { ActiveExercise, ActiveSet } from '../lib/types';

interface WorkoutState {
  isActive: boolean;
  templateId: number | null;
  startedAt: string | null;
  exercises: ActiveExercise[];

  startWorkout: (templateId?: number | null) => void;
  startTimer: () => void;
  addExercise: (exerciseId: number, exerciseName: string, targetSets?: number, targetReps?: number) => void;
  removeExercise: (exerciseId: number) => void;
  addSet: (exerciseId: number) => void;
  removeSet: (exerciseId: number, setId: string) => void;
  updateSet: (exerciseId: number, setId: string, field: 'weight' | 'reps', value: string) => void;
  toggleSetComplete: (exerciseId: number, setId: string) => void;
  finishWorkout: () => { templateId: number | null; startedAt: string; exercises: ActiveExercise[] };
  discardWorkout: () => void;
}

function createEmptySet(): ActiveSet {
  return {
    id: Math.random().toString(36).substring(2, 9),
    weight: '',
    reps: '',
    completed: false,
  };
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  isActive: false,
  templateId: null,
  startedAt: null,
  exercises: [],

  startWorkout: (templateId = null) => {
    set({
      isActive: true,
      templateId,
      startedAt: null,
      exercises: [],
    });
  },

  startTimer: () => {
    if (!get().startedAt) {
      set({ startedAt: new Date().toISOString() });
    }
  },

  addExercise: (exerciseId, exerciseName, targetSets = 1, targetReps = 0) => {
    const sets: ActiveSet[] = [];
    for (let i = 0; i < targetSets; i++) {
      sets.push({
        ...createEmptySet(),
        reps: targetReps > 0 ? String(targetReps) : '',
      });
    }
    if (sets.length === 0) sets.push(createEmptySet());

    set((state) => ({
      exercises: [
        ...state.exercises,
        { exercise_id: exerciseId, exercise_name: exerciseName, sets },
      ],
    }));
  },

  removeExercise: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.filter((e) => e.exercise_id !== exerciseId),
    }));
  },

  addSet: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.exercise_id === exerciseId
          ? { ...e, sets: [...e.sets, createEmptySet()] }
          : e
      ),
    }));
  },

  removeSet: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.exercise_id === exerciseId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      ),
    }));
  },

  updateSet: (exerciseId, setId, field, value) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.exercise_id === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : e
      ),
    }));
  },

  toggleSetComplete: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.exercise_id === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            }
          : e
      ),
    }));
  },

  finishWorkout: () => {
    const { templateId, startedAt, exercises } = get();
    set({ isActive: false, templateId: null, startedAt: null, exercises: [] });
    return { templateId: templateId!, startedAt: startedAt ?? new Date().toISOString(), exercises };
  },

  discardWorkout: () => {
    set({ isActive: false, templateId: null, startedAt: null, exercises: [] });
  },
}));
