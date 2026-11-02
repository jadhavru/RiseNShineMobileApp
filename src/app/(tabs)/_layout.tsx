
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E87532',
        tabBarInactiveTintColor: '#8291A3',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 85,
          paddingTop: 10,
          paddingBottom: 22,
          borderTopColor: '#EDF0F3',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
              <Text style={{ color: color, fontSize: size + 5, fontWeight: 'bold' }}>⌂</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => (
       
            <Text style={{ color: color, fontSize: size + 5, fontWeight: 'bold' }}>▦</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="contribute"
        options={{
          title: 'Contribute',
          tabBarIcon: ({ color, size }) => (
         
               <Text style={{ color: color, fontSize: size + 5, fontWeight: 'bold' }}>♡</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
         
            <Text style={{ color: color, fontSize: size + 5, fontWeight: 'bold' }}>♙</Text>
          ),
        }}
      />
    </Tabs>
  );
}

function TextIcon({
  symbol,
  color,
  size,
}: {
  symbol: string;
  color: string;
  size: number;
}) {
  return (
    <Text style={{ color, fontSize: size + 5, fontWeight: 'bold' }}>
      {symbol}
    </Text>
  );
}
