import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
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

export default function AgendaDay() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])

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
      .eq('date', date)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error cargando turnos del día', error)
      setAppointments([])
      setLoading(false)
      return
    }

    setAppointments(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [date])

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
      {/* Selector de Fecha */}
      <Text style={styles.label}>Fecha</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Spacer size={10} />

      {/* Contenido */}
      {loading ? (
        <>
          <ActivityIndicator />
          <Spacer />
          <Text>Cargando turnos...</Text>
        </>
      ) : appointments.length === 0 ? (
        <Text style={styles.noAppts}>No hay turnos en esta fecha.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 13,
    color: '#616161',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  clientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E3E3E',
  },
  serviceText: {
    fontSize: 14,
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
