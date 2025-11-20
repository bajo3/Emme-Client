// components/ui/SectionTitle.js
import React from 'react'
import { Text, StyleSheet, View } from 'react-native'

export default function SectionTitle({ children, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{children}</Text>
      {right && <View>{right}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
})
