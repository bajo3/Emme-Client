// app/agenda/index.js
import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import AgendaDay from './views/AgendaDay'
import AgendaWeek from './views/AgendaWeek'
import AgendaMonth from './views/AgendaMonth'

const VIEWS = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
]

export default function AgendaScreen() {
  const router = useRouter()

  const [view, setView] = useState('week') // por defecto Semana
  const [showArchived, setShowArchived] = useState(false)

  const handleNewAppointment = () => {
    // Flujo: Agenda -> seleccionar cliente -> /appointments/new?clientId=...
    router.push('/clients/select')
  }

  const currentViewLabel =
    VIEWS.find((v) => v.key === view)?.label || 'Semana'

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>
            Vista: {currentViewLabel} · {showArchived ? 'Archivados' : 'Activos'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNewAppointment}
          style={styles.newButton}
        >
          <Text style={styles.newButtonText}>+ Nuevo turno</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Día / Semana / Mes */}
      <View style={styles.tabsRow}>
        {VIEWS.map((v) => {
          const isActive = v.key === view
          return (
            <TouchableOpacity
              key={v.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setView(v.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Filtro activos / archivados */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          onPress={() => setShowArchived((prev) => !prev)}
          style={styles.filterChip}
        >
          <Text style={styles.filterChipText}>
            {showArchived ? 'Ver activos' : 'Ver archivados'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de la vista */}
      <View style={styles.content}>
        {view === 'day' && <AgendaDay showArchived={showArchived} />}
        {view === 'week' && <AgendaWeek showArchived={showArchived} />}
        {view === 'month' && <AgendaMonth showArchived={showArchived} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  newButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#3F51B5',
  },
  newButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3F51B5',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEEEEE',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
})
