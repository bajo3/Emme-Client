// app/_layout.js
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark'

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#FFE082' : '#3F51B5',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            borderTopWidth: 0.5,
            borderTopColor: '#ddd',
            height: 60,
          },
        }}
      >
        {/* Home / hoy */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Hoy',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="today-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Agenda (comentada) */}
        {/*
        <Tabs.Screen
          name="agenda"
          options={{
            title: 'Agenda',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        */}

        {/* Clientes (comentada) */}
        {/*
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        */}

        {/* Servicios (comentada) */}
        {/*
        <Tabs.Screen
          name="services"
          options={{
            title: 'Servicios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="color-palette-outline" size={size} color={color} />
            ),
          }}
        />
        */}

        {/* Reportes (comentada) */}
        {/*
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reportes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
        */}
      </Tabs>
    </SafeAreaProvider>
  )
}
