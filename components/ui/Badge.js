import React from 'react'
import { Text, View, StyleSheet } from 'react-native'

export default function Badge({ children, variant = 'neutral' }) {
  const colors = {
    neutral: { bg: '#E0E0E0', text: '#333' },
    warning: { bg: '#FFB74D', text: '#000' },
    info: { bg: '#64B5F6', text: '#FFF' },
    success: { bg: '#81C784', text: '#FFF' },
    danger: { bg: '#E57373', text: '#FFF' },
  }

  const c = colors[variant] || colors.neutral

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
