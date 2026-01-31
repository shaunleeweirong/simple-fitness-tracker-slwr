import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { Text } from './ui/text';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getAllExercises, searchExercises } from '../db/queries';
import type { Exercise } from '../lib/types';
import { X } from 'lucide-react-native';

interface ExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  const loadExercises = useCallback(async () => {
    const results = query.trim()
      ? await searchExercises(query.trim())
      : await getAllExercises();
    setExercises(results);
  }, [query]);

  useEffect(() => {
    if (visible) {
      loadExercises();
    }
  }, [visible, loadExercises]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setQuery('');
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background pt-4">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-3">
          <Text className="text-xl font-semibold">Select Exercise</Text>
          <Pressable onPress={handleClose} className="p-2">
            <X size={24} color="#a3a3a3" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-4 pb-3">
          <Input
            placeholder="Search exercises..."
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* List */}
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              className="py-3 border-b border-border"
            >
              <Text className="text-base font-medium">{item.name}</Text>
              {item.muscle_group && (
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {item.muscle_group}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted-foreground">No exercises found.</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
