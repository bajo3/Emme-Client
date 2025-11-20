//app/agenda/index.js
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'

// 📌 Importamos las 3 vistas (las creamos después)
import AgendaDay from './views/AgendaDay'
import AgendaWeek from './views/AgendaWeek'
import AgendaMonth from './views/AgendaMonth'

export default function AgendaScreen() {
  const [tab, setTab] = useState('day')

  return (
    <Screen>
      <SectionTitle>Agenda</SectionTitle>

      {/* Tabs internas */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setTab('day')}
          style={[styles.tabBtn, tab === 'day' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'day' && styles.tabTextActive]}>Día</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('week')}
          style={[styles.tabBtn, tab === 'week' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'week' && styles.tabTextActive]}>Semana</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('month')}
          style={[styles.tabBtn, tab === 'month' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'month' && styles.tabTextActive]}>Mes</Text>
        </TouchableOpacity>
      </View>

      <Spacer size={10} />

      {/* Render dinámico */}
      {tab === 'day' && <AgendaDay />}
      {tab === 'week' && <AgendaWeek />}
      {tab === 'month' && <AgendaMonth />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    padding: 4,
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3F51B5',
  },
  tabText: {
    fontSize: 14,
    color: '#424242',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
