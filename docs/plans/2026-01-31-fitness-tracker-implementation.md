# Simple Fitness Tracker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native workout tracker with dark shadcn-style UI, local SQLite storage, template and freeform workout logging, history, and stats.

**Architecture:** Expo Router file-based navigation with 4 tabs (Log, Templates, History, Stats) plus stack screens for active workouts and detail views. Data persisted in expo-sqlite. Active workout session managed by zustand store. UI styled with NativeWind + react-native-reusables.

**Tech Stack:** Expo SDK, Expo Router, NativeWind, react-native-reusables, expo-sqlite, zustand, react-native-chart-kit

---

## Task 1: Scaffold Expo Project

**Files:**
- Create: project root via `create-expo-app`

**Step 1: Create Expo project**

```bash
cd /Users/leeshaun/Desktop/Apps
npx create-expo-app@latest simple-fitness-tracker --template blank-typescript
```

> Note: If the directory already exists, remove it first and recreate, or run inside it.

**Step 2: Verify it runs**

```bash
cd /Users/leeshaun/Desktop/Apps/simple-fitness-tracker
npx expo start
```

Expected: Metro bundler starts without errors. Press `q` to quit.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo project with TypeScript template"
```

---

## Task 2: Install Dependencies

**Step 1: Install core dependencies**

```bash
cd /Users/leeshaun/Desktop/Apps/simple-fitness-tracker
npx expo install expo-router expo-sqlite expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens react-native-reanimated react-native-gesture-handler
```

**Step 2: Install NativeWind and Tailwind**

```bash
npm install nativewind tailwindcss@3
```

**Step 3: Install react-native-reusables CLI and zustand**

```bash
npm install zustand
npx @react-native-reusables/cli@latest init
```

Follow the CLI prompts to set up the project. This configures NativeWind, Tailwind, and the component library.

**Step 4: Install chart library and additional UI deps**

```bash
npm install react-native-chart-kit react-native-svg
npx expo install react-native-svg
```

**Step 5: Install lucide icons (used by react-native-reusables)**

```bash
npm install lucide-react-native
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: install all dependencies"
```

---

## Task 3: Configure NativeWind, Metro, and Tailwind

**Files:**
- Modify: `tailwind.config.js`
- Modify: `metro.config.js`
- Modify: `babel.config.js`
- Create: `global.css`
- Modify: `app.json` or `app.config.ts`

**Step 1: Configure `tailwind.config.js`**

Replace the contents with:

```javascript
const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
```

**Step 2: Configure `metro.config.js`**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
```

**Step 3: Configure `babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 4: Create `global.css` with dark theme variables**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 7%;
    --foreground: 0 0% 95%;
    --card: 0 0% 12%;
    --card-foreground: 0 0% 95%;
    --primary: 199 89% 48%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 95%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;
    --accent: 199 89% 48%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 18%;
    --input: 0 0% 18%;
    --ring: 199 89% 48%;
  }
}
```

> These HSL values produce: background #121212, card #1E1E1E, primary electric blue, etc.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure NativeWind, Tailwind, and dark theme"
```

---

## Task 4: Set Up Expo Router File Structure and Tab Layout

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/templates.tsx`
- Create: `app/(tabs)/history.tsx`
- Create: `app/(tabs)/stats.tsx`

**Step 1: Create root layout `app/_layout.tsx`**

```tsx
import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
```

**Step 2: Create tab layout `app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { Dumbbell, LayoutGrid, Clock, BarChart3 } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#f2f2f2',
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#2e2e2e' },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#a3a3a3',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 3: Create placeholder tab screens**

`app/(tabs)/index.tsx`:
```tsx
import { View, Text } from 'react-native';

export default function LogScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-xl">Log Workout</Text>
    </View>
  );
}
```

`app/(tabs)/templates.tsx`:
```tsx
import { View, Text } from 'react-native';

export default function TemplatesScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-xl">Templates</Text>
    </View>
  );
}
```

`app/(tabs)/history.tsx`:
```tsx
import { View, Text } from 'react-native';

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-xl">History</Text>
    </View>
  );
}
```

`app/(tabs)/stats.tsx`:
```tsx
import { View, Text } from 'react-native';

