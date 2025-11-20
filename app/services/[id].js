// app/services/[id].js
import React from 'react'
import { Text } from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import { useLocalSearchParams } from 'expo-router'


export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams()

  return (
    <Screen>
      <SectionTitle>Servicio #{id}</SectionTitle>
      <Text>Acá después vamos a mostrar el detalle del servicio.</Text>
    </Screen>
  )
}
