import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Pencil, Trash2, Plus, X, Check, Minus } from 'lucide-react-native';
import { getWorkoutDetail, deleteWorkout, updateWorkoutSets, updateWorkoutName } from '../../../db/queries';
import type { WorkoutLog, WorkoutSet } from '../../../lib/types';

type WorkoutLogRow = WorkoutLog & { template_name: string | null };
type SetRow = WorkoutSet & { exercise_name: string; muscle_group: string | null };

interface EditableSet {
  exercise_id: number;
  exercise_name: string;
  muscle_group: string | null;
  set_number: number;
  weight: string;
  reps: string;
}

interface ExerciseGroup {
  exercise_name: string;
  sets: SetRow[];
}

interface EditableExerciseGroup {
  exercise_id: number;
  exercise_name: string;
  muscle_group: string | null;
  sets: EditableSet[];
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

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1).replace(/\.0$/, '')}k kg`;
  }
  return `${volume} kg`;
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

function groupEditSetsByExercise(sets: EditableSet[]): EditableExerciseGroup[] {
  const groups: EditableExerciseGroup[] = [];
  const map = new Map<number, EditableSet[]>();

  for (const set of sets) {
    const existing = map.get(set.exercise_id);
    if (existing) {
      existing.push(set);
    } else {
      const arr = [set];
      map.set(set.exercise_id, arr);
      groups.push({
        exercise_id: set.exercise_id,
        exercise_name: set.exercise_name,
        muscle_group: set.muscle_group,
        sets: arr,
      });
    }
  }

  return groups;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<WorkoutLogRow | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editSets, setEditSets] = useState<EditableSet[]>([]);
  const [editName, setEditName] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    const data = await getWorkoutDetail(Number(id));
    if (data.log) setLog(data.log);
    setSets(data.sets);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const enterEditMode = () => {
    setEditName(log?.template_name ?? 'Freeform Workout');
    setEditSets(
      sets.map((s) => ({
        exercise_id: s.exercise_id,
        exercise_name: s.exercise_name,
        muscle_group: s.muscle_group,
        set_number: s.set_number,
        weight: String(s.weight),
        reps: String(s.reps),
      }))
    );
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditSets([]);
    setEditName('');
    setEditing(false);
  };

  const updateEditSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setEditSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSet = (exerciseId: number, exerciseName: string, muscleGroup: string | null) => {
    setEditSets((prev) => {
      const exerciseSets = prev.filter((s) => s.exercise_id === exerciseId);
      const nextSetNumber = exerciseSets.length + 1;
      return [
        ...prev,
        {
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          muscle_group: muscleGroup,
          set_number: nextSetNumber,
          weight: '',
          reps: '',
        },
      ];
    });
  };

  const removeSet = (index: number) => {
    setEditSets((prev) => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      // Renumber sets for that exercise
      let setNum = 1;
      for (const s of next) {
        if (s.exercise_id === removed.exercise_id) {
          s.set_number = setNum++;
        }
      }
      return [...next];
    });
  };

  const handleSave = async () => {
    if (!log) return;
    const validSets = editSets.filter((s) => {
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      return !isNaN(w) && w > 0 && !isNaN(r) && r > 0;
    });

    const trimmedName = editName.trim();
    await updateWorkoutName(log.id, trimmedName || null);

    await updateWorkoutSets(
      log.id,
      validSets.map((s) => ({
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps, 10),
      }))
    );

    setEditing(false);
    setEditSets([]);
    setEditName('');
    await fetchDetail();
  };

  const handleDelete = () => {
    if (!log) return;
    Alert.alert('Delete Workout', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(log.id);
          router.back();
        },
      },
    ]);
  };

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
  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const exerciseGroups = groupSetsByExercise(sets);
  const editGroups = editing ? groupEditSetsByExercise(editSets) : [];

  // Find the flat index of an editable set within editSets
  const flatIndex = (exerciseId: number, setIdx: number): number => {
    let count = 0;
    for (let i = 0; i < editSets.length; i++) {
      if (editSets[i].exercise_id === exerciseId) {
        if (count === setIdx) return i;
        count++;
      }
    }
    return -1;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: workoutName,
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#f2f2f2',
          headerRight: () => (
            <View className="flex-row items-center gap-2 mr-1">
              {editing ? (
                <>
                  <Pressable onPress={cancelEdit} hitSlop={8}>
                    <X size={22} color="#f2f2f2" />
                  </Pressable>
                  <Pressable onPress={handleSave} hitSlop={8}>
                    <Check size={22} color="#22c55e" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable onPress={enterEditMode} hitSlop={8}>
                    <Pencil size={20} color="#f2f2f2" />
                  </Pressable>
                  <Pressable onPress={handleDelete} hitSlop={8}>
                    <Trash2 size={20} color="#ef4444" />
                  </Pressable>
                </>
              )}
            </View>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Summary header */}
        <View className="mb-6">
          {editing ? (
            <Input
              className="text-2xl font-bold mb-1"
              value={editName}
              onChangeText={setEditName}
              placeholder="Workout name"
            />
          ) : (
            <Text className="text-2xl font-bold text-foreground mb-1">
              {workoutName}
            </Text>
          )}
          <Text className="text-sm text-muted-foreground mb-2">{fullDate}</Text>
          <View className="flex-row items-center gap-6">
            <View>
              <Text className="text-xs text-muted-foreground uppercase">Volume</Text>
              <Text className="text-base font-semibold text-primary">{formatVolume(totalVolume)}</Text>
            </View>
          </View>
        </View>

        {/* Exercise cards — view mode */}
        {!editing &&
          exerciseGroups.map((group) => (
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
                    <Text className="flex-1 text-sm text-foreground text-center">{set.weight} kg</Text>
                    <Text className="flex-1 text-sm text-foreground text-right">{set.reps}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          ))}

        {/* Empty state — view mode */}
        {!editing && exerciseGroups.length === 0 && (
          <Text className="text-muted-foreground text-center mt-4">No exercises recorded.</Text>
        )}

        {/* Exercise cards — edit mode */}
        {editing &&
          editGroups.map((group) => (
            <Card key={group.exercise_id} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-primary text-lg">
                  {group.exercise_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Table header */}
                <View className="flex-row mb-2 pb-2 border-b border-border items-center">
                  <Text className="w-10 text-xs font-semibold text-muted-foreground uppercase">Set</Text>
                  <Text className="flex-1 text-xs font-semibold text-muted-foreground uppercase text-center">Weight</Text>
                  <Text className="flex-1 text-xs font-semibold text-muted-foreground uppercase text-center">Reps</Text>
                  <View className="w-9" />
                </View>
                {/* Editable rows */}
                {group.sets.map((set, setIdx) => {
                  const idx = flatIndex(group.exercise_id, setIdx);
                  return (
                    <View key={`${group.exercise_id}-${setIdx}`} className="flex-row py-1.5 items-center gap-2">
                      <Text className="w-10 text-sm text-foreground">{set.set_number}</Text>
                      <Input
                        className="flex-1 h-9 text-center text-sm"
                        keyboardType="decimal-pad"
                        value={set.weight}
                        onChangeText={(v) => updateEditSet(idx, 'weight', v)}
                        placeholder="0"
                      />
                      <Input
                        className="flex-1 h-9 text-center text-sm"
                        keyboardType="number-pad"
                        value={set.reps}
                        onChangeText={(v) => updateEditSet(idx, 'reps', v)}
                        placeholder="0"
                      />
                      <Pressable onPress={() => removeSet(idx)} hitSlop={6}>
                        <Minus size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  );
                })}
                {/* Add set button */}
                <Pressable
                  onPress={() => addSet(group.exercise_id, group.exercise_name, group.muscle_group)}
                  className="flex-row items-center justify-center mt-2 py-2"
                >
                  <Plus size={16} color="#0ea5e9" />
                  <Text className="text-primary text-sm ml-1">Add Set</Text>
                </Pressable>
              </CardContent>
            </Card>
          ))}

        {/* Bottom action buttons in edit mode */}
        {editing && (
          <View className="flex-row gap-3 mb-6">
            <Button variant="outline" className="flex-1" onPress={cancelEdit}>
              Cancel
            </Button>
            <Button className="flex-1" onPress={handleSave}>
              Save Changes
            </Button>
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </>
  );
}
