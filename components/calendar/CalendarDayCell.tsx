import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../ui/text';
import type { CalendarDay } from '../../lib/types';

interface Props {
  day: CalendarDay;
  onPress: (day: CalendarDay) => void;
}

export function CalendarDayCell({ day, onPress }: Props) {
  const dimmed = !day.isCurrentMonth;
  const workout = day.hasWorkout && day.isCurrentMonth;

  return (
    <Pressable
      onPress={() => day.hasWorkout && onPress(day)}
      className={`flex-1 items-center justify-center py-1.5 rounded-lg ${
        workout ? 'bg-primary/20' : ''
      } ${day.isToday ? 'border border-primary' : ''}`}
    >
      <Text
        className={`text-sm ${
          dimmed
            ? 'text-muted-foreground/40'
            : workout
              ? 'font-bold text-foreground'
              : 'text-foreground'
        }`}
      >
        {day.day}
      </Text>
      {workout && (
        <View className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
      )}
    </Pressable>
  );
}
