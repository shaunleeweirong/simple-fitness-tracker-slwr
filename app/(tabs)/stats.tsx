import React, { useCallback, useState } from 'react';
import { View, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Trophy, TrendingUp, Target } from 'lucide-react-native';

import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { WorkoutCalendar } from '../../components/calendar/WorkoutCalendar';
import {
  getPersonalRecords,
  getMonthlyStats,
  getExerciseVolumeHistory,
} from '../../db/queries';
import type { PersonalRecord } from '../../lib/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function StatsScreen() {
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<{
    workout_count: number;
    total_volume: number;
    top_muscle_group: string | null;
  } | null>(null);
  const [volumeData, setVolumeData] = useState<{ date: string; total_volume: number }[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const [prData, statsData] = await Promise.all([
            getPersonalRecords(),
            getMonthlyStats(),
          ]);
          if (!cancelled) {
            setPrs(prData);
            setMonthlyStats(statsData);
            setLoading(false);
          }
        } catch {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handlePrPress = useCallback(async (pr: PersonalRecord) => {
    try {
      const history = await getExerciseVolumeHistory(pr.exercise_id, 90);
      setVolumeData(history);
      setSelectedExercise(pr.exercise_name);
    } catch {
      // silently ignore
    }
  }, []);

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return String(volume);
  };

  const buildChartData = () => {
    if (volumeData.length === 0) return null;

    const labels = volumeData.map((d) => {
      const parts = d.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    const values = volumeData.map((d) => d.total_volume);

    // Thin out labels if there are more than 6
    const thinnedLabels =
      labels.length <= 6
        ? labels
        : labels.map((label, i) => {
            const step = Math.ceil(labels.length / 6);
            return i % step === 0 ? label : '';
          });

    return {
      labels: thinnedLabels,
      datasets: [{ data: values }],
    };
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const chartData = buildChartData();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      {/* Workout Calendar */}
      <WorkoutCalendar />

      {/* Monthly Summary Cards */}
      <View className="flex-row gap-3 mb-6">
        <Card className="flex-1">
          <CardContent className="items-center py-4 px-2">
            <Target size={24} color="#0ea5e9" />
            <Text className="text-2xl font-bold text-foreground mt-2">
              {monthlyStats?.workout_count ?? 0}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">Workouts</Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="items-center py-4 px-2">
            <TrendingUp size={24} color="#0ea5e9" />
            <Text className="text-2xl font-bold text-foreground mt-2">
              {formatVolume(monthlyStats?.total_volume ?? 0)}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">Volume (kg)</Text>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="items-center py-4 px-2">
            <Trophy size={24} color="#0ea5e9" />
            <Text className="text-2xl font-bold text-foreground mt-2" numberOfLines={1}>
              {monthlyStats?.top_muscle_group ?? '—'}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">#1 Muscle</Text>
          </CardContent>
        </Card>
      </View>

      {/* Volume Chart */}
      {selectedExercise && chartData && (
        <View className="mb-6">
          <Text className="text-sm text-muted-foreground mb-2">
            Volume: {selectedExercise}
          </Text>
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 32}
            height={200}
            chartConfig={{
              backgroundColor: '#1E1E1E',
              backgroundGradientFrom: '#1E1E1E',
              backgroundGradientTo: '#1E1E1E',
              color: (opacity = 1) => `rgba(14,165,233,${opacity})`,
              labelColor: (opacity = 1) => `rgba(163,163,163,${opacity})`,
              decimalPlaces: 0,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#0ea5e9',
              },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      {/* Personal Records */}
      <Text className="text-lg font-semibold text-foreground mb-3">Personal Records</Text>

      {prs.length === 0 ? (
        <Text className="text-muted-foreground text-center mt-4">
          Complete some workouts to see your PRs!
        </Text>
      ) : (
        prs.map((pr) => (
          <Pressable key={pr.exercise_id} onPress={() => handlePrPress(pr)}>
            <Card className="mb-3">
              <CardContent className="py-3">
                <Text className="text-base font-medium text-foreground">
                  {pr.exercise_name}
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  Best: {pr.max_weight} kg x {pr.max_weight_reps} reps
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
