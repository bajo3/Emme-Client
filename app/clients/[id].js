// app/clients/[id].js
import React, { useEffect, useState, useCallback } from 'react'
import {
    Text,
    StyleSheet,
    ActivityIndicator,
    Button,
    Linking,
    Alert,
    TextInput,
    View,
    FlatList,
    TouchableOpacity,
    Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

function formatTime(t) {
    if (!t) return ''
    return t.slice(0, 5)
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

function getStatusColor(status) {
    switch (status) {
        case 'confirmed':
            return '#0277BD'
        case 'done':
            return '#2E7D32'
        case 'cancelled':
            return '#E53935'
        default:
            return '#FF8F00'
    }
}

export default function ClientDetailScreen() {
    const { id } = useLocalSearchParams()
    const router = useRouter()

    const [client, setClient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [instagram, setInstagram] = useState('')
    const [notes, setNotes] = useState('')

    const [appointments, setAppointments] = useState([])
    const [loadingAppointments, setLoadingAppointments] = useState(false)

    // Cargar cliente
    useEffect(() => {
        const loadClient = async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error al cargar cliente', error)
            } else {
                setClient(data)
                setName(data.name || '')
                setPhone(data.phone || '')
                setInstagram(data.instagram || '')
                setNotes(data.notes || '')
            }

            setLoading(false)
        }

        if (id) loadClient()
    }, [id])

    const loadAppointments = useCallback(async () => {
        if (!id) return
        setLoadingAppointments(true)

        const { data, error } = await supabase
            .from('appointments')
            .select('id, date, start_time, end_time, status, service_name')
            .eq('client_id', id)
            .order('date', { ascending: false })
            .order('start_time', { ascending: true })

        if (error) {
            console.error('Error cargando turnos del cliente', error)
        } else {
            setAppointments(data || [])
        }

        setLoadingAppointments(false)
    }, [id])

    useFocusEffect(
        useCallback(() => {
            loadAppointments()
        }, [loadAppointments])
    )

    const handleWhatsApp = () => {
        if (!client?.phone) {
            Alert.alert('Sin teléfono', 'Este cliente no tiene teléfono cargado.')
            return
        }

        const clean = client.phone.replace(/\D/g, '')
        if (!clean) {
            Alert.alert('Teléfono inválido', 'El teléfono guardado no parece válido.')
            return
        }

        const url = `https://wa.me/${clean}`

        Linking.openURL(url).catch((err) => {
            console.error('Error abriendo WhatsApp', err)
            Alert.alert('Error', 'No se pudo abrir WhatsApp.')
        })
    }

    // Guardar cambios
    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Falta nombre', 'El nombre es obligatorio.')
            return
        }

        setSaving(true)

        const { data, error } = await supabase
            .from('clients')
            .update({
                name: name.trim(),
                phone: phone.trim() || null,
                instagram: instagram.trim() || null,
                notes: notes.trim() || null,
            })
            .eq('id', client.id)
            .select()
            .single()

        setSaving(false)

        if (error) {
            console.error('Error al actualizar cliente', error)
            Alert.alert('Error', error.message || 'No se pudieron guardar los cambios.')
            return
        }

        setClient(data)
        setIsEditing(false)
        Alert.alert('OK', 'Cliente actualizado.')
    }

    // Confirmación visual
    const confirmDelete = () => {
        // En web, Alert ignora los botones, así que borramos directo
        if (Platform.OS === 'web') {
            handleDelete()
            return
        }

        Alert.alert(
            'Eliminar cliente',
            '¿Seguro que querés eliminar este cliente? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
            ]
        )
    }

    // Borrado real en Supabase
    const handleDelete = async () => {
        if (!client) return

        setDeleting(true)

        // 1) Borrar turnos de este cliente
        const { error: errorAppointments } = await supabase
            .from('appointments')
            .delete()
            .eq('client_id', client.id)

        if (errorAppointments) {
            console.error('Error al eliminar turnos del cliente', errorAppointments)
            // No frenamos acá
        }

        // 2) Borrar cliente
        const { error: errorClient } = await supabase
            .from('clients')
            .delete()
            .eq('id', client.id)

        setDeleting(false)

        if (errorClient) {
            console.error('Error al eliminar cliente', errorClient)
            Alert.alert('Error', errorClient.message || 'No se pudo eliminar el cliente.')
            return
        }

        if (Platform.OS === 'web') {
            // En web, los botones del Alert no tienen onPress
            Alert.alert('OK', 'Cliente eliminado.')
            router.replace('/clients')
        } else {
            Alert.alert('OK', 'Cliente eliminado.', [
                {
                    text: 'Aceptar',
                    onPress: () => router.replace('/clients'),
                },
            ])
        }


    }

    const handleNewAppointment = () => {
        if (!client) return
        router.push({
            pathname: '/appointments/new',
            params: { clientId: client.id },
        })
    }

    const renderAppointment = ({ item }) => (
        <TouchableOpacity
            onPress={() =>
                router.push({
                    pathname: `/appointments/${item.id}`,
                })
            }
            style={{ marginBottom: 8 }}
        >
            <Card>
                <Text style={styles.apptDate}>{item.date}</Text>
                <Text style={styles.apptTime}>
                    {formatTime(item.start_time)}
                    {item.end_time ? ` - ${formatTime(item.end_time)}` : ''}
                </Text>
                <Spacer size={4} />
                <Text style={styles.apptService}>
                    {item.service_name || 'Sin servicio'}
                </Text>
                <Spacer size={4} />
                <View style={styles.apptStatusRow}>
                    <View
                        style={[
                            styles.apptStatusBadge,
                            { backgroundColor: getStatusColor(item.status) },
                        ]}
                    >
                        <Text style={styles.apptStatusText}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    )

    if (loading) {
        return (
            <Screen>
                <ActivityIndicator />
            </Screen>
        )
    }

    if (!client) {
        return (
            <Screen>
                <Text>No se encontró el cliente.</Text>
            </Screen>
        )
    }

    return (
        <Screen>
            <SectionTitle>{isEditing ? 'Editar cliente' : client.name}</SectionTitle>

            <Card>
                {/* Nombre */}
                <Text style={styles.label}>Nombre *</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nombre y apellido"
                    />
                ) : (
                    <Text style={styles.value}>{client.name}</Text>
                )}

                <Spacer size={8} />

                {/* Teléfono */}
                <Text style={styles.label}>Teléfono</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Ej: 2494..."
                        keyboardType="phone-pad"
                    />
                ) : (
                    <Text style={styles.value}>{client.phone || '-'}</Text>
                )}

                <Spacer size={8} />

                {/* Instagram */}
                <Text style={styles.label}>Instagram</Text>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={instagram}
                        onChangeText={setInstagram}
                        placeholder="usuario (sin @)"
                        autoCapitalize="none"
                    />
                ) : (
                    <Text style={styles.value}>
                        {client.instagram ? `@${client.instagram}` : '-'}
                    </Text>
                )}

                <Spacer size={8} />

                {/* Notas */}
                <Text style={styles.label}>Notas</Text>
                {isEditing ? (
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder='Ej: "prefiere uñas cortas", "alérgica a..."'
                        multiline
                    />
                ) : (
                    <Text style={styles.value}>{client.notes || '-'}</Text>
                )}

                <Spacer size={16} />

                {/* Botones principales */}
                {isEditing ? (
                    <>
                        <Button
                            title={saving ? 'Guardando...' : 'Guardar cambios'}
                            onPress={handleSave}
                        />
                        <Spacer size={8} />
                        <Button
                            title="Cancelar edición"
                            color="#757575"
                            onPress={() => {
                                setName(client.name || '')
                                setPhone(client.phone || '')
                                setInstagram(client.instagram || '')
                                setNotes(client.notes || '')
                                setIsEditing(false)
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Button title="Editar datos" onPress={() => setIsEditing(true)} />
                        <Spacer size={8} />
                        <Button title="Abrir WhatsApp" onPress={handleWhatsApp} />
                        <Spacer size={8} />
                        <Button title="Nuevo turno" onPress={handleNewAppointment} />
                    </>
                )}
            </Card>

            <Spacer size={16} />

            {/* Botón peligroso: eliminar */}
            <View>
                <Button
                    title={deleting ? 'Eliminando...' : 'Eliminar cliente'}
                    color="#E53935"
                    onPress={confirmDelete}
                />
            </View>

            <Spacer size={24} />

            {/* Historial de turnos */}
            <SectionTitle>Historial de turnos</SectionTitle>

            {loadingAppointments ? (
                <>
                    <ActivityIndicator />
                    <Spacer size={8} />
                    <Text>Cargando turnos...</Text>
                </>
            ) : appointments.length === 0 ? (
                <Text style={styles.emptyAppointments}>
                    Este cliente todavía no tiene turnos.
                </Text>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAppointment}
                />
            )}
        </Screen>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#616161',
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        color: '#212121',
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
    emptyAppointments: {
        fontSize: 13,
        color: '#757575',
    },
    apptDate: {
        fontSize: 13,
        color: '#757575',
    },
    apptTime: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
    },
    apptService: {
        fontSize: 13,
        color: '#424242',
    },
    apptStatusRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    apptStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    apptStatusText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
})
