// components/ui/ServiceChip.js
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export default function ServiceChip({ label, color = '#8E44AD', active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: color,
          backgroundColor: active ? color : '#FFF',
        },
      ]}
    >
      <Text style={[styles.text, { color: active ? '#FFF' : color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
})
