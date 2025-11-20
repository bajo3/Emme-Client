// components/ui/BadgeStatus.js
import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

const STATUS_COLORS = {
  pending: '#FFA000',
  confirmed: '#4CAF50',
  done: '#2E7D32',
  canceled: '#B0BEC5',
  no_show: '#E53935',
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  done: 'Realizado',
  canceled: 'Cancelado',
  no_show: 'No vino',
}

export default function BadgeStatus({ status = 'pending' }) {
  const bg = STATUS_COLORS[status] || '#B0BEC5'
  const label = STATUS_LABELS[status] || status

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
})
