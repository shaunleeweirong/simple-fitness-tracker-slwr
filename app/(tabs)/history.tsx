import { useState, useCallback } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { getWorkoutHistory } from '../../db/queries';
import type { WorkoutSummary } from '../../lib/types';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1).replace(/\.0$/, '')}k lbs`;
  }
  return `${volume} lbs`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const data = await getWorkoutHistory(100);
        if (!cancelled) setWorkouts(data);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const filtered = workouts.filter((w) => {
    if (!search.trim()) return true;
    const label = w.template_name ?? 'freeform';
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  const renderItem = ({ item }: { item: WorkoutSummary }) => {
    const label = item.template_name ?? 'Freeform';
    const date = formatDate(item.started_at);
    const duration = formatDuration(item.started_at, item.finished_at);
    const volume = formatVolume(item.total_volume);

    return (
      <Pressable
        onPress={() => router.push(`/workout/detail/${item.id}`)}
        className="mb-3"
      >
        <Card>
          <CardContent className="p-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-lg font-semibold text-foreground">
                {label}
              </Text>
              <Text className="text-sm text-muted-foreground">{date}</Text>
            </View>
            <View className="flex-row items-center gap-4 mt-1">
              <Text className="text-sm text-muted-foreground">
                {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {duration}
              </Text>
              <Text className="text-sm text-primary font-medium">
                {volume}
              </Text>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Input
        placeholder="Search workouts..."
        value={search}
        onChangeText={setSearch}
        className="mb-4"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-muted-foreground text-base">
              No workouts found.
            </Text>
          </View>
        }
      />
    </View>
  );
}
