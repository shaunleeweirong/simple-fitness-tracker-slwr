import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SquareCheck, Square, Trash2, Plus, Timer } from 'lucide-react-native';

import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ExercisePicker } from '../../components/exercise-picker';
import { useWorkoutStore } from '../../stores/workout-store';
import { saveWorkout } from '../../db/queries';
import type { Exercise } from '../../lib/types';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const {
    isActive,
    exercises,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    toggleSetComplete,
    finishWorkout,
    discardWorkout,
  } = useWorkoutStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Rest countdown timer state
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [restDisplay, setRestDisplay] = useState('');
  const [restDone, setRestDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rest countdown effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!restEndTime) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setRestDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRestEndTime(null);
        setRestDone(true);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restEndTime]);

  const handleRestTimer = useCallback(() => {
    // Clear any active countdown
    setRestEndTime(null);
    setRestDone(false);

    Alert.alert('Rest Timer', 'Choose rest duration', [
      { text: '0:30', onPress: () => setRestEndTime(Date.now() + 30 * 1000) },
      { text: '1:00', onPress: () => setRestEndTime(Date.now() + 60 * 1000) },
      { text: '1:30', onPress: () => setRestEndTime(Date.now() + 90 * 1000) },
      { text: '2:00', onPress: () => setRestEndTime(Date.now() + 120 * 1000) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  // If navigated here without an active workout, go back
  useEffect(() => {
    if (isFocused && !isActive && !saving) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [isFocused, isActive, saving]);

  function handleDiscard() {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard this workout? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
          },
        },
      ]
    );
  }

  async function handleFinish() {
    if (saving) return;
    setSaving(true);

    try {
      const result = finishWorkout();
      const finishedAt = new Date().toISOString();

      // Flatten completed sets with valid weight/reps
      const sets: { exercise_id: number; set_number: number; weight: number; reps: number }[] = [];

      for (const exercise of result.exercises) {
        let setNumber = 1;
        for (const s of exercise.sets) {
          const weight = parseFloat(s.weight);
          const reps = parseInt(s.reps, 10);
          if (s.completed && !isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
            sets.push({
              exercise_id: exercise.exercise_id,
              set_number: setNumber,
              weight,
              reps,
            });
            setNumber++;
          }
        }
      }

      await saveWorkout(result.templateId, result.startedAt, finishedAt, sets);
      setSaving(false);
    } catch (err) {
      console.error('Failed to save workout', err);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
      setSaving(false);
    }
  }

  function handleSelectExercise(exercise: Exercise) {
    addExercise(exercise.id, exercise.name);
    setPickerVisible(false);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-3 bg-background border-b border-border">
        <Pressable onPress={handleDiscard} hitSlop={8}>
          <Text className="text-base font-semibold text-destructive">Discard</Text>
        </Pressable>

        <Pressable onPress={handleRestTimer} className="flex-row items-center gap-1.5" hitSlop={8}>
          {restEndTime ? (
            <Text className="text-lg font-bold text-primary">{restDisplay}</Text>
          ) : restDone ? (
            <Text className="text-lg font-bold text-green-500">Done!</Text>
          ) : (
            <>
              <Timer size={16} color="#6b7280" />
              <Text className="text-lg font-bold text-muted-foreground">Rest</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={handleFinish} hitSlop={8} disabled={saving}>
          <Text className="text-base font-semibold text-primary">
            {saving ? 'Saving...' : 'Finish'}
          </Text>
        </Pressable>
      </View>

      {/* Exercise Cards */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((exercise) => (
          <Card key={exercise.exercise_id} className="mb-4">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-primary font-bold flex-1">
                {exercise.exercise_name}
              </CardTitle>
              <Pressable
                onPress={() => removeExercise(exercise.exercise_id)}
                hitSlop={8}
                className="p-1"
              >
                <Trash2 size={20} color="#ef4444" />
              </Pressable>
            </CardHeader>

            <CardContent>
              {/* Set Header Row */}
              <View className="flex-row items-center mb-2 px-1">
                <Text className="text-xs font-semibold uppercase text-muted-foreground w-10">
                  SET
                </Text>
                <Text className="text-xs font-semibold uppercase text-muted-foreground flex-1 text-center">
                  WEIGHT (kg)
                </Text>
                <Text className="text-xs font-semibold uppercase text-muted-foreground flex-1 text-center">
                  REPS
                </Text>
                <View className="w-10 items-center">
                  <SquareCheck size={14} color="#6b7280" />
                </View>
              </View>

              {/* Set Rows */}
              {exercise.sets.map((set, index) => (
                <View
                  key={set.id}
                  className={`flex-row items-center py-1.5 px-1 rounded-md ${
                    set.completed ? 'bg-green-900/20' : ''
                  }`}
                >
                  <Text className="text-sm font-medium text-muted-foreground w-10 text-center">
                    {index + 1}
                  </Text>

                  <View className="flex-1 px-1">
                    <Input
                      className="h-9 text-center text-sm"
                      placeholder="0"
                      value={set.weight}
                      onChangeText={(val) =>
                        updateSet(exercise.exercise_id, set.id, 'weight', val)
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View className="flex-1 px-1">
                    <Input
                      className="h-9 text-center text-sm"
                      placeholder="0"
                      value={set.reps}
                      onChangeText={(val) =>
                        updateSet(exercise.exercise_id, set.id, 'reps', val)
                      }
                      keyboardType="number-pad"
                    />
                  </View>

                  <Pressable
                    className="w-10 items-center"
                    onPress={() =>
                      toggleSetComplete(exercise.exercise_id, set.id)
                    }
                    hitSlop={6}
                  >
                    {set.completed ? (
                      <SquareCheck size={22} color="#22c55e" />
                    ) : (
                      <Square size={22} color="#6b7280" />
                    )}
                  </Pressable>
                </View>
              ))}

              {/* Add Set Button */}
              <Pressable
                className="flex-row items-center justify-center gap-1.5 mt-3 py-2"
                onPress={() => addSet(exercise.exercise_id)}
              >
                <Plus size={16} color="#0ea5e9" />
                <Text className="text-sm font-medium text-primary">Add Set</Text>
              </Pressable>
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <Button
          variant="outline"
          className="mb-4"
          onPress={() => setPickerVisible(true)}
        >
          <View className="flex-row items-center gap-2">
            <Plus size={20} color="#f2f2f2" />
            <Text className="text-base font-semibold text-foreground">
              Add Exercise
            </Text>
          </View>
        </Button>

        {/* Finish Workout Button */}
        {exercises.length > 0 && (
          <Button onPress={handleFinish} disabled={saving}>
            {saving ? 'Saving Workout...' : 'Finish Workout'}
          </Button>
        )}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        visible={pickerVisible}
        onSelect={handleSelectExercise}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
