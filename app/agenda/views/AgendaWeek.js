import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import Card from '../../../components/ui/Card'
import Spacer from '../../../components/ui/Spacer'
import { supabase } from '../../../lib/supabase'

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

function getStatusColor(status) {
  switch (status) {
    case 'confirmed':
      return '#0277BD'
    case 'done':
      return '#2E7D32'
    case 'cancelled':
      return '#E53935'
    default:
      return '#FF8F00' // pending
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'confirmed':
      return 'Confirmado'
    case 'done':
      return 'Realizado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Pendiente'
  }
}

// Devuelve YYYY-MM-DD
function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Devuelve el lunes de la semana del día dado
function getWeekStart(dateObj) {
  const d = new Date(dateObj) // copia
  const day = d.getDay() // 0 = domingo, 1 = lunes...
  const diff = (day === 0 ? -6 : 1 - day) // queremos lunes
  d.setDate(d.getDate() + diff)
  return d
}

// Array de 7 días (Date) a partir del lunes
function buildWeekDays(baseDate) {
  const start = getWeekStart(baseDate)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function AgendaWeek() {
  const router = useRouter()
  const today = new Date()

  const [weekBaseDate, setWeekBaseDate] = useState(today)
  const [selectedDateISO, setSelectedDateISO] = useState(toISODate(today))
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])

  // Días de la semana (Date[])
  const weekDays = useMemo(
    () => buildWeekDays(weekBaseDate),
    [weekBaseDate]
  )

  const weekStartISO = toISODate(weekDays[0])
  const weekEndISO = toISODate(weekDays[6])

  const loadAppointments = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        service_name,
        clients (
          id,
          name,
          phone
        )
      `)
      .gte('date', weekStartISO)
      .lte('date', weekEndISO)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error cargando turnos de la semana', error)
      setAppointments([])
      setLoading(false)
      return
    }

    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [weekStartISO, weekEndISO])

  // Agrupar turnos por fecha YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map = {}
    for (const appt of appointments) {
      const key = appt.date
      if (!map[key]) map[key] = []
      map[key].push(appt)
    }
    return map
  }, [appointments])

  // Turnos del día seleccionado
  const selectedAppointments = appointmentsByDate[selectedDateISO] || []

  const handleDayPress = (dateISO) => {
    setSelectedDateISO(dateISO)
  }

  const handlePrevWeek = () => {
    const d = new Date(weekBaseDate)
    d.setDate(d.getDate() - 7)
    setWeekBaseDate(d)
    setSelectedDateISO(toISODate(d)) // por defecto, lunes de la nueva semana
  }

  const handleNextWeek = () => {
    const d = new Date(weekBaseDate)
    d.setDate(d.getDate() + 7)
    setWeekBaseDate(d)
    setSelectedDateISO(toISODate(d))
  }

  const renderDayChip = (dateObj, index) => {
    const iso = toISODate(dateObj)
    const dayNum = dateObj.getDate()
    const weekdayLabel = WEEKDAY_LABELS[index] // L M M J V S D
    const count = (appointmentsByDate[iso] || []).length
    const isSelected = iso === selectedDateISO

    return (
      <TouchableOpacity
        key={iso}
        style={[
          styles.dayChip,
          isSelected && styles.dayChipSelected,
        ]}
        onPress={() => handleDayPress(iso)}
      >
        <Text
          style={[
            styles.dayChipWeekday,
            isSelected && styles.dayChipWeekdaySelected,
          ]}
        >
          {weekdayLabel}
        </Text>
        <Text
          style={[
            styles.dayChipDayNum,
            isSelected && styles.dayChipDayNumSelected,
          ]}
        >
          {dayNum}
        </Text>
        <Text
          style={[
            styles.dayChipCount,
            isSelected && styles.dayChipCountSelected,
          ]}
        >
          {count > 0 ? `${count} turno${count > 1 ? 's' : ''}` : '—'}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/appointments/${item.id}`)}
      style={{ marginBottom: 10 }}
    >
      <Card style={styles.card}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(item.start_time)}
            {item.end_time ? ` - ${formatTime(item.end_time)}` : ''}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <Spacer size={6} />

        <Text style={styles.clientText}>
          {item.clients?.name || 'Cliente sin nombre'}
        </Text>

        <Spacer size={2} />

        <Text style={styles.serviceText}>{item.service_name}</Text>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Navegación de semana */}
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={handlePrevWeek}>
          <Text style={styles.weekNavText}>{'< Semana anterior'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextWeek}>
          <Text style={styles.weekNavText}>{'Semana siguiente >'}</Text>
        </TouchableOpacity>
      </View>

      <Spacer size={8} />

      {/* Chips horizontales de días */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {weekDays.map((d, index) => renderDayChip(d, index))}
      </ScrollView>

      <Spacer size={12} />

      {/* Turnos del día seleccionado */}
      {loading ? (
        <>
          <ActivityIndicator />
          <Spacer />
          <Text>Cargando turnos...</Text>
        </>
      ) : selectedAppointments.length === 0 ? (
        <Text style={styles.noAppts}>No hay turnos para este día.</Text>
      ) : (
        <FlatList
          data={selectedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekNavText: {
    fontSize: 13,
    color: '#3F51B5',
    fontWeight: '500',
  },
  daysRow: {
    paddingVertical: 4,
  },
  dayChip: {
    width: 90,
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: '#3F51B5',
  },
  dayChipWeekday: {
    fontSize: 12,
    color: '#546E7A',
  },
  dayChipWeekdaySelected: {
    color: '#CFD8DC',
  },
  dayChipDayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
  },
  dayChipDayNumSelected: {
    color: '#FFFFFF',
  },
  dayChipCount: {
    marginTop: 2,
    fontSize: 11,
    color: '#78909C',
  },
  dayChipCountSelected: {
    color: '#ECEFF1',
  },
  card: {
    padding: 14,
    borderRadius: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  clientText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3E3E3E',
  },
  serviceText: {
    fontSize: 13,
    color: '#616161',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  noAppts: {
    fontSize: 14,
    color: '#757575',
  },
})
