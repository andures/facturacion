import { Stack } from 'expo-router';

export default function FacturasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"  options={{ headerShown: false }} />
      <Stack.Screen name="nueva"  options={{ headerShown: false }} />
      <Stack.Screen name="crear"  options={{ headerShown: false }} />
      <Stack.Screen name="[id]"   options={{ headerShown: false }} />
    </Stack>
  );
}
