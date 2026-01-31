import { getDatabase } from './database';

const PRESET_EXERCISES = [
  { name: 'Bench Press', muscle_group: 'Chest' },
  { name: 'Incline Bench Press', muscle_group: 'Chest' },
  { name: 'Dumbbell Flies', muscle_group: 'Chest' },
  { name: 'Cable Crossover', muscle_group: 'Chest' },
  { name: 'Push-ups', muscle_group: 'Chest' },
  { name: 'Barbell Row', muscle_group: 'Back' },
  { name: 'Pull-ups', muscle_group: 'Back' },
  { name: 'Lat Pulldown', muscle_group: 'Back' },
  { name: 'Seated Cable Row', muscle_group: 'Back' },
  { name: 'Deadlift', muscle_group: 'Back' },
  { name: 'Overhead Press', muscle_group: 'Shoulders' },
  { name: 'Lateral Raise', muscle_group: 'Shoulders' },
  { name: 'Face Pull', muscle_group: 'Shoulders' },
  { name: 'Front Raise', muscle_group: 'Shoulders' },
  { name: 'Squat', muscle_group: 'Legs' },
  { name: 'Romanian Deadlift', muscle_group: 'Legs' },
  { name: 'Leg Press', muscle_group: 'Legs' },
  { name: 'Lunges', muscle_group: 'Legs' },
  { name: 'Leg Curl', muscle_group: 'Legs' },
  { name: 'Leg Extension', muscle_group: 'Legs' },
  { name: 'Calf Raise', muscle_group: 'Legs' },
  { name: 'Barbell Curl', muscle_group: 'Arms' },
  { name: 'Dumbbell Curl', muscle_group: 'Arms' },
  { name: 'Tricep Pushdown', muscle_group: 'Arms' },
  { name: 'Skull Crushers', muscle_group: 'Arms' },
  { name: 'Hammer Curl', muscle_group: 'Arms' },
  { name: 'Plank', muscle_group: 'Core' },
  { name: 'Hanging Leg Raise', muscle_group: 'Core' },
  { name: 'Cable Crunch', muscle_group: 'Core' },
];

export async function seedExercises(): Promise<void> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if (count && count.count > 0) return;

  for (const exercise of PRESET_EXERCISES) {
    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group) VALUES (?, ?)',
      [exercise.name, exercise.muscle_group]
    );
  }
}
