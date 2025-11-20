// app/appointments/new.js
import React, { useEffect, useState } from 'react'
import {
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'done', label: 'Realizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const validateTime = (value) => {
  if (!value) return false
  const regex = /^([01]\d|2[0-3]):[0-5]\d$/
  return regex.test(value)
}

export default function NewAppointmentScreen() {
  const router = useRouter()
  const { clientId } = useLocalSearchParams()

  const [date, setDate] = useState(todayISO())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState('pending')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error cargando servicios', error)
        Alert.alert('Error', 'No se pudieron cargar los servicios.')
      } else {
        setServices(data || [])
      }
      setServicesLoading(false)
    }

    loadServices()
  }, [])

  const handleSave = async () => {
    if (!clientId) {
      Alert.alert('Error', 'Falta el cliente asociado al turno.')
      return
    }

    if (!date) {
      Alert.alert('Fecha requerida', 'Seleccioná una fecha.')
      return
    }

    if (!validateTime(startTime)) {
      Alert.alert(
        'Hora de inicio inválida',
        'Usá el formato HH:MM (ej: 14:30).'
      )
      return
    }

    if (endTime && !validateTime(endTime)) {
      Alert.alert(
        'Hora de fin inválida',
        'Usá el formato HH:MM (ej: 15:30) o dejalo vacío.'
      )
      return
    }

    if (!selectedServiceId) {
      Alert.alert('Servicio requerido', 'Seleccioná un servicio.')
      return
    }

    const service = services.find((s) => s.id === selectedServiceId)
    if (!service) {
      Alert.alert('Error', 'El servicio seleccionado no es válido.')
      return
    }

    setSaving(true)

    const payload = {
      client_id: clientId,
      date,
      start_time: `${startTime}:00`,
      end_time: endTime ? `${endTime}:00` : null,
      status,
      notes: notes.trim() || null,
      service_id: service.id,
      service_name: service.name,
    }

    const { error } = await supabase.from('appointments').insert(payload)

    setSaving(false)

    if (error) {
      console.error('Error creando turno', error)

      Alert.alert(
        'Error creando turno',
        `${error.message || 'Sin mensaje'}\n\n${error.details || ''}`
      )

      return
    }

    // Éxito: comportamiento distinto en web vs nativo
    if (Platform.OS === 'web') {
      Alert.alert('OK', 'Turno creado correctamente.')
      router.replace(`/clients/${clientId}`)
    } else {
      Alert.alert('OK', 'Turno creado correctamente.', [
        {
          text: 'Volver al cliente',
          onPress: () => router.replace(`/clients/${clientId}`),
        },
      ])
    }
  }

  return (
    <Screen>
      <SectionTitle>Nuevo turno</SectionTitle>
      <ScrollView>
        <Card>
          <Text style={styles.label}>Fecha *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          <Spacer size={12} />

          <Text style={styles.label}>Hora inicio *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={startTime}
            onChangeText={setStartTime}
            keyboardType="numeric"
          />

          <Spacer size={12} />

          <Text style={styles.label}>Hora fin (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            value={endTime}
            onChangeText={setEndTime}
            keyboardType="numeric"
          />

          <Spacer size={16} />

          <Text style={styles.label}>Servicio *</Text>
          {servicesLoading ? (
            <ActivityIndicator />
          ) : services.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay servicios activos. Creá uno antes de asignar turnos.
            </Text>
          ) : (
            <View>
              {services.map((service) => {
                const selected = service.id === selectedServiceId
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceItem,
                      selected && styles.serviceItemSelected,
                    ]}
                    onPress={() => setSelectedServiceId(service.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.duration_min ? (
                        <Text style={styles.serviceMeta}>
                          {service.duration_min} min
                        </Text>
                      ) : null}
                    </View>
                    {selected && (
                      <Text style={styles.serviceSelectedMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <Spacer size={16} />

          <Text style={styles.label}>Estado</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.statusChip,
                  status === s.value && styles.statusChipActive,
                ]}
                onPress={() => setStatus(s.value)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    status === s.value && styles.statusChipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Spacer size={16} />

          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Notas del turno..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Spacer size={20} />

          <Button
            title={saving ? 'Guardando...' : 'Guardar turno'}
            onPress={handleSave}
            disabled={saving}
          />
        </Card>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    fontSize: 13,
    color: '#757575',
  },
  serviceItem: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemSelected: {
    borderColor: '#3F51B5',
    backgroundColor: '#E8EAF6',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  serviceMeta: {
    fontSize: 12,
    color: '#757575',
  },
  serviceSelectedMark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F51B5',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  statusChipText: {
    fontSize: 12,
    color: '#455A64',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
