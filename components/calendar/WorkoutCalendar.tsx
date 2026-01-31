import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Flame, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Text } from '../ui/text';
import { Card, CardContent } from '../ui/card';
import { CalendarGrid } from './CalendarGrid';
import { getWorkoutDaysForMonth, getAllWorkoutDates } from '../../db/queries';
import {
  formatDateStr,
  getMonthLabel,
  buildCalendarDays,
  calculateCurrentStreak,
} from '../../lib/calendar-utils';
import type { CalendarDay } from '../../lib/types';

export function WorkoutCalendar() {
  const router = useRouter();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [monthWorkoutCount, setMonthWorkoutCount] = useState(0);

  const today = formatDateStr(now);
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const [monthData, allDates] = await Promise.all([
            getWorkoutDaysForMonth(selectedYear, selectedMonth),
            getAllWorkoutDates(),
          ]);

          if (cancelled) return;

          const workoutMap = new Map<string, number>();
          for (const row of monthData) {
            workoutMap.set(row.date, row.workout_id);
          }

          setDays(buildCalendarDays(selectedYear, selectedMonth, workoutMap, today));
          setMonthWorkoutCount(monthData.length);
          setCurrentStreak(calculateCurrentStreak(allDates.map((d) => d.date)));
        } catch {
          // silently ignore
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [selectedYear, selectedMonth])
  );

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDayPress = (day: CalendarDay) => {
    if (day.workoutId) {
      router.push(`/workout/detail/${day.workoutId}`);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="py-4 px-3">
        {/* Month navigation */}
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={goToPrevMonth} hitSlop={8} className="p-1">
            <ChevronLeft size={20} color="#a3a3a3" />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">
            {getMonthLabel(selectedYear, selectedMonth)}
          </Text>
          <Pressable
            onPress={goToNextMonth}
            hitSlop={8}
            className="p-1"
            disabled={isCurrentMonth}
          >
            <ChevronRight
              size={20}
              color={isCurrentMonth ? '#525252' : '#a3a3a3'}
            />
          </Pressable>
        </View>

        {/* Calendar grid */}
        <CalendarGrid days={days} onDayPress={handleDayPress} />

        {/* Streak & monthly count */}
        <View className="flex-row items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
          <View className="flex-row items-center gap-1.5">
            <Flame size={16} color="#f97316" />
            <Text className="text-sm text-foreground font-medium">
              {currentStreak} day streak
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={16} color="#0ea5e9" />
            <Text className="text-sm text-foreground font-medium">
              {monthWorkoutCount} this month
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
