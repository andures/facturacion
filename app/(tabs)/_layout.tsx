import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { TabBar } from '@/src/components/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="clientes"  options={{ title: 'Clientes' }} />
      <Tabs.Screen name="facturas"  options={{ title: 'Facturas' }} />
      <Tabs.Screen name="productos" options={{ title: 'Productos' }} />
      <Tabs.Screen name="ajustes"   options={{ title: 'Ajustes', headerShown: false }} />
    </Tabs>
  );
}
