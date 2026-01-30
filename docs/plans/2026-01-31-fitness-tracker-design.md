# Simple Fitness Tracker — Design Document

## Overview

A React Native (Expo) workout tracker with a dark, gym-focused UI. Users can log freeform workouts or create reusable templates, track exercises with sets/reps/weight, and view their history with basic stats like personal records and volume over time. All data stays on-device using local storage.

## Tech Stack

- **React Native + Expo** — App framework with managed workflow
- **Expo Router** — File-based navigation (tab layout + stack screens)
- **NativeWind** — Tailwind CSS for React Native styling
- **react-native-reusables** — shadcn/ui component port for React Native
- **expo-sqlite** — Local database for structured workout data
- **victory-native** or **react-native-chart-kit** — Line charts for volume trends
- **zustand** — Lightweight state management for active workout session

## Data Model

### Entities

- **Exercise** — A named movement (e.g., "Bench Press"). Has a name and optional muscle group tag. Ships with a preset list; users can add custom ones.
- **Workout Template** — A saved routine with an ordered list of exercises and target sets/reps.
- **Workout Log** — A completed session with date, duration, optional template reference, and actual exercises performed with sets (each recording reps and weight).

### Database Tables

```
exercises
  id            INTEGER PRIMARY KEY
  name          TEXT NOT NULL
  muscle_group  TEXT

templates
  id            INTEGER PRIMARY KEY
  name          TEXT NOT NULL
  created_at    TEXT NOT NULL

template_exercises
  template_id   INTEGER REFERENCES templates(id)
  exercise_id   INTEGER REFERENCES exercises(id)
  sort_order    INTEGER
  target_sets   INTEGER
  target_reps   INTEGER

workout_logs
  id            INTEGER PRIMARY KEY
  template_id   INTEGER REFERENCES templates(id) NULLABLE
  started_at    TEXT NOT NULL
  finished_at   TEXT NOT NULL

workout_sets
  id            INTEGER PRIMARY KEY
  workout_log_id INTEGER REFERENCES workout_logs(id)
  exercise_id   INTEGER REFERENCES exercises(id)
  set_number    INTEGER
  weight        REAL
  reps          INTEGER
```

## Screens & Navigation

Bottom tab navigation with 4 tabs:

### 1. Log Workout (Home Tab)

- Two primary buttons: "Start Freeform" or "Pick a Template"
- Below: list of recent workouts for quick reference
- Starting a workout navigates to the Active Workout Session screen

### 2. Templates

- List of saved templates with name and exercise summary
- Tap to edit, long-press to delete, plus button to create new
- Each template has a name and ordered list of exercises with target sets/reps

### 3. History

- Reverse-chronological list of completed workouts
- Each card shows: template name (or "Freeform"), date, exercise count, duration, total volume
- Search/filter by exercise name
- Tap to see full workout detail

### 4. Stats

- **Summary cards** at top: workouts this month, total volume, most trained muscle group
- **Personal Records** per exercise: heaviest set (weight) and highest volume set (weight x reps)
- **Volume chart**: line chart per exercise showing total session volume over last 30/90 days

## Active Workout Flow

1. User taps "Start Freeform" or selects a template
2. If template: exercises pre-populated with target sets/reps; user fills in actual weight/reps
3. If freeform: empty session; user searches/picks exercises and adds sets
4. Each set is a row: weight input + reps input + checkmark to confirm
5. "Add Set" button below each exercise, "Add Exercise" button at bottom
6. Timer runs in the header showing elapsed time
7. "Finish Workout" saves the log and returns to home
8. If a new PR is hit, brief celebration indicator shown

## Visual Design

- **Dark background**: near-black base (#121212) with dark surface cards (#1E1E1E)
- **Bold accent color**: electric blue or vibrant green for primary actions, PR indicators, chart lines
- **Typography**: large, bold numbers for weight/reps inputs (readable mid-set); clean sans-serif elsewhere
- **Minimal chrome**: no unnecessary borders; cards with subtle elevation; generous touch targets for gym use
- **Component system**: shadcn/ui via react-native-reusables for consistent buttons, cards, inputs, dialogs

## Project Structure

```
src/
  app/                    # Expo Router screens
    (tabs)/
      index.tsx           # Log Workout (home)
      templates.tsx       # Templates list
      history.tsx         # Workout history
      stats.tsx           # Stats & PRs
    workout/
      [id].tsx            # Active workout session
      detail/[id].tsx     # Past workout detail view
  components/             # Reusable UI components (shadcn-style)
  db/                     # SQLite schema, queries, migrations
  lib/                    # Utilities, types, constants
  stores/                 # Zustand stores (workout session, etc.)
```

## Scope Boundaries

**In scope:**
- Workout logging (freeform + templates)
- Exercise library with presets + custom
- Workout history with search
- Personal records and volume charts
- Dark theme with shadcn design system

**Out of scope (for now):**
- User accounts / cloud sync
- Social features
- Nutrition tracking
- Rest timer / notifications
- Apple Health / Google Fit integration
