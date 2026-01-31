import { getDatabase } from './database';
import type {
  Exercise,
  Template,
  TemplateExercise,
  WorkoutLog,
  WorkoutSet,
  WorkoutSummary,
  PersonalRecord,
} from '../lib/types';

// ─── Exercises ───

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  return db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const db = await getDatabase();
  return db.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE name LIKE ? ORDER BY muscle_group, name',
    [`%${query}%`]
  );
}

export async function addExercise(name: string, muscleGroup: string | null): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO exercises (name, muscle_group) VALUES (?, ?)',
    [name, muscleGroup]
  );
  return result.lastInsertRowId;
}

// ─── Templates ───

export async function getAllTemplates(): Promise<Template[]> {
  const db = await getDatabase();
  return db.getAllAsync<Template>('SELECT * FROM templates ORDER BY created_at DESC');
}

export async function getTemplateWithExercises(templateId: number) {
  const db = await getDatabase();
  const template = await db.getFirstAsync<Template>(
    'SELECT * FROM templates WHERE id = ?',
    [templateId]
  );
  const exercises = await db.getAllAsync<TemplateExercise & { name: string; muscle_group: string | null }>(
    `SELECT te.*, e.name, e.muscle_group
     FROM template_exercises te
     JOIN exercises e ON te.exercise_id = e.id
     WHERE te.template_id = ?
     ORDER BY te.sort_order`,
    [templateId]
  );
  return { template, exercises };
}

export async function createTemplate(
  name: string,
  exercises: { exercise_id: number; target_sets: number; target_reps: number }[]
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO templates (name) VALUES (?)',
    [name]
  );
  const templateId = result.lastInsertRowId;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await db.runAsync(
      'INSERT INTO template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps) VALUES (?, ?, ?, ?, ?)',
      [templateId, ex.exercise_id, i, ex.target_sets, ex.target_reps]
    );
  }
  return templateId;
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM templates WHERE id = ?', [templateId]);
}

// ─── Workout Logs ───

export async function saveWorkout(
  templateId: number | null,
  startedAt: string,
  finishedAt: string,
  sets: { exercise_id: number; set_number: number; weight: number; reps: number }[]
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO workout_logs (template_id, started_at, finished_at) VALUES (?, ?, ?)',
    [templateId, startedAt, finishedAt]
  );
  const workoutId = result.lastInsertRowId;
  for (const s of sets) {
    await db.runAsync(
      'INSERT INTO workout_sets (workout_log_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)',
      [workoutId, s.exercise_id, s.set_number, s.weight, s.reps]
    );
  }
  return workoutId;
}

export async function getWorkoutHistory(limit = 50): Promise<WorkoutSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<WorkoutSummary>(
    `SELECT
       wl.id,
       COALESCE(wl.name, t.name) as template_name,
       wl.started_at,
       wl.finished_at,
       COUNT(DISTINCT ws.exercise_id) as exercise_count,
       COALESCE(SUM(ws.weight * ws.reps), 0) as total_volume
     FROM workout_logs wl
     LEFT JOIN templates t ON wl.template_id = t.id
     LEFT JOIN workout_sets ws ON ws.workout_log_id = wl.id
     GROUP BY wl.id
     ORDER BY wl.started_at DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getWorkoutDetail(workoutId: number) {
  const db = await getDatabase();
  const log = await db.getFirstAsync<WorkoutLog & { template_name: string | null }>(
    `SELECT wl.*, COALESCE(wl.name, t.name) as template_name
     FROM workout_logs wl
     LEFT JOIN templates t ON wl.template_id = t.id
     WHERE wl.id = ?`,
    [workoutId]
  );
  const sets = await db.getAllAsync<WorkoutSet & { exercise_name: string; muscle_group: string | null }>(
    `SELECT ws.*, e.name as exercise_name, e.muscle_group
     FROM workout_sets ws
     JOIN exercises e ON ws.exercise_id = e.id
     WHERE ws.workout_log_id = ?
     ORDER BY ws.exercise_id, ws.set_number`,
    [workoutId]
  );
  return { log, sets };
}

export async function deleteWorkout(workoutId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [workoutId]);
}

export async function updateWorkoutName(
  workoutLogId: number,
  name: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE workout_logs SET name = ? WHERE id = ?', [name, workoutLogId]);
}

export async function updateWorkoutSets(
  workoutLogId: number,
  sets: { exercise_id: number; set_number: number; weight: number; reps: number }[]
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workout_sets WHERE workout_log_id = ?', [workoutLogId]);
  for (const s of sets) {
    await db.runAsync(
      'INSERT INTO workout_sets (workout_log_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)',
      [workoutLogId, s.exercise_id, s.set_number, s.weight, s.reps]
    );
  }
}

// ─── Stats ───

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PersonalRecord>(
    `SELECT
       e.id as exercise_id,
       e.name as exercise_name,
       MAX(ws.weight) as max_weight,
       (SELECT ws2.reps FROM workout_sets ws2 WHERE ws2.exercise_id = e.id ORDER BY ws2.weight DESC, ws2.reps DESC LIMIT 1) as max_weight_reps,
       MAX(ws.weight * ws.reps) as max_volume,
       (SELECT ws3.weight FROM workout_sets ws3 WHERE ws3.exercise_id = e.id ORDER BY (ws3.weight * ws3.reps) DESC LIMIT 1) as max_volume_weight,
       (SELECT ws4.reps FROM workout_sets ws4 WHERE ws4.exercise_id = e.id ORDER BY (ws4.weight * ws4.reps) DESC LIMIT 1) as max_volume_reps,
       (SELECT wl.started_at FROM workout_sets ws5 JOIN workout_logs wl ON ws5.workout_log_id = wl.id WHERE ws5.exercise_id = e.id ORDER BY ws5.weight DESC LIMIT 1) as achieved_at
     FROM exercises e
     JOIN workout_sets ws ON ws.exercise_id = e.id
     GROUP BY e.id
     ORDER BY e.name`
  );
}

export async function getExerciseVolumeHistory(exerciseId: number, days = 90) {
  const db = await getDatabase();
  return db.getAllAsync<{ date: string; total_volume: number }>(
    `SELECT
       DATE(wl.started_at) as date,
       SUM(ws.weight * ws.reps) as total_volume
     FROM workout_sets ws
     JOIN workout_logs wl ON ws.workout_log_id = wl.id
     WHERE ws.exercise_id = ?
       AND wl.started_at >= datetime('now', ?)
     GROUP BY DATE(wl.started_at)
     ORDER BY date`,
    [exerciseId, `-${days} days`]
  );
}

export async function getMonthlyStats() {
  const db = await getDatabase();
  return db.getFirstAsync<{
    workout_count: number;
    total_volume: number;
    top_muscle_group: string | null;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM workout_logs WHERE started_at >= datetime('now', 'start of month')) as workout_count,
       (SELECT COALESCE(SUM(ws.weight * ws.reps), 0)
        FROM workout_sets ws JOIN workout_logs wl ON ws.workout_log_id = wl.id
        WHERE wl.started_at >= datetime('now', 'start of month')) as total_volume,
       (SELECT e.muscle_group
        FROM workout_sets ws
        JOIN workout_logs wl ON ws.workout_log_id = wl.id
        JOIN exercises e ON ws.exercise_id = e.id
        WHERE wl.started_at >= datetime('now', 'start of month')
        GROUP BY e.muscle_group
        ORDER BY COUNT(*) DESC
        LIMIT 1) as top_muscle_group`
  );
}
