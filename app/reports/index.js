// app/reports/index.js
import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Spacer from '../../components/ui/Spacer'
import { supabase } from '../../lib/supabase'

// --- Helpers de tiempo / rango ---

function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(base, diff) {
  const d = new Date(base)
  d.setDate(d.getDate() + diff)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// start_time / end_time tipo "HH:MM:SS"
function minutesBetween(start, end) {
  if (!start || !end) return 0

  const [sh, sm] = start.slice(0, 5).split(':').map(Number)
  const [eh, em] = end.slice(0, 5).split(':').map(Number)

  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em

  if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) return 0
  return endMin - startMin
}

const RANGE_OPTIONS = [
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: 'all', label: 'Todo' },
]

export default function ReportsScreen() {
  const [range, setRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)

  const today = todayISO()

  // Calculamos fecha "desde" según el rango
  const fromDate = useMemo(() => {
    if (range === '7d') return addDays(today, -6) // hoy incluido
    if (range === '30d') return addDays(today, -29)
    return null // 'all'
  }, [range, today])

  const loadData = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      let query = supabase
        .from('appointments')
        .select('*') // Trae todas las columnas (incluye service_name, status, etc.)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })

      if (fromDate) {
        query = query.gte('date', fromDate).lte('date', today)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando reportes', error)
        setErrorMsg(error.message || 'No se pudieron cargar los datos')
        setAppointments([])
      } else {
        setAppointments(data || [])
      }
    } catch (e) {
      console.error('Error inesperado en reportes', e)
      setErrorMsg('Ocurrió un error inesperado.')
      setAppointments([])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [range])

  // --- Cálculos de métricas ---

  const {
    totalAppointments,
    totalMinutesWorked,
    totalHoursWorked,
    totalMoney,
    servicesStats,
  } = useMemo(() => {
    // Podés ajustar acá qué estados cuentan como "trabajado"
    const completed = appointments.filter(
      (a) => a.status === 'done' || a.status === 'confirmed'
    )


    const totalAppointments = completed.length

    const totalMinutesWorked = completed.reduce((sum, appt) => {
      return sum + minutesBetween(appt.start_time, appt.end_time)
    }, 0)

    const totalHoursWorked = totalMinutesWorked / 60

    // 💰 Cálculo de dinero:
    // Si en tu tabla `appointments` tenés una columna de monto (por ejemplo `amount` o `price`),
    // poné el nombre correcto acá:
    const MONEY_FIELD_CANDIDATES = ['amount', 'price', 'total']
    const pickAmount = (appt) => {
      for (const field of MONEY_FIELD_CANDIDATES) {
        if (appt[field] != null) return Number(appt[field]) || 0
      }
      return 0
    }

    const totalMoney = completed.reduce((sum, appt) => {
      return sum + pickAmount(appt)
    }, 0)

    // Servicios más realizados
    const serviceMap = {}
    for (const appt of completed) {
      const name = appt.service_name || 'Sin servicio'
      if (!serviceMap[name]) {
        serviceMap[name] = {
          name,
          count: 0,
        }
      }
      serviceMap[name].count += 1
    }

    const servicesStats = Object.values(serviceMap).sort(
      (a, b) => b.count - a.count
    )

    return {
      totalAppointments,
      totalMinutesWorked,
      totalHoursWorked,
      totalMoney,
      servicesStats,
    }
  }, [appointments])

  // --- Render ---

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceRow}>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceCount}>{item.count} turno(s)</Text>
    </View>
  )

  return (
    <Screen>
      <SectionTitle>Reportes</SectionTitle>

      {/* Tabs de rango */}
      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map((opt) => {
          const active = range === opt.key
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setRange(opt.key)}
              style={[
                styles.rangeChip,
                active && styles.rangeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  active && styles.rangeChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Spacer size={12} />

      {loading ? (
        <>
          <ActivityIndicator />
          <Spacer size={8} />
          <Text>Cargando datos...</Text>
        </>
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <>
          {/* Resumen principal */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Turnos hechos</Text>
                <Text style={styles.summaryValue}>{totalAppointments}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Horas trabajadas</Text>
                <Text style={styles.summaryValue}>
                  {totalHoursWorked.toFixed(1)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Ingresos</Text>
                <Text style={styles.summaryValueMoney}>
                  ${totalMoney.toLocaleString('es-AR')}
                </Text>
              </View>
            </View>

            {range !== 'all' && (
              <Text style={styles.summaryHint}>
                Desde {fromDate || '-'} hasta {today}
              </Text>
            )}
          </Card>

          <Spacer size={16} />

          {/* Servicios más realizados */}
          <Card>
            <Text style={styles.sectionSubtitle}>Servicios más realizados</Text>
            <Spacer size={8} />

            {servicesStats.length === 0 ? (
              <Text style={styles.noDataText}>
                Todavía no hay turnos realizados en este rango.
              </Text>
            ) : (
              <FlatList
                data={servicesStats}
                keyExtractor={(item) => item.name}
                renderItem={renderServiceItem}
              />
            )}
          </Card>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    padding: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 2,
  },
  rangeChipActive: {
    backgroundColor: '#3F51B5',
  },
  rangeChipText: {
    fontSize: 13,
    color: '#424242',
  },
  rangeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#212121',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  summaryValueMoney: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#9E9E9E',
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  serviceName: {
    fontSize: 14,
    color: '#424242',
  },
  serviceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F51B5',
  },
  noDataText: {
    fontSize: 13,
    color: '#757575',
  },
  errorText: {
    fontSize: 13,
    color: '#E53935',
  },
})