export default function StatsScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-xl">Stats</Text>
    </View>
  );
}
```

**Step 4: Verify the app runs with all 4 tabs**

```bash
npx expo start
```

Expected: App shows 4 tabs at the bottom with dark background and placeholder text.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: set up Expo Router with 4-tab navigation layout"
```

---

## Task 5: Set Up SQLite Database Schema and Seed Data

**Files:**
- Create: `db/schema.ts`
- Create: `db/database.ts`
- Create: `db/seed.ts`
- Create: `lib/types.ts`

**Step 1: Create shared types `lib/types.ts`**

```typescript
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

// UI-specific types
export interface ActiveExercise {
  exercise_id: number;
  exercise_name: string;
  sets: ActiveSet[];
}

export interface ActiveSet {
  id: string; // temporary UUID for UI
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
```

**Step 2: Create database initialization `db/database.ts`**

```typescript
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('fitness-tracker.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      sort_order INTEGER NOT NULL,
      target_sets INTEGER NOT NULL,
      target_reps INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL
    );
  `);
}
```

**Step 3: Create seed data `db/seed.ts`**

```typescript
import { getDatabase } from './database';

const PRESET_EXERCISES = [
  // Chest
  { name: 'Bench Press', muscle_group: 'Chest' },
  { name: 'Incline Bench Press', muscle_group: 'Chest' },
  { name: 'Dumbbell Flies', muscle_group: 'Chest' },
  { name: 'Cable Crossover', muscle_group: 'Chest' },
  { name: 'Push-ups', muscle_group: 'Chest' },
  // Back
  { name: 'Barbell Row', muscle_group: 'Back' },
  { name: 'Pull-ups', muscle_group: 'Back' },
  { name: 'Lat Pulldown', muscle_group: 'Back' },
  { name: 'Seated Cable Row', muscle_group: 'Back' },
  { name: 'Deadlift', muscle_group: 'Back' },
  // Shoulders
  { name: 'Overhead Press', muscle_group: 'Shoulders' },
  { name: 'Lateral Raise', muscle_group: 'Shoulders' },
  { name: 'Face Pull', muscle_group: 'Shoulders' },
  { name: 'Front Raise', muscle_group: 'Shoulders' },
  // Legs
  { name: 'Squat', muscle_group: 'Legs' },
  { name: 'Romanian Deadlift', muscle_group: 'Legs' },
  { name: 'Leg Press', muscle_group: 'Legs' },
  { name: 'Lunges', muscle_group: 'Legs' },
  { name: 'Leg Curl', muscle_group: 'Legs' },
  { name: 'Leg Extension', muscle_group: 'Legs' },
  { name: 'Calf Raise', muscle_group: 'Legs' },
  // Arms
  { name: 'Barbell Curl', muscle_group: 'Arms' },
  { name: 'Dumbbell Curl', muscle_group: 'Arms' },
  { name: 'Tricep Pushdown', muscle_group: 'Arms' },
  { name: 'Skull Crushers', muscle_group: 'Arms' },
  { name: 'Hammer Curl', muscle_group: 'Arms' },
  // Core
  { name: 'Plank', muscle_group: 'Core' },
  { name: 'Hanging Leg Raise', muscle_group: 'Core' },
  { name: 'Cable Crunch', muscle_group: 'Core' },
];

export async function seedExercises(): Promise<void> {
  const db = await getDatabase();
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if (count && count.count > 0) return; // Already seeded

  for (const exercise of PRESET_EXERCISES) {
    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group) VALUES (?, ?)',
      [exercise.name, exercise.muscle_group]
    );
  }
}
```

**Step 4: Wire up database initialization in root layout**

Update `app/_layout.tsx` to call `initializeDatabase` and `seedExercises` on mount:

```tsx
import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { initializeDatabase } from '../db/database';
import { seedExercises } from '../db/seed';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      await seedExercises();
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
```

**Step 5: Verify app starts and database is created**

```bash
npx expo start
```

Expected: App loads with a brief spinner, then shows tabs. No errors in console.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: set up SQLite database schema with seed exercises"
```

---

## Task 6: Create Database Query Functions

**Files:**
- Create: `db/queries.ts`

**Step 1: Create query functions**

```typescript
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
       t.name as template_name,
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
    `SELECT wl.*, t.name as template_name
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
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add database query functions for all entities"
```

---

## Task 7: Create Zustand Store for Active Workout

**Files:**
- Create: `stores/workout-store.ts`

**Step 1: Create the store**

```typescript
import { create } from 'zustand';
import type { ActiveExercise, ActiveSet } from '../lib/types';

