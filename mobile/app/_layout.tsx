import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import IntroSplash from '../components/IntroSplash';

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F2FAF7' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="report/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>

      {/* 5-Second Academic Water Intro Splash */}
      {showIntro && <IntroSplash onFinish={() => setShowIntro(false)} />}
    </SafeAreaProvider>
  );
}
