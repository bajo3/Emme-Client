// components/ui/Screen.js
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen({ children, scroll = true, style }) {
  const Container = scroll ? ScrollView : View

  return (
    <SafeAreaView style={styles.safe}>
      <Container contentContainerStyle={[styles.container, style]}>
        {children}
      </Container>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
})
