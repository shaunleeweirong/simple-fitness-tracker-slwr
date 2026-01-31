import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { CalendarDayCell } from './CalendarDayCell';
import type { CalendarDay } from '../../lib/types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  days: CalendarDay[];
  onDayPress: (day: CalendarDay) => void;
}

export function CalendarGrid({ days, onDayPress }: Props) {
  const rows: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <View>
      {/* Weekday headers */}
      <View className="flex-row mb-1">
        {WEEKDAYS.map((d) => (
          <View key={d} className="flex-1 items-center py-1">
            <Text className="text-xs text-muted-foreground font-medium">
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Day rows */}
      {rows.map((row, i) => (
        <View key={i} className="flex-row">
          {row.map((day) => (
            <CalendarDayCell key={day.date} day={day} onPress={onDayPress} />
          ))}
        </View>
      ))}
    </View>
  );
}
