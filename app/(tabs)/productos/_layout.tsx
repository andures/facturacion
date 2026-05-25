import { Stack } from 'expo-router';

export default function ProductosLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"  options={{ headerShown: false }} />
      <Stack.Screen name="nuevo"  options={{ headerShown: false }} />
      <Stack.Screen name="[id]"   options={{ headerShown: false }} />
    </Stack>
  );
}
