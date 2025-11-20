// app/services/index.js
import React, { useState, useCallback } from 'react'
import {
  Text,
  Button,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

export default function ServicesScreen() {
  const router = useRouter()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadServices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar servicios', error)
    } else {
      setServices(data || [])
    }

    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadServices()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadServices()
    setRefreshing(false)
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/services/${item.id}`)}
      style={{ marginBottom: 10 }}
    >
      <Card>
        <Text style={styles.name}>{item.name}</Text>
        {item.category ? (
          <Text style={styles.category}>{item.category}</Text>
        ) : null}
        {item.duration_min != null ? (
          <Text style={styles.duration}>{item.duration_min} min</Text>
        ) : null}
        <Spacer size={4} />
        <Text style={styles.price}>
          {item.price != null
            ? `$ ${Number(item.price).toLocaleString('es-AR')}`
            : 'Sin precio'}
        </Text>
        <Spacer size={4} />
        <Text
          style={[
            styles.status,
            { color: item.is_active ? '#2E7D32' : '#B0BEC5' },
          ]}
        >
          {item.is_active ? 'Activo' : 'Inactivo'}
        </Text>
      </Card>
    </TouchableOpacity>
  )

  return (
    <Screen scroll={false}>
      <SectionTitle
        right={<Button title="Nuevo" onPress={() => router.push('/services/new')} />}
      >
        Servicios
      </SectionTitle>

      <Spacer />

      {loading && services.length === 0 ? (
        <ActivityIndicator />
      ) : services.length === 0 ? (
        <Text>No hay servicios cargados todavía.</Text>
      ) : (
        <FlatList
          data={services}
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  category: {
    fontSize: 13,
    color: '#757575',
  },
  duration: {
    fontSize: 13,
    color: '#455A64',
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
})
