import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Dumbbell, LayoutGrid, Play, ChevronRight } from 'lucide-react-native';

import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useWorkoutStore } from '../../stores/workout-store';
import { getWorkoutHistory } from '../../db/queries';
import type { WorkoutSummary } from '../../lib/types';

// ── Helpers ──────────────────────────────────────────────────────────

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder > 0 ? `${hrs}h ${remainder}m` : `${hrs}h`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1).replace(/\.0$/, '')}k lbs`;
  }
  return `${volume} lbs`;
}

// ── Workout Card ─────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  onPress,
}: {
  workout: WorkoutSummary;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3">
        <CardContent className="p-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {workout.template_name ?? 'Freeform Workout'}
            </Text>
            <View className="flex-row items-center gap-3 mt-1">
              <Text className="text-sm text-muted-foreground">
                {formatRelativeDate(workout.started_at)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {formatDuration(workout.started_at, workout.finished_at)}
              </Text>
            </View>
            <Text className="text-sm text-primary mt-1">
              {formatVolume(workout.total_volume)} volume
            </Text>
          </View>
          <ChevronRight size={20} color="#a3a3a3" />
        </CardContent>
      </Card>
    </Pressable>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────

export default function LogScreen() {
  const router = useRouter();
  const { isActive, startWorkout } = useWorkoutStore();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      let cancelled = false;

      async function load() {
        try {
          const history = await getWorkoutHistory(5);
          if (!cancelled) {
            setRecentWorkouts(history);
          }
        } catch (err) {
          console.error('Failed to load workout history', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function handleStartFreeform() {
    setNavigating(true);
    startWorkout(null);
    router.push('/workout/active');
  }

  function handlePickTemplate() {
    router.push('/workout/pick-template');
  }

  function handleResume() {
    router.push('/workout/active');
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={recentWorkouts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-6">
            {/* Title */}
            <Text className="text-2xl font-bold text-foreground mb-6">
              Log Workout
            </Text>

            {/* Action Buttons */}
            {isActive && !navigating ? (
              <Button
                className="mb-3 bg-green-600"
                onPress={handleResume}
              >
                <View className="flex-row items-center gap-2">
                  <Play size={20} color="#fff" />
                  <Text className="text-base font-semibold text-white">
                    Resume Workout
                  </Text>
                </View>
              </Button>
            ) : (
              <View className="gap-3">
                <Button onPress={handleStartFreeform}>
                  <View className="flex-row items-center gap-2">
                    <Dumbbell size={20} color="#fff" />
                    <Text className="text-base font-semibold text-primary-foreground">
                      Start Freeform Workout
                    </Text>
                  </View>
                </Button>

                <Button variant="secondary" onPress={handlePickTemplate}>
                  <View className="flex-row items-center gap-2">
                    <LayoutGrid size={20} color="#e5e5e5" />
                    <Text className="text-base font-semibold text-secondary-foreground">
                      Pick a Template
                    </Text>
                  </View>
                </Button>
              </View>
            )}

            {/* Recent Workouts Section Header */}
            {recentWorkouts.length > 0 && (
              <Text className="text-lg font-semibold text-foreground mt-6 mb-3">
                Recent Workouts
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="items-center py-8">
              <Text className="text-muted-foreground text-base">
                No workouts yet. Start your first one!
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => router.push(`/workout/detail/${item.id}`)}
          />
        )}
        stickyHeaderHiddenOnScroll
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
