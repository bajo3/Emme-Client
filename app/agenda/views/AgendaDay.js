// app/agenda/AgendaDay.js
import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import Card from '../../../components/ui/Card'
import Spacer from '../../../components/ui/Spacer'
import Badge from '../../../components/ui/BadgeStatus'
import { COLORS, SPACING } from '../../../components/theme'

function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) {
    // si viene algo raro, volvemos a hoy
    const today = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  done: 'Realizado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS = {
  pending: '#F5A623',
  confirmed: '#2E86DE',
  done: '#2ECC71',
  cancelled: '#E74C3C',
}

export default function AgendaDay({ date }) {
  const router = useRouter()
  // 👇 si no viene date, usamos hoy
  const baseDate =
    date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date()

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [filterStatus, setFilterStatus] = useState('all') // all | pending | confirmed | done

  const isoDate = toISODate(baseDate)

  const loadAppointments = async (opts = { showLoader: true }) => {
    if (opts.showLoader) setLoading(true)

    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
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
      `
      )
      .eq('date', isoDate)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error cargando turnos del día', error)
      setAppointments([])
    } else {
      setAppointments(data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadAppointments({ showLoader: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoDate])

  const onRefresh = () => {
    setRefreshing(true)
    loadAppointments({ showLoader: false })
  }

  const filteredAppointments = useMemo(() => {
    if (filterStatus === 'all') return appointments
    return appointments.filter((a) => a.status === filterStatus)
  }, [appointments, filterStatus])

  const renderStatusBadge = (status) => {
    const label = STATUS_LABELS[status] || status

    let variant = 'neutral'
    if (status === 'pending') variant = 'warning'
    if (status === 'confirmed') variant = 'info'
    if (status === 'done') variant = 'success'
    if (status === 'cancelled') variant = 'danger'

    return <Badge variant={variant}>{label}</Badge>
  }

  const renderItem = ({ item }) => {
    const start = item.start_time?.slice(0, 5) || '--:--'
    const end = item.end_time?.slice(0, 5) || null
    const clientName = item.clients?.name || 'Sin cliente'
    const phone = item.clients?.phone || ''
    const serviceName = item.service_name || 'Sin servicio'
    const statusColor = STATUS_COLORS[item.status] || '#BDBDBD'

    return (
      <TouchableOpacity
        onPress={() => router.push(`/appointments/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.itemRow}>
          {/* Columna de hora + puntito */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{start}</Text>
            {end && <Text style={styles.timeEndText}>{end}</Text>}
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.verticalLine} />
          </View>

          {/* Card con info */}
          <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.clientName}>{clientName}</Text>
              {renderStatusBadge(item.status)}
            </View>

            <Spacer size={4} />

            <Text style={styles.serviceName}>{serviceName}</Text>

            {phone ? (
              <Text style={styles.phoneText}>{phone}</Text>
            ) : null}
          </Card>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay turnos para este día.</Text>
        <Spacer size={4} />
        <Text style={styles.emptySubText}>
          Creá un turno desde la ficha de un cliente.
        </Text>
      </View>
    )
  }

  const summary = useMemo(() => {
    const total = appointments.length
    const pending = appointments.filter((a) => a.status === 'pending').length
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length
    const done = appointments.filter((a) => a.status === 'done').length
    return { total, pending, confirmed, done }
  }, [appointments])

  return (
    <View style={styles.container}>
      {/* Resumen del día */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Turnos: {summary.total}</Text>
        <Text style={styles.summarySubText}>
          Pend: {summary.pending} · Conf: {summary.confirmed} · Real: {summary.done}
        </Text>
      </View>

      <Spacer size={8} />

      {/* Filtros */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'confirmed', label: 'Confirmados' },
          { key: 'done', label: 'Realizados' },
        ].map((f) => {
          const isActive = filterStatus === f.key
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Spacer size={8} />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Spacer size={4} />
          <Text>Cargando turnos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            filteredAppointments.length === 0 && !loading
              ? { flex: 1, paddingHorizontal: 8 }
              : { paddingBottom: SPACING?.lg || 16, paddingHorizontal: 8 }
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summarySubText: {
    fontSize: 12,
    color: '#666',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: COLORS?.primary || '#3F51B5',
    borderColor: COLORS?.primary || '#3F51B5',
  },
  filterChipText: {
    fontSize: 12,
    color: '#555',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    paddingTop: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeEndText: {
    fontSize: 11,
    color: '#666',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 2,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 2,
  },
  itemCard: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  serviceName: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
  },
  phoneText: {
    marginTop: 2,
    fontSize: 12,
    color: '#777',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 12,
    color: '#666',
  },
})
