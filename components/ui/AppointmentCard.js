// components/ui/AppointmentCard.js
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function AppointmentCard({ appointment }) {
  const {
    status,
    start_time,
    end_time,
    service_name,
    client,
  } = appointment || {}

  const phone = client?.phone
  const instagram = client?.instagram

  const handleWhatsApp = () => {
    if (!phone) return
    const msg = `Hola ${client?.name || ''}, te recuerdo tu turno.`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    Linking.openURL(url)
  }

  const handleInstagram = () => {
    if (!instagram) return
    const handle = instagram.replace('@', '').trim()
    const url = `https://instagram.com/${handle}`
    Linking.openURL(url)
  }

  const statusConfig = getStatusConfig(status)

  return (
    <View style={styles.card}>
      {/* Info principal */}
      <View style={styles.info}>
        <Text style={styles.clientName} numberOfLines={1}>
          {client?.name || 'Sin nombre'}
        </Text>

        <Text style={styles.time}>
          {(start_time || '').slice(0, 5)} — {(end_time || '').slice(0, 5)}
        </Text>

        {!!service_name && (
          <Text style={styles.service} numberOfLines={1}>
            {service_name}
          </Text>
        )}
      </View>

      {/* Estado */}
      <View style={styles.badgeContainer}>
        <Text
          style={[
            styles.badge,
            {
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
            },
          ]}
        >
          {statusConfig.label}
        </Text>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        {phone && (
          <TouchableOpacity onPress={handleWhatsApp} style={styles.iconButton}>
            <Ionicons name="logo-whatsapp" size={18} color="#0f9d58" />
          </TouchableOpacity>
        )}

        {instagram && (
          <TouchableOpacity onPress={handleInstagram} style={styles.iconButton}>
            <Ionicons name="logo-instagram" size={18} color="#c13584" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function getStatusConfig(status) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmado', bg: '#C8F7C5', color: '#1E824C' }
    case 'done':
      return { label: 'Realizado', bg: '#D2D7D3', color: '#6C7A89' }
    case 'cancelled':
      return { label: 'Cancelado', bg: '#F5D6D6', color: '#CF000F' }
    case 'pending':
    default:
      return { label: 'Pendiente', bg: '#FDE3A7', color: '#F39C12' }
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#141414',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  info: {
    flex: 1,
    marginRight: 6,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  service: {
    fontSize: 12,
    color: '#fbbf24',
  },
  badgeContainer: {
    marginHorizontal: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  iconButton: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#1f2933',
    marginLeft: 4,
  },
})
