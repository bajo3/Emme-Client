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

        {/* Agenda */}
        <Tabs.Screen
          name="agenda"
          options={{
            title: 'Agenda',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Clientes */}
        <Tabs.Screen
          name="clients"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Servicios */}
        <Tabs.Screen
          name="services"
          options={{
            title: 'Servicios',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="color-palette-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Reportes */}
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reportes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Settings con ícono de tuerca */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings', // o 'Ajustes'
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Ocultar appointments del tab bar, pero mantener la ruta */}
        <Tabs.Screen
          name="appointments"
          options={{
            href: null, // esto lo saca del tab bar
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  )
}