interface WorkoutState {
  isActive: boolean;
  templateId: number | null;
  startedAt: string | null;
  exercises: ActiveExercise[];

  startWorkout: (templateId?: number | null) => void;
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
      startedAt: new Date().toISOString(),
      exercises: [],
    });
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
    return { templateId: templateId!, startedAt: startedAt!, exercises };
  },

  discardWorkout: () => {
    set({ isActive: false, templateId: null, startedAt: null, exercises: [] });
  },
}));
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add zustand store for active workout session"
```

---

## Task 8: Install shadcn-style UI Components

**Files:**
- Components installed via `rnr` CLI into `components/ui/`

**Step 1: Install components needed for the app**

```bash
cd /Users/leeshaun/Desktop/Apps/simple-fitness-tracker
npx @react-native-reusables/cli@latest add button card input text dialog alert-dialog separator
```

> If the CLI asks questions, accept defaults. This installs pre-built shadcn-style components.

**Step 2: Verify components exist**

```bash
ls components/ui/
```

Expected: Files like `button.tsx`, `card.tsx`, `input.tsx`, `text.tsx`, etc.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: install shadcn-style UI components via react-native-reusables"
```

---

## Task 9: Build the Log Workout (Home) Screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Implement the home screen**

```tsx
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Dumbbell, LayoutGrid } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useWorkoutStore } from '../../stores/workout-store';
import { getWorkoutHistory } from '../../db/queries';
import type { WorkoutSummary } from '../../lib/types';

export default function LogScreen() {
  const router = useRouter();
  const isActive = useWorkoutStore((s) => s.isActive);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      getWorkoutHistory(5).then(setRecentWorkouts);
    }, [])
  );

  const handleFreeform = () => {
    startWorkout(null);
    router.push('/workout/active');
  };

  const handleTemplate = () => {
    router.push('/workout/pick-template');
  };

  const handleResume = () => {
    router.push('/workout/active');
  };

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      {isActive ? (
        <Button onPress={handleResume} className="mb-4 bg-accent">
          <Text className="text-accent-foreground font-bold">Resume Workout</Text>
        </Button>
      ) : (
        <View className="gap-3 mb-6">
          <Button onPress={handleFreeform} className="h-16 bg-primary">
            <View className="flex-row items-center gap-2">
              <Dumbbell color="white" size={20} />
              <Text className="text-primary-foreground font-bold text-lg">Start Freeform Workout</Text>
            </View>
          </Button>
          <Button onPress={handleTemplate} className="h-16 bg-secondary">
            <View className="flex-row items-center gap-2">
              <LayoutGrid color="#f2f2f2" size={20} />
              <Text className="text-secondary-foreground font-bold text-lg">Pick a Template</Text>
            </View>
          </Button>
        </View>
      )}

      <Text className="text-muted-foreground text-sm font-semibold mb-3 uppercase tracking-wide">
        Recent Workouts
      </Text>

      <FlatList
        data={recentWorkouts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/workout/detail/${item.id}`)}>
            <Card className="mb-2 bg-card">
              <CardContent className="py-3 px-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-foreground font-semibold">
                    {item.template_name || 'Freeform'}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {formatDate(item.started_at)}
                  </Text>
                </View>
                <Text className="text-muted-foreground text-sm mt-1">
                  {item.exercise_count} exercises · {formatDuration(item.started_at, item.finished_at)} · {item.total_volume.toLocaleString()} lb
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center mt-8">
            No workouts yet. Start your first one!
          </Text>
        }
      />
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: build Log Workout home screen with recent workouts"
```

---

## Task 10: Build Exercise Picker Component

**Files:**
- Create: `components/exercise-picker.tsx`

**Step 1: Create the exercise picker**

```tsx
import { useState, useEffect } from 'react';
import { View, FlatList, Pressable, Modal } from 'react-native';
import { Search, Plus, X } from 'lucide-react-native';
import { Text } from './ui/text';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getAllExercises, searchExercises, addExercise } from '../db/queries';
import type { Exercise } from '../lib/types';

