// app/reports/index.js
import React from 'react'
import { Text } from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'

export default function ReportsScreen() {
  return (
    <Screen>
      <SectionTitle>Reportes</SectionTitle>
      <Text>
        Acá después vamos a mostrar cantidad de turnos, ingresos y servicios más
        pedidos.
      </Text>
    </Screen>
  )
}
