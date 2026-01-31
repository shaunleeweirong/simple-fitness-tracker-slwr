import { Tabs } from 'expo-router';
import { Dumbbell, LayoutGrid, Clock, BarChart3 } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#f2f2f2',
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#2e2e2e' },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#a3a3a3',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
