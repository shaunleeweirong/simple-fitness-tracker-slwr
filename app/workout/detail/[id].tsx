import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { getWorkoutDetail } from '../../../db/queries';
import type { WorkoutLog, WorkoutSet } from '../../../lib/types';

type WorkoutLogRow = WorkoutLog & { template_name: string | null };
type SetRow = WorkoutSet & { exercise_name: string; muscle_group: string | null };

interface ExerciseGroup {
  exercise_name: string;
  sets: SetRow[];
}

function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1).replace(/\.0$/, '')}k lbs`;
  }
  return `${volume} lbs`;
}

function groupSetsByExercise(sets: SetRow[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  const map = new Map<string, SetRow[]>();

  for (const set of sets) {
    const existing = map.get(set.exercise_name);
    if (existing) {
      existing.push(set);
    } else {
      const arr = [set];
      map.set(set.exercise_name, arr);
      groups.push({ exercise_name: set.exercise_name, sets: arr });
    }
  }

  return groups;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [log, setLog] = useState<WorkoutLogRow | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await getWorkoutDetail(Number(id));
      if (data.log) setLog(data.log);
      setSets(data.sets);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Workout Detail', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#f2f2f2' }} />
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </>
    );
  }

  if (!log) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Workout Detail', headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#f2f2f2' }} />
        <View className="flex-1 bg-background items-center justify-center">
          <Text className="text-muted-foreground text-base">Workout not found.</Text>
        </View>
      </>
    );
  }

  const workoutName = log.template_name ?? 'Freeform Workout';
  const fullDate = formatFullDate(log.started_at);
  const duration = formatDuration(log.started_at, log.finished_at);
  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const exerciseGroups = groupSetsByExercise(sets);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: workoutName,
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#f2f2f2',
        }}
      />
      <ScrollView className="flex-1 bg-background px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Summary header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">
            {workoutName}
          </Text>
          <Text className="text-sm text-muted-foreground mb-2">{fullDate}</Text>
          <View className="flex-row items-center gap-6">
            <View>
              <Text className="text-xs text-muted-foreground uppercase">Duration</Text>
              <Text className="text-base font-semibold text-foreground">{duration}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground uppercase">Volume</Text>
              <Text className="text-base font-semibold text-primary">{formatVolume(totalVolume)}</Text>
            </View>
          </View>
        </View>

        {/* Exercise cards */}
        {exerciseGroups.map((group) => (
          <Card key={group.exercise_name} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary text-lg">
                {group.exercise_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table header */}
              <View className="flex-row mb-2 pb-2 border-b border-border">
                <Text className="flex-1 text-xs font-semibold text-muted-foreground uppercase">Set</Text>
                <Text className="flex-1 text-xs font-semibold text-muted-foreground uppercase text-center">Weight</Text>
                <Text className="flex-1 text-xs font-semibold text-muted-foreground uppercase text-right">Reps</Text>
              </View>
              {/* Table rows */}
              {group.sets.map((set) => (
                <View key={set.id} className="flex-row py-1.5">
                  <Text className="flex-1 text-sm text-foreground">{set.set_number}</Text>
                  <Text className="flex-1 text-sm text-foreground text-center">{set.weight} lbs</Text>
                  <Text className="flex-1 text-sm text-foreground text-right">{set.reps}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </>
  );
}
