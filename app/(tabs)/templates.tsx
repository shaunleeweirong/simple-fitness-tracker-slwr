import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  getAllTemplates,
  getTemplateWithExercises,
  deleteTemplate,
} from '../../db/queries';
import type { Template } from '../../lib/types';

interface TemplateWithSummary extends Template {
  exerciseSummary: string;
}

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<TemplateWithSummary[]>([]);

  const loadTemplates = useCallback(async () => {
    const all = await getAllTemplates();
    const withSummaries: TemplateWithSummary[] = await Promise.all(
      all.map(async (t) => {
        const { exercises } = await getTemplateWithExercises(t.id);
        const names = exercises.map((e) => e.name);
        let summary = names.slice(0, 3).join(' \u00B7 ');
        if (names.length > 3) {
          summary += ` +${names.length - 3}`;
        }
        return { ...t, exerciseSummary: summary || 'No exercises' };
      })
    );
    setTemplates(withSummaries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates])
  );

  const handleDelete = (template: TemplateWithSummary) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(template.id);
            loadTemplates();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* New Template link */}
      <Link href="/template/create" asChild>
        <Pressable className="flex-row items-center gap-2 px-4 py-3">
          <Plus size={20} color="#0ea5e9" />
          <Text className="text-base font-semibold text-primary">New Template</Text>
        </Pressable>
      </Link>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleDelete(item)}>
            <Card>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.exerciseSummary}</CardDescription>
              </CardHeader>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-muted-foreground text-center">
              No templates yet.{'\n'}Tap + to create one.
            </Text>
          </View>
        }
      />
    </View>
  );
}
