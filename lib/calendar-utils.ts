import type { CalendarDay } from './types';

export function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function buildCalendarDays(
  year: number,
  month: number,
  workoutMap: Map<string, number>,
  today: string
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDay[] = [];

  // Previous month overflow
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDays - i;
    const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day);
    const date = formatDateStr(d);
    const workoutId = workoutMap.get(date) ?? null;
    cells.push({
      day,
      date,
      isCurrentMonth: false,
      isToday: date === today,
      hasWorkout: workoutId !== null,
      workoutId,
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const date = formatDateStr(d);
    const workoutId = workoutMap.get(date) ?? null;
    cells.push({
      day,
      date,
      isCurrentMonth: true,
      isToday: date === today,
      hasWorkout: workoutId !== null,
      workoutId,
    });
  }

  // Next month overflow to fill 42 cells (6 rows)
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    const date = formatDateStr(d);
    const workoutId = workoutMap.get(date) ?? null;
    cells.push({
      day,
      date,
      isCurrentMonth: false,
      isToday: date === today,
      hasWorkout: workoutId !== null,
      workoutId,
    });
  }

  return cells;
}

export function calculateCurrentStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);

  // Start counting from today or yesterday
  const first = sortedDatesDesc[0];
  if (first !== todayStr && first !== yesterdayStr) return 0;

  let streak = 1;
  let prev = new Date(first + 'T00:00:00');

  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const curr = new Date(sortedDatesDesc[i] + 'T00:00:00');
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      prev = curr;
    } else {
      break;
    }
  }

  return streak;
}
