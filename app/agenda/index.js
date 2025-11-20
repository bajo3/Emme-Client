// app/agenda/index.js
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { COLORS, RADIUS } from '../../components/theme'

import AgendaDay from './views/AgendaDay'
import AgendaWeek from './views/AgendaWeek'
import AgendaMonth from './views/AgendaMonth'

function formatHeaderDate(date, mode) {
  const optionsBase = {
    day: 'numeric',
    month: 'short',
  }

  if (mode === 'day') {
    return date.toLocaleDateString('es-AR', {
      ...optionsBase,
      weekday: 'long',
    })
  }

  if (mode === 'week') {
    // Semana: mostramos rango simple (inicio - fin)
    const start = new Date(date)
    const end = new Date(date)
    // Suponemos que la semana empieza el lunes
    const day = start.getDay() === 0 ? 7 : start.getDay()
    start.setDate(start.getDate() - (day - 1))
    end.setDate(start.getDate() + 6)

    const startStr = start.toLocaleDateString('es-AR', optionsBase)
    const endStr = end.toLocaleDateString('es-AR', optionsBase)

    return `Semana del ${startStr} al ${endStr}`
  }

  // Mes
  return date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

export default function AgendaScreen() {
  const [tab, setTab] = useState('day') // 'day' | 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date())

  const changeTab = (value) => {
    setTab(value)
  }

  const moveDate = (direction) => {
    // direction: -1 o 1
    const d = new Date(currentDate)

    if (tab === 'day') {
      d.setDate(d.getDate() + direction)
    } else if (tab === 'week') {
      d.setDate(d.getDate() + 7 * direction)
    } else if (tab === 'month') {
      d.setMonth(d.getMonth() + direction)
    }

    setCurrentDate(d)
  }

  return (
    <Screen>
      <SectionTitle>Agenda</SectionTitle>

      {/* Tabs Día / Semana / Mes */}
      <View style={styles.tabsRow}>
        {['day', 'week', 'month'].map((value) => {
          const labels = {
            day: 'Día',
            week: 'Semana',
            month: 'Mes',
          }
          const isActive = tab === value
          return (
            <TouchableOpacity
              key={value}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => changeTab(value)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {labels[value]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Spacer size={8} />

      {/* Header con fecha + flechas */}
      <Card>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => moveDate(-1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>{'‹'}</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerDateText}>
              {formatHeaderDate(currentDate, tab)}
            </Text>
          </View>

          <TouchableOpacity onPress={() => moveDate(1)} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>{'›'}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Spacer size={12} />

      {/* Contenido según tab */}
      {tab === 'day' && <AgendaDay date={currentDate} />}
      {tab === 'week' && <AgendaWeek date={currentDate} />}
      {tab === 'month' && <AgendaMonth date={currentDate} />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS?.lg || 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIUS?.md || 8,
  },
  tabActive: {
    backgroundColor: COLORS?.primary || '#3F51B5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS?.primary || '#3F51B5',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerDateText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
