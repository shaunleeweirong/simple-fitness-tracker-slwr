import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { initializeDatabase } from '../db/database';
import { seedExercises } from '../db/seed';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      await seedExercises();
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout/active"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="workout/pick-template"
          options={{
            headerShown: true,
            title: 'Pick Template',
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#f2f2f2',
          }}
        />
        <Stack.Screen
          name="workout/detail/[id]"
          options={{
            headerShown: true,
            title: 'Workout Detail',
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#f2f2f2',
          }}
        />
        <Stack.Screen
          name="template/create"
          options={{
            headerShown: true,
            title: 'New Template',
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#f2f2f2',
          }}
        />
      </Stack>
    </>
  );
}
