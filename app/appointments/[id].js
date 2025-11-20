// app/appointments/[id].js
import React, { useEffect, useState } from 'react'
import {
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    View,
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

function timeFromDb(value) {
    if (!value) return ''
    // value tipo "14:30:00"
    return value.slice(0, 5)
}

export default function AppointmentDetailScreen() {
    const router = useRouter()
    const { id } = useLocalSearchParams()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [appointment, setAppointment] = useState(null)

    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [notes, setNotes] = useState('')
    const [status, setStatus] = useState('pending')

    const [services, setServices] = useState([])
    const [servicesLoading, setServicesLoading] = useState(false)
    const [selectedServiceId, setSelectedServiceId] = useState(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)

            const [{ data: appt, error: apptError }, { data: svcs, error: svcsError }] =
                await Promise.all([
                    supabase
                        .from('appointments')
                        .select('*')
                        .eq('id', id)
                        .single(),
                    supabase
                        .from('services')
                        .select('*')
                        .eq('is_active', true)
                        .order('name', { ascending: true }),
                ])

            if (apptError) {
                console.error('Error cargando turno', apptError)
                Alert.alert('Error', 'No se pudo cargar el turno.')
                setLoading(false)
                return
            }

            if (svcsError) {
                console.error('Error cargando servicios', svcsError)
                Alert.alert('Error', 'No se pudieron cargar los servicios.')
            }

            setAppointment(appt || null)
            setServices(svcs || [])

            if (appt) {
                setDate(appt.date || '')
                setStartTime(timeFromDb(appt.start_time))
                setEndTime(timeFromDb(appt.end_time))
                setNotes(appt.notes || '')
                setStatus(appt.status || 'pending')
                setSelectedServiceId(appt.service_id || null)
            }

            setLoading(false)
        }

        if (id) {
            load()
        }
    }, [id])

    const validateTime = (value) => {
        if (!value) return false
        const regex = /^([01]\d|2[0-3]):[0-5]\d$/
        return regex.test(value)
    }

    const handleSave = async () => {
        if (!appointment) return

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
            date,
            start_time: `${startTime}:00`,
            end_time: endTime ? `${endTime}:00` : null,
            status,
            notes: notes.trim() || null,
            service_id: service.id,
            service_name: service.name,
        }

        const { data, error } = await supabase
            .from('appointments')
            .update(payload)
            .eq('id', appointment.id)
            .select()
            .single()

        setSaving(false)

        if (error) {
            console.error('Error actualizando turno', error)
            Alert.alert('Error', 'No se pudo actualizar el turno.')
            return
        }

        setAppointment(data)

        // si data trae client_id, usamos eso para volver al cliente
        const clientId = data?.client_id || appointment?.client_id

        if (Platform.OS === 'web') {
            // En web, los botones del Alert no ejecutan bien el onPress
            Alert.alert('OK', 'Turno actualizado.')
            if (clientId) {
                router.replace(`/clients/${clientId}`)
            } else {
                router.back()
            }
        } else {
            // En Android/iOS mostramos el botón y navegamos al cliente
            Alert.alert('OK', 'Turno actualizado.', [
                {
                    text: 'Volver al cliente',
                    onPress: () => {
                        if (clientId) {
                            router.replace(`/clients/${clientId}`)
                        } else {
                            router.back()
                        }
                    },
                },
            ])
        }

    }

    const handleDelete = async () => {
        if (!appointment) return

        Alert.alert(
            'Eliminar turno',
            '¿Seguro que querés eliminar este turno?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true)
                        const { error } = await supabase
                            .from('appointments')
                            .delete()
                            .eq('id', appointment.id)

                        setDeleting(false)

                        if (error) {
                            console.error('Error eliminando turno', error)
                            Alert.alert('Error', 'No se pudo eliminar el turno.')
                            return
                        }

                        Alert.alert('OK', 'Turno eliminado.', [
                            {
                                text: 'Aceptar',
                                onPress: () => router.replace('/agenda'),
                            },
                        ])
                    },
                },
            ]
        )
    }

    if (loading) {
        return (
            <Screen>
                <ActivityIndicator />
                <Spacer />
                <Text>Cargando turno...</Text>
            </Screen>
        )
    }

    if (!appointment) {
        return (
            <Screen>
                <Text>No se encontró el turno.</Text>
            </Screen>
        )
    }

    return (
        <Screen>
            <SectionTitle>Editar turno</SectionTitle>
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
                                        {selected && <Text style={styles.serviceSelectedMark}>✓</Text>}
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
                        title={saving ? 'Guardando...' : 'Guardar cambios'}
                        onPress={handleSave}
                        disabled={saving}
                    />

                    <Spacer size={12} />

                    <Button
                        title={deleting ? 'Eliminando...' : 'Eliminar turno'}
                        color="#E53935"
                        onPress={handleDelete}
                        disabled={deleting}
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