interface Props {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onSelect, onClose }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');

  useEffect(() => {
    if (visible) {
      getAllExercises().then(setExercises);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim()) {
      searchExercises(query).then(setExercises);
    } else {
      getAllExercises().then(setExercises);
    }
  }, [query]);

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    const id = await addExercise(newName.trim(), newMuscleGroup.trim() || null);
    onSelect({ id, name: newName.trim(), muscle_group: newMuscleGroup.trim() || null });
    setNewName('');
    setNewMuscleGroup('');
    setShowAddNew(false);
  };

  // Group exercises by muscle group
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const group = ex.muscle_group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background pt-4 px-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-foreground text-xl font-bold">Select Exercise</Text>
          <Pressable onPress={onClose}>
            <X color="#a3a3a3" size={24} />
          </Pressable>
        </View>

        <Input
          placeholder="Search exercises..."
          value={query}
          onChangeText={setQuery}
          className="mb-4 bg-card text-foreground"
          placeholderTextColor="#737373"
        />

        {showAddNew ? (
          <View className="bg-card rounded-lg p-4 mb-4 gap-3">
            <Text className="text-foreground font-semibold">Add Custom Exercise</Text>
            <Input
              placeholder="Exercise name"
              value={newName}
              onChangeText={setNewName}
              className="bg-secondary text-foreground"
              placeholderTextColor="#737373"
            />
            <Input
              placeholder="Muscle group (optional)"
              value={newMuscleGroup}
              onChangeText={setNewMuscleGroup}
              className="bg-secondary text-foreground"
              placeholderTextColor="#737373"
            />
            <View className="flex-row gap-2">
              <Button onPress={handleAddNew} className="flex-1 bg-primary">
                <Text className="text-primary-foreground font-bold">Add</Text>
              </Button>
              <Button onPress={() => setShowAddNew(false)} className="flex-1 bg-secondary">
                <Text className="text-secondary-foreground">Cancel</Text>
              </Button>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setShowAddNew(true)} className="flex-row items-center gap-2 mb-4">
            <Plus color="#0ea5e9" size={20} />
            <Text className="text-primary font-semibold">Add Custom Exercise</Text>
          </Pressable>
        )}

        <FlatList
          data={Object.entries(grouped)}
          keyExtractor={([group]) => group}
          renderItem={({ item: [group, items] }) => (
            <View className="mb-4">
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
                {group}
              </Text>
              {items.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => onSelect(exercise)}
                  className="py-3 px-2 border-b border-border"
                >
                  <Text className="text-foreground text-base">{exercise.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>
    </Modal>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: build exercise picker modal component"
```

---

## Task 11: Build Active Workout Screen

**Files:**
- Create: `app/workout/active.tsx`

**Step 1: Create the active workout screen**

```tsx
import { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Check, Square, CheckSquare } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { ExercisePicker } from '../../components/exercise-picker';
import { useWorkoutStore } from '../../stores/workout-store';
import { saveWorkout } from '../../db/queries';
import type { Exercise } from '../../lib/types';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const startedAt = useWorkoutStore((s) => s.startedAt);
  const exercises = useWorkoutStore((s) => s.exercises);
  const templateId = useWorkoutStore((s) => s.templateId);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const toggleSetComplete = useWorkoutStore((s) => s.toggleSetComplete);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);

  // Timer
  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise.id, exercise.name);
    setPickerVisible(false);
  };

  const handleFinish = async () => {
    const data = finishWorkout();
    const sets = data.exercises.flatMap((ex) =>
      ex.sets
        .filter((s) => s.completed && s.weight && s.reps)
        .map((s, i) => ({
          exercise_id: ex.exercise_id,
          set_number: i + 1,
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps, 10),
        }))
    );

    if (sets.length > 0) {
      await saveWorkout(data.templateId, data.startedAt, new Date().toISOString(), sets);
    }
    router.back();
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'Are you sure you want to discard this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          router.back();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-14 pb-3 bg-card">
        <Pressable onPress={handleDiscard}>
          <Text className="text-destructive font-semibold">Discard</Text>
        </Pressable>
        <Text className="text-foreground text-lg font-bold">{elapsed}</Text>
        <Pressable onPress={handleFinish}>
          <Text className="text-primary font-semibold">Finish</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {exercises.map((exercise) => (
          <Card key={exercise.exercise_id} className="mb-4 bg-card">
            <CardContent className="py-3 px-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-primary font-bold text-base">
                  {exercise.exercise_name}
                </Text>
                <Pressable onPress={() => removeExercise(exercise.exercise_id)}>
                  <Trash2 color="#ef4444" size={18} />
                </Pressable>
              </View>

              {/* Header row */}
              <View className="flex-row items-center mb-2 px-1">
                <Text className="text-muted-foreground text-xs w-8">SET</Text>
                <Text className="text-muted-foreground text-xs flex-1 text-center">WEIGHT (lb)</Text>
                <Text className="text-muted-foreground text-xs flex-1 text-center">REPS</Text>
                <View className="w-10" />
              </View>

              {exercise.sets.map((s, idx) => (
                <View key={s.id} className="flex-row items-center mb-2 px-1">
                  <Text className="text-muted-foreground text-sm w-8">{idx + 1}</Text>
                  <Input
                    value={s.weight}
                    onChangeText={(v) => updateSet(exercise.exercise_id, s.id, 'weight', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    className="flex-1 mx-1 h-10 text-center bg-secondary text-foreground text-lg font-bold"
                    placeholderTextColor="#525252"
                  />
                  <Input
                    value={s.reps}
                    onChangeText={(v) => updateSet(exercise.exercise_id, s.id, 'reps', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    className="flex-1 mx-1 h-10 text-center bg-secondary text-foreground text-lg font-bold"
                    placeholderTextColor="#525252"
                  />
                  <Pressable
                    onPress={() => toggleSetComplete(exercise.exercise_id, s.id)}
                    className="w-10 items-center"
                  >
                    {s.completed ? (
                      <CheckSquare color="#0ea5e9" size={22} />
                    ) : (
                      <Square color="#525252" size={22} />
                    )}
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => addSet(exercise.exercise_id)}
                className="flex-row items-center justify-center py-2 mt-1"
              >
                <Plus color="#a3a3a3" size={16} />
                <Text className="text-muted-foreground text-sm ml-1">Add Set</Text>
              </Pressable>
            </CardContent>
          </Card>
        ))}

        <Button
          onPress={() => setPickerVisible(true)}
          className="bg-secondary h-12 mb-4"
        >
          <View className="flex-row items-center gap-2">
            <Plus color="#f2f2f2" size={18} />
            <Text className="text-secondary-foreground font-semibold">Add Exercise</Text>
          </View>
        </Button>

        <Button onPress={handleFinish} className="bg-primary h-14 mb-8">
          <Text className="text-primary-foreground font-bold text-lg">Finish Workout</Text>
        </Button>
      </ScrollView>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={handleSelectExercise}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
```

**Step 2: Register the route in root layout**

Update `app/_layout.tsx` to add the workout stack screens:

```tsx
// Inside the <Stack> component, add:
<Stack.Screen name="workout/active" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
<Stack.Screen name="workout/pick-template" options={{ title: 'Pick Template', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#f2f2f2' }} />
<Stack.Screen name="workout/detail/[id]" options={{ title: 'Workout Detail', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#f2f2f2' }} />
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: build active workout session screen with set logging"
```

---

## Task 12: Build Template Picker Screen

**Files:**
- Create: `app/workout/pick-template.tsx`

**Step 1: Create the template picker**

```tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { useWorkoutStore } from '../../stores/workout-store';
import { getAllTemplates, getTemplateWithExercises } from '../../db/queries';
import type { Template } from '../../lib/types';

export default function PickTemplateScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addExercise = useWorkoutStore((s) => s.addExercise);

  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then(setTemplates);
    }, [])
  );

  const handleSelect = async (template: Template) => {
    startWorkout(template.id);
    const { exercises } = await getTemplateWithExercises(template.id);
    for (const ex of exercises) {
      addExercise(ex.exercise_id, ex.name, ex.target_sets, ex.target_reps);
    }
    router.replace('/workout/active');
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleSelect(item)}>
            <Card className="mb-2 bg-card">
              <CardContent className="py-4 px-4">
                <Text className="text-foreground font-semibold text-base">{item.name}</Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center mt-8">
            No templates yet. Create one in the Templates tab.
          </Text>
        }
      />
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: build template picker screen for starting template workouts"
```

---

## Task 13: Build Templates List and Create Screen

**Files:**
- Modify: `app/(tabs)/templates.tsx`
- Create: `app/template/create.tsx`

**Step 1: Build the templates list screen**

```tsx
// app/(tabs)/templates.tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { getAllTemplates, deleteTemplate, getTemplateWithExercises } from '../../db/queries';
import type { Template } from '../../lib/types';

export default function TemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<(Template & { exerciseSummary: string })[]>([]);

  const loadTemplates = useCallback(async () => {
    const all = await getAllTemplates();
    const withSummary = await Promise.all(
      all.map(async (t) => {
        const { exercises } = await getTemplateWithExercises(t.id);
        const names = exercises.map((e) => e.name).slice(0, 3).join(' · ');
        const suffix = exercises.length > 3 ? ` +${exercises.length - 3}` : '';
        return {
          ...t,
          exerciseSummary: names + suffix || 'No exercises',
        };
      })
    );
    setTemplates(withSummary);
  }, []);

  useFocusEffect(loadTemplates);

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(id);
          loadTemplates();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Pressable
        onPress={() => router.push('/template/create')}
        className="flex-row items-center gap-2 mb-4"
      >
        <Plus color="#0ea5e9" size={20} />
        <Text className="text-primary font-semibold text-base">New Template</Text>
      </Pressable>

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleDelete(item.id, item.name)}>
            <Card className="mb-2 bg-card">
              <CardContent className="py-3 px-4">
                <Text className="text-foreground font-semibold text-base">{item.name}</Text>
                <Text className="text-muted-foreground text-sm mt-1">{item.exerciseSummary}</Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center mt-8">
            No templates yet. Tap + to create one.
          </Text>
        }
      />
    </View>
  );
}
```

**Step 2: Build the create template screen**

```tsx
// app/template/create.tsx
import { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Plus } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { ExercisePicker } from '../../components/exercise-picker';
import { createTemplate } from '../../db/queries';
import type { Exercise } from '../../lib/types';

interface TemplateEntry {
  exercise: Exercise;
  target_sets: string;
  target_reps: string;
}

export default function CreateTemplateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<TemplateEntry[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    setEntries((prev) => [...prev, { exercise, target_sets: '3', target_reps: '10' }]);
    setPickerVisible(false);
  };

  const handleRemove = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name.');
      return;
    }
    if (entries.length === 0) {
      Alert.alert('Error', 'Add at least one exercise.');
      return;
    }

    await createTemplate(
      name.trim(),
      entries.map((e) => ({
        exercise_id: e.exercise.id,
        target_sets: parseInt(e.target_sets, 10) || 1,
        target_reps: parseInt(e.target_reps, 10) || 0,
      }))
    );
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <Input
          placeholder="Template name"
          value={name}
          onChangeText={setName}
          className="mb-4 bg-card text-foreground text-lg"
          placeholderTextColor="#737373"
        />

        {entries.map((entry, idx) => (
          <Card key={idx} className="mb-2 bg-card">
            <CardContent className="py-3 px-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-semibold">{entry.exercise.name}</Text>
                <Pressable onPress={() => handleRemove(idx)}>
                  <Trash2 color="#ef4444" size={16} />
                </Pressable>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-muted-foreground text-xs mb-1">Sets</Text>
                  <Input
                    value={entry.target_sets}
                    onChangeText={(v) => {
                      const copy = [...entries];
                      copy[idx] = { ...copy[idx], target_sets: v };
                      setEntries(copy);
                    }}
                    keyboardType="numeric"
                    className="bg-secondary text-foreground text-center"
                    placeholderTextColor="#525252"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted-foreground text-xs mb-1">Reps</Text>
                  <Input
                    value={entry.target_reps}
                    onChangeText={(v) => {
                      const copy = [...entries];
                      copy[idx] = { ...copy[idx], target_reps: v };
                      setEntries(copy);
                    }}
                    keyboardType="numeric"
                    className="bg-secondary text-foreground text-center"
                    placeholderTextColor="#525252"
                  />
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        <Button onPress={() => setPickerVisible(true)} className="bg-secondary h-12 mb-4">
          <View className="flex-row items-center gap-2">
            <Plus color="#f2f2f2" size={18} />
            <Text className="text-secondary-foreground font-semibold">Add Exercise</Text>
          </View>
        </Button>

        <Button onPress={handleSave} className="bg-primary h-14">
          <Text className="text-primary-foreground font-bold text-lg">Save Template</Text>
        </Button>
      </ScrollView>

      <ExercisePicker
        visible={pickerVisible}
        onSelect={handleAddExercise}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
```

**Step 3: Register route in root layout**

Add to `app/_layout.tsx` Stack:

```tsx
<Stack.Screen name="template/create" options={{ title: 'New Template', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#f2f2f2' }} />
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: build templates list and create template screens"
```

---

## Task 14: Build History Screen and Workout Detail

**Files:**
- Modify: `app/(tabs)/history.tsx`
- Create: `app/workout/detail/[id].tsx`

**Step 1: Build the history screen**

```tsx
// app/(tabs)/history.tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '../../components/ui/text';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { getWorkoutHistory } from '../../db/queries';
import type { WorkoutSummary } from '../../lib/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      getWorkoutHistory(100).then(setWorkouts);
    }, [])
  );

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    return `${mins} min`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const filtered = search.trim()
    ? workouts.filter(
        (w) =>
          w.template_name?.toLowerCase().includes(search.toLowerCase()) ||
          'freeform'.includes(search.toLowerCase())
      )
    : workouts;

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Input
        placeholder="Search workouts..."
        value={search}
        onChangeText={setSearch}
        className="mb-4 bg-card text-foreground"
        placeholderTextColor="#737373"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/workout/detail/${item.id}`)}>
            <Card className="mb-2 bg-card">
              <CardContent className="py-3 px-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-foreground font-semibold">
                    {item.template_name || 'Freeform'}
                  </Text>
                  <Text className="text-muted-foreground text-sm">{formatDate(item.started_at)}</Text>
                </View>
                <Text className="text-muted-foreground text-sm mt-1">
                  {item.exercise_count} exercises · {formatDuration(item.started_at, item.finished_at)} · {item.total_volume.toLocaleString()} lb
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center mt-8">No workouts found.</Text>
        }
      />
    </View>
  );
}
```

**Step 2: Build the workout detail screen**

```tsx
// app/workout/detail/[id].tsx
import { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { Card, CardContent } from '../../../components/ui/card';
import { getWorkoutDetail } from '../../../db/queries';
import type { WorkoutLog, WorkoutSet } from '../../../lib/types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<(WorkoutLog & { template_name: string | null }) | null>(null);
  const [sets, setSets] = useState<(WorkoutSet & { exercise_name: string })[]>([]);

  useEffect(() => {
    if (id) {
      getWorkoutDetail(Number(id)).then(({ log, sets }) => {
        setLog(log ?? null);
        setSets(sets);
      });
    }
  }, [id]);

  if (!log) return null;

  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    return `${mins} min`;
  };

  // Group sets by exercise
  const grouped = sets.reduce<Record<string, typeof sets>>((acc, s) => {
    if (!acc[s.exercise_name]) acc[s.exercise_name] = [];
    acc[s.exercise_name].push(s);
    return acc;
  }, {});

  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <Text className="text-foreground text-2xl font-bold mb-1">
        {log.template_name || 'Freeform Workout'}
      </Text>
      <Text className="text-muted-foreground mb-1">
        {new Date(log.started_at).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
      <Text className="text-muted-foreground mb-4">
        {formatDuration(log.started_at, log.finished_at)} · {totalVolume.toLocaleString()} lb total volume
      </Text>

      {Object.entries(grouped).map(([exerciseName, exerciseSets]) => (
        <Card key={exerciseName} className="mb-3 bg-card">
          <CardContent className="py-3 px-4">
            <Text className="text-primary font-bold mb-2">{exerciseName}</Text>
            <View className="flex-row mb-1">
              <Text className="text-muted-foreground text-xs w-10">SET</Text>
              <Text className="text-muted-foreground text-xs flex-1 text-center">WEIGHT</Text>
              <Text className="text-muted-foreground text-xs flex-1 text-center">REPS</Text>
            </View>
            {exerciseSets.map((s) => (
              <View key={s.id} className="flex-row py-1">
                <Text className="text-muted-foreground w-10">{s.set_number}</Text>
                <Text className="text-foreground flex-1 text-center font-bold">{s.weight} lb</Text>
                <Text className="text-foreground flex-1 text-center font-bold">{s.reps}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      ))}
    </ScrollView>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: build history screen and workout detail view"
```

---

## Task 15: Build Stats Screen

**Files:**
- Modify: `app/(tabs)/stats.tsx`

**Step 1: Build the stats screen**

```tsx
// app/(tabs)/stats.tsx
import { useState, useCallback } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Trophy, TrendingUp, Target } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { getPersonalRecords, getMonthlyStats, getExerciseVolumeHistory } from '../../db/queries';
import type { PersonalRecord } from '../../lib/types';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [monthly, setMonthly] = useState<{ workout_count: number; total_volume: number; top_muscle_group: string | null } | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPersonalRecords().then(setRecords);
      getMonthlyStats().then(setMonthly);
    }, [])
  );

  const loadChart = async (exerciseId: number, name: string) => {
    setSelectedExercise(name);
    const history = await getExerciseVolumeHistory(exerciseId, 90);
    if (history.length > 0) {
      setChartData({
        labels: history.map((h) => {
          const d = new Date(h.date);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        }),
        data: history.map((h) => h.total_volume),
      });
    } else {
      setChartData(null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      {/* Monthly summary cards */}
      <View className="flex-row gap-2 mb-6">
        <Card className="flex-1 bg-card">
          <CardContent className="py-3 items-center">
            <Target color="#0ea5e9" size={20} />
            <Text className="text-foreground text-2xl font-bold mt-1">
              {monthly?.workout_count ?? 0}
            </Text>
            <Text className="text-muted-foreground text-xs">Workouts</Text>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-card">
          <CardContent className="py-3 items-center">
            <TrendingUp color="#0ea5e9" size={20} />
            <Text className="text-foreground text-2xl font-bold mt-1">
              {monthly?.total_volume ? `${Math.round(monthly.total_volume / 1000)}k` : '0'}
            </Text>
            <Text className="text-muted-foreground text-xs">Volume (lb)</Text>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-card">
          <CardContent className="py-3 items-center">
            <Trophy color="#0ea5e9" size={20} />
            <Text className="text-foreground text-sm font-bold mt-1">
              {monthly?.top_muscle_group ?? '—'}
            </Text>
            <Text className="text-muted-foreground text-xs">#1 Muscle</Text>
          </CardContent>
        </Card>
      </View>

      {/* Volume chart */}
      {chartData && chartData.data.length > 1 && (
        <View className="mb-6">
          <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-2">
            Volume: {selectedExercise}
          </Text>
          <LineChart
            data={{
              labels: chartData.labels.length > 6
                ? chartData.labels.filter((_, i) => i % Math.ceil(chartData.labels.length / 6) === 0)
                : chartData.labels,
              datasets: [{ data: chartData.data }],
            }}
            width={screenWidth - 32}
            height={200}
            chartConfig={{
              backgroundColor: '#1E1E1E',
              backgroundGradientFrom: '#1E1E1E',
              backgroundGradientTo: '#1E1E1E',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
              style: { borderRadius: 8 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#0ea5e9' },
            }}
            bezier
            style={{ borderRadius: 8 }}
          />
        </View>
      )}

      {/* Personal records */}
      <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wide mb-3">
        Personal Records
      </Text>

      {records.length === 0 && (
        <Text className="text-muted-foreground text-center mt-4">
          Complete some workouts to see your PRs!
        </Text>
      )}

      {records.map((pr) => (
        <Card
          key={pr.exercise_id}
          className="mb-2 bg-card"
          onTouchEnd={() => loadChart(pr.exercise_id, pr.exercise_name)}
        >
          <CardContent className="py-3 px-4">
            <Text className="text-foreground font-semibold">{pr.exercise_name}</Text>
            <Text className="text-muted-foreground text-sm mt-1">
              Best: {pr.max_weight} lb × {pr.max_weight_reps} reps
            </Text>
          </CardContent>
        </Card>
      ))}
    </ScrollView>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: build stats screen with monthly summary, PRs, and volume chart"
```

---

## Task 16: Final Integration and Polish

**Step 1: Verify all screens load and navigate correctly**

```bash
npx expo start
```

Test flow:
- Home → Start Freeform → Add exercises → Log sets → Finish → See in history
- Templates → New Template → Add exercises → Save → Pick template → Start workout
- History → Tap workout → See detail
- Stats → See PRs → Tap to load chart

**Step 2: Fix any TypeScript errors**

```bash
npx tsc --noEmit
```

Fix any type errors found.

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final integration and polish"
```
