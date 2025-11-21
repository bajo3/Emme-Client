// app/clients/index.js
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function ClientsScreen() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando clientes', error)
      } else {
        setClients(data || [])
      }
    } catch (e) {
      console.error('Error inesperado cargando clientes', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.instagram || '').toLowerCase().includes(term)
    )
  })

  const handleNewClient = () => {
    router.push('/clients/new')
  }

  const handlePressClient = (client) => {
    router.push(`/clients/${client.id}`)
  }

  const openWhatsApp = (client) => {
    if (!client.phone) return
    const msg = `Hola ${client.name || ''}, ¿cómo estás?`
    const url = `https://wa.me/${client.phone}?text=${encodeURIComponent(msg)}`
    Linking.openURL(url)
  }

  const openInstagram = (client) => {
    if (!client.instagram) return
    const handle = client.instagram.replace('@', '').trim()
    const url = `https://instagram.com/${handle}`
    Linking.openURL(url)
  }

  const renderClientItem = ({ item }) => (
    <View style={styles.clientRow}>
      <TouchableOpacity
        style={styles.clientInfo}
        onPress={() => handlePressClient(item)}
      >
        <Text style={styles.clientName} numberOfLines={1}>
          {item.name || 'Sin nombre'}
        </Text>

        {!!item.phone && (
          <Text style={styles.clientMeta} numberOfLines={1}>
            {item.phone}
          </Text>
        )}

        {!!item.instagram && (
          <Text style={styles.clientMeta} numberOfLines={1}>
            @{item.instagram.replace('@', '')}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        {!!item.phone && (
          <TouchableOpacity
            onPress={() => openWhatsApp(item)}
            style={styles.iconButton}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />
          </TouchableOpacity>
        )}

        {!!item.instagram && (
          <TouchableOpacity
            onPress={() => openInstagram(item)}
            style={styles.iconButton}
          >
            <Ionicons name="logo-instagram" size={20} color="#ec4899" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const ListHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>
            {clients.length} cliente{clients.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleNewClient} style={styles.newButton}>
          <Text style={styles.newButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, teléfono o Instagram"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>
    </View>
  )

  if (loading && clients.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3F51B5" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={renderClientItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              No hay clientes cargados todavía.
            </Text>
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // fondo claro
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  newButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#3F51B5',
  },
  newButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
    fontSize: 13,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  clientMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
})
