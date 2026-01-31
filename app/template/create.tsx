import React, { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ExercisePicker } from '../../components/exercise-picker';
import { createTemplate } from '../../db/queries';
import type { Exercise } from '../../lib/types';

interface TemplateRow {
  key: string;
  exercise: Exercise;
  sets: string;
  reps: string;
}

export default function CreateTemplateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    setRows((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exercise,
        sets: '3',
        reps: '10',
      },
    ]);
    setPickerVisible(false);
  };

  const handleRemoveExercise = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, field: 'sets' | 'reps', value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Please enter a template name.');
      return;
    }
    if (rows.length === 0) {
      Alert.alert('Validation', 'Please add at least one exercise.');
      return;
    }

    const exercises = rows.map((r) => ({
      exercise_id: r.exercise.id,
      target_sets: parseInt(r.sets, 10) || 3,
      target_reps: parseInt(r.reps, 10) || 10,
    }));

    await createTemplate(trimmedName, exercises);
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Template name input */}
      <View className="px-4 pt-4 pb-2">
        <Input
          placeholder="Template name"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Exercise list */}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <Card>
            <CardContent className="p-4">
              {/* Exercise name and remove button */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold flex-1" numberOfLines={1}>
                  {item.exercise.name}
                </Text>
                <Pressable
                  onPress={() => handleRemoveExercise(item.key)}
                  className="p-1 ml-2"
                >
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>

              {/* Sets and Reps inputs side by side */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1">Sets</Text>
                  <Input
                    value={item.sets}
                    onChangeText={(v) => updateRow(item.key, 'sets', v)}
                    keyboardType="numeric"
                    className="text-center"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1">Reps</Text>
                  <Input
                    value={item.reps}
                    onChangeText={(v) => updateRow(item.key, 'reps', v)}
                    keyboardType="numeric"
                    className="text-center"
                  />
                </View>
              </View>
            </CardContent>
          </Card>
        )}
        ListFooterComponent={
          <View className="mt-4 gap-3">
            <Button variant="outline" onPress={() => setPickerVisible(true)}>
              Add Exercise
            </Button>
            <Button onPress={handleSave}>
              Save Template
            </Button>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-muted-foreground text-center">
              No exercises added yet.{'\n'}Tap "Add Exercise" below.
            </Text>
          </View>
        }
      />

      {/* Exercise picker modal */}
      <ExercisePicker
        visible={pickerVisible}
        onSelect={handleAddExercise}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
