import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
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

// YYYY-MM-DD
function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Primer día del mes
function getMonthStart(dateObj) {
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
}

// Último día del mes
function getMonthEnd(dateObj) {
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
}

// Construye la grilla del calendario (6 filas x 7 columnas, lunes a domingo)
function buildMonthGrid(baseDate) {
  const monthStart = getMonthStart(baseDate)
  const monthEnd = getMonthEnd(baseDate)

  // Queremos que la grilla arranque en LUNES
  // getDay(): 0 = domingo, 1 = lunes, ... 6 = sábado
  const startDay = monthStart.getDay()
  const offsetToMonday = startDay === 0 ? -6 : 1 - startDay

  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() + offsetToMonday)

  const cells = []
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + week * 7 + day)
      cells.push(d)
    }
  }

  return {
    monthStart,
    monthEnd,
    cells,
  }
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export default function AgendaMonth() {
  const router = useRouter()
  const today = new Date()

  const [monthBaseDate, setMonthBaseDate] = useState(today)
  const [selectedDateISO, setSelectedDateISO] = useState(toISODate(today))
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])

  const { monthStart, monthEnd, cells } = useMemo(
    () => buildMonthGrid(monthBaseDate),
    [monthBaseDate]
  )

  const monthStartISO = toISODate(monthStart)
  const monthEndISO = toISODate(monthEnd)

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
          name
        )
      `)
      .gte('date', monthStartISO)
      .lte('date', monthEndISO)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error cargando turnos del mes', error)
      setAppointments([])
      setLoading(false)
      return
    }

    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [monthStartISO, monthEndISO])

  // Agrupar por fecha
  const appointmentsByDate = useMemo(() => {
    const map = {}
    for (const appt of appointments) {
      const key = appt.date
      if (!map[key]) map[key] = []
      map[key].push(appt)
    }
    return map
  }, [appointments])

  const selectedAppointments = appointmentsByDate[selectedDateISO] || []

  const handlePrevMonth = () => {
    const d = new Date(monthBaseDate)
    d.setMonth(d.getMonth() - 1)
    setMonthBaseDate(d)
    // setear selectedDateISO al primer día del nuevo mes
    const newMonthStart = getMonthStart(d)
    setSelectedDateISO(toISODate(newMonthStart))
  }

  const handleNextMonth = () => {
    const d = new Date(monthBaseDate)
    d.setMonth(d.getMonth() + 1)
    setMonthBaseDate(d)
    const newMonthStart = getMonthStart(d)
    setSelectedDateISO(toISODate(newMonthStart))
  }

  const isSameDay = (a, b) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  const currentMonth = monthBaseDate.getMonth()
  const currentYear = monthBaseDate.getFullYear()

  const renderCalendarCell = (dateObj, index) => {
    const iso = toISODate(dateObj)
    const isCurrentMonth = dateObj.getMonth() === currentMonth
    const isToday = isSameDay(dateObj, today)
    const isSelected = iso === selectedDateISO
    const count = (appointmentsByDate[iso] || []).length

    return (
      <TouchableOpacity
        key={`${iso}-${index}`}
        style={[
          styles.dayCell,
          !isCurrentMonth && styles.dayCellOutside,
          isSelected && styles.dayCellSelected,
        ]}
        onPress={() => {
          if (!isCurrentMonth) return
          setSelectedDateISO(iso)
        }}
        activeOpacity={isCurrentMonth ? 0.7 : 1}
      >
        <View style={styles.dayCellInner}>
          <View style={styles.dayCellTopRow}>
            <Text
              style={[
                styles.dayNumber,
                !isCurrentMonth && styles.dayNumberOutside,
                isSelected && styles.dayNumberSelected,
              ]}
            >
              {dateObj.getDate()}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Hoy</Text>
              </View>
            )}
          </View>

          <View style={styles.dayCellBottom}>
            {count > 0 && (
              <>
                <View style={styles.dot} />
                <Text
                  style={[
                    styles.countText,
                    isSelected && styles.countTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderAppointment = ({ item }) => (
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
      {/* Header del mes */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Text style={styles.monthNavText}>{'< Mes anterior'}</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity onPress={handleNextMonth}>
          <Text style={styles.monthNavText}>{'Mes siguiente >'}</Text>
        </TouchableOpacity>
      </View>

      <Spacer size={8} />

      {/* Nombres de días */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* Calendario */}
      <View style={styles.calendarGrid}>
        {cells.map((dateObj, index) => renderCalendarCell(dateObj, index))}
      </View>

      <Spacer size={12} />

      {/* Turnos del día seleccionado */}
      {loading ? (
        <>
          <ActivityIndicator />
          <Spacer />
          <Text>Cargando turnos...</Text>
        </>
      ) : selectedAppointments.length === 0 ? (
        <Text style={styles.noAppts}>
          No hay turnos para este día.
        </Text>
      ) : (
        <FlatList
          data={selectedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  monthNavText: {
    fontSize: 13,
    color: '#3F51B5',
    fontWeight: '500',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#78909C',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  dayCellOutside: {
    opacity: 0.4,
  },
  dayCellSelected: {
    borderRadius: 10,
    backgroundColor: '#E8EAF6',
  },
  dayCellInner: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dayCellTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263238',
  },
  dayNumberOutside: {
    color: '#B0BEC5',
  },
  dayNumberSelected: {
    color: '#1A237E',
  },
  todayBadge: {
    backgroundColor: '#FFCA28',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4E342E',
  },
  dayCellBottom: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F51B5',
  },
  countText: {
    fontSize: 11,
    color: '#546E7A',
  },
  countTextSelected: {
    color: '#1A237E',
    fontWeight: '600',
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
