// app/clients/index.js
import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

export default function ClientsScreen() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadClients = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando clientes', error)
      Alert.alert('Error', 'No se pudieron cargar los clientes.')
      setClients([])
    } else {
      setClients(data || [])
    }

    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadClients()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadClients()
    setRefreshing(false)
  }

  const handleWhatsApp = (client) => {
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

  const handleInstagram = (client) => {
    if (!client?.instagram) {
      Alert.alert('Sin Instagram', 'Este cliente no tiene Instagram cargado.')
      return
    }

    const username = client.instagram.replace('@', '').trim()
    if (!username) {
      Alert.alert('Instagram inválido', 'El usuario de Instagram no es válido.')
      return
    }

    const url = `https://instagram.com/${username}`

    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo Instagram', err)
      Alert.alert('Error', 'No se pudo abrir Instagram.')
    })
  }

  const renderItem = ({ item }) => {
    const hasPhone = !!item.phone
    const hasInstagram = !!item.instagram

    return (
      <TouchableOpacity
        onPress={() => router.push(`/clients/${item.id}`)}
        style={{ marginBottom: 10 }}
        activeOpacity={0.8}
      >
        <Card>
          <View style={styles.row}>
            {/* Izquierda: datos del cliente */}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>

              {item.phone ? (
                <Text style={styles.phone}>{item.phone}</Text>
              ) : (
                <Text style={styles.muted}>Sin teléfono</Text>
              )}

              {item.notes ? (
                <>
                  <Spacer size={4} />
                  <Text style={styles.notes} numberOfLines={2}>
                    {item.notes}
                  </Text>
                </>
              ) : null}
            </View>

            {/* Derecha: iconos de acción */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleWhatsApp(item)}
                disabled={!hasPhone}
                style={[
                  styles.iconButton,
                  !hasPhone && styles.iconDisabled,
                ]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={22}
                  color={hasPhone ? '#25D366' : '#B0BEC5'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleInstagram(item)}
                disabled={!hasInstagram}
                style={[
                  styles.iconButton,
                  !hasInstagram && styles.iconDisabled,
                ]}
              >
                <Ionicons
                  name="logo-instagram"
                  size={22}
                  color={hasInstagram ? '#E1306C' : '#B0BEC5'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <Screen>
      <SectionTitle
        right={
          <TouchableOpacity onPress={() => router.push('/clients/new')}>
            <Text style={styles.newBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        }
      >
        Clientes
      </SectionTitle>

      <Spacer />

      {loading && clients.length === 0 ? (
        <>
          <ActivityIndicator />
          <Spacer />
          <Text>Cargando clientes...</Text>
        </>
      ) : clients.length === 0 ? (
        <Text>No hay clientes cargados todavía.</Text>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3F51B5"
            />
          }
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#424242',
  },
  muted: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  notes: {
    fontSize: 12,
    color: '#616161',
  },
  actions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#ECEFF1',
  },
  iconDisabled: {
    opacity: 0.5,
  },
  newBtnText: {
    color: '#3F51B5',
    fontWeight: '600',
    fontSize: 14,
  },
})
