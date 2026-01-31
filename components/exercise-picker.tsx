import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SectionList,
} from 'react-native';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react-native';

import { Text } from './ui/text';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getAllExercises, searchExercises, addExercise } from '../db/queries';
import type { Exercise } from '../lib/types';

// ── Props ────────────────────────────────────────────────────────────

interface ExercisePickerProps {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

interface Section {
  title: string;
  data: Exercise[];
}

function groupByMuscle(exercises: Exercise[]): Section[] {
  const map = new Map<string, Exercise[]>();

  for (const ex of exercises) {
    const group = ex.muscle_group ?? 'Other';
    const list = map.get(group);
    if (list) {
      list.push(ex);
    } else {
      map.set(group, [ex]);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

// ── Component ────────────────────────────────────────────────────────

export function ExercisePicker({ visible, onSelect, onClose }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [adding, setAdding] = useState(false);

  // Load all exercises when modal becomes visible
  useEffect(() => {
    if (!visible) return;

    async function load() {
      try {
        const data = await getAllExercises();
        setExercises(data);
      } catch (err) {
        console.error('Failed to load exercises', err);
      }
    }

    load();
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (!visible) return;

    if (search.trim() === '') {
      // Reload all when search is cleared
      getAllExercises()
        .then(setExercises)
        .catch((err) => console.error('Failed to load exercises', err));
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const results = await searchExercises(search.trim());
        if (!cancelled) setExercises(results);
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, visible]);

  const sections = useMemo(() => groupByMuscle(exercises), [exercises]);

  function resetState() {
    setSearch('');
    setShowAddForm(false);
    setNewName('');
    setNewMuscleGroup('');
  }

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    resetState();
  }

  async function handleAddExercise() {
    const trimmedName = newName.trim();
    if (!trimmedName || adding) return;

    setAdding(true);
    try {
      const muscleGroup = newMuscleGroup.trim() || null;
      const id = await addExercise(trimmedName, muscleGroup);
      const newExercise: Exercise = {
        id,
        name: trimmedName,
        muscle_group: muscleGroup,
      };

      // Select the newly created exercise right away
      handleSelect(newExercise);
    } catch (err) {
      console.error('Failed to add exercise', err);
    } finally {
      setAdding(false);
    }
  }

  function handleClose() {
    resetState();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text className="text-xl font-bold text-foreground">
            Select Exercise
          </Text>
          <Pressable onPress={handleClose} className="p-2">
            <X size={24} color="#a3a3a3" />
          </Pressable>
        </View>

        {/* Search Input */}
        <View className="px-4 pb-2">
          <Input
            placeholder="Search exercises..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Add Custom Exercise Toggle */}
        <Pressable
          className="flex-row items-center gap-2 px-4 py-3"
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} color="#0ea5e9" />
          <Text className="text-primary text-sm font-medium">
            Add Custom Exercise
          </Text>
          {showAddForm ? (
            <ChevronUp size={16} color="#0ea5e9" />
          ) : (
            <ChevronDown size={16} color="#0ea5e9" />
          )}
        </Pressable>

        {/* Add Custom Exercise Form */}
        {showAddForm && (
          <View className="px-4 pb-3 gap-2">
            <Input
              placeholder="Exercise name"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <Input
              placeholder="Muscle group (optional)"
              value={newMuscleGroup}
              onChangeText={setNewMuscleGroup}
              autoCapitalize="words"
            />
            <Button
              size="sm"
              onPress={handleAddExercise}
              disabled={!newName.trim() || adding}
            >
              {adding ? 'Adding...' : 'Add & Select'}
            </Button>
          </View>
        )}

        {/* Exercise List grouped by muscle group */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background px-4 py-2 border-b border-border">
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              className="px-4 py-3 border-b border-border active:bg-secondary"
              onPress={() => handleSelect(item)}
            >
              <Text className="text-base text-foreground">{item.name}</Text>
              {item.muscle_group && (
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {item.muscle_group}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-muted-foreground text-base">
                No exercises found
              </Text>
            </View>
          }
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}
