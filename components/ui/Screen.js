// components/ui/Screen.js
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]}>
        <ScrollView
          contentContainerStyle={[styles.container, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // 👇 Versión sin ScrollView (para usar con FlatList / SectionList)
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={[styles.container, contentContainerStyle]}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    padding: 16,
  },
})
