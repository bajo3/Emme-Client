// app/index.js
import React from 'react'
import { Text, Button } from 'react-native'
import { useRouter } from 'expo-router'
import Screen from '../components/ui/Screen'
import Card from '../components/ui/Card'
import SectionTitle from '../components/ui/SectionTitle'
import Spacer from '../components/ui/Spacer'

export default function HomeScreen() {
  const router = useRouter()

  return (
    <Screen>
      <SectionTitle>Resumen de hoy</SectionTitle>
      <Card>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Próximo turno:</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          (Después vamos a consultar Supabase para mostrarlo acá)
        </Text>
        <Spacer size={12} />
        <Button title="Ver agenda de hoy" onPress={() => router.push('/agenda')} />
      </Card>

      <SectionTitle>Accesos rápidos</SectionTitle>
      <Spacer size={4} />
      <Button title="Nuevo turno" onPress={() => router.push('/agenda')} />
      <Spacer size={8} />
      <Button title="Clientes" onPress={() => router.push('/clients')} />
      <Spacer size={8} />
      <Button title="Servicios" onPress={() => router.push('/services')} />
    </Screen>
  )
}
