// app/settings/index.js
import React from 'react'
import { Text } from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'

export default function SettingsScreen() {
  return (
    <Screen>
      <SectionTitle>Configuración</SectionTitle>
      <Text>Acá después vamos a poner los ajustes de la app.</Text>
    </Screen>
  )
}
