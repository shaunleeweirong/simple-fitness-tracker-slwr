import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Text } from '../../components/ui/text';
import { Card, CardContent } from '../../components/ui/card';
import { useWorkoutStore } from '../../stores/workout-store';
import { getAllTemplates, getTemplateWithExercises } from '../../db/queries';
import type { Template } from '../../lib/types';

export default function PickTemplateScreen() {
  const router = useRouter();
  const { startWorkout, addExercise } = useWorkoutStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const data = await getAllTemplates();
          if (!cancelled) {
            setTemplates(data);
          }
        } catch (err) {
          console.error('Failed to load templates', err);
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

  async function handleSelect(template: Template) {
    try {
      startWorkout(template.id);

      const { exercises } = await getTemplateWithExercises(template.id);

      for (const ex of exercises) {
        addExercise(ex.exercise_id, ex.name, ex.target_sets, ex.target_reps);
      }

      router.replace('/workout/active');
    } catch (err) {
      console.error('Failed to start template workout', err);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleSelect(item)}>
            <Card className="mb-3">
              <CardContent className="p-4">
                <Text className="text-base font-semibold text-foreground">
                  {item.name}
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  Created {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </CardContent>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted-foreground text-base text-center">
              No templates yet. Create one in the Templates tab.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
