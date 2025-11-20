// app/services/new.js
import React, { useState } from 'react'
import {
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
  Alert,
  View,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

export default function NewServiceScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [color, setColor] = useState('#8E44AD')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta nombre', 'El nombre del servicio es obligatorio.')
      return
    }

    const parsedPrice = price ? Number(price.replace(',', '.')) : null
    if (price && Number.isNaN(parsedPrice)) {
      Alert.alert('Precio inválido', 'Ingresá un número válido para el precio.')
      return
    }

    const parsedDuration =
      durationMin.trim() !== '' ? Number(durationMin.replace(',', '.')) : null
    if (durationMin && Number.isNaN(parsedDuration)) {
      Alert.alert(
        'Duración inválida',
        'Ingresá un número válido para la duración en minutos.'
      )
      return
    }

    setSaving(true)

    const { error } = await supabase.from('services').insert({
      name: name.trim(),
      category: category.trim() || null,
      price: parsedPrice,
      color: color || null,
      is_active: isActive,
      duration_min: parsedDuration,
    })

    setSaving(false)

    if (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudo guardar el servicio.')
      return
    }

    // ✅ Mensaje + volver siempre a la lista de servicios
    if (Platform.OS === 'web') {
      Alert.alert('OK', 'Servicio creado.')
      router.replace('/services')
    } else {
      Alert.alert('OK', 'Servicio creado.', [
        {
          text: 'Volver a la lista',
          onPress: () => router.replace('/services'),
        },
      ])
    }
  }

  return (
    <Screen>
      <SectionTitle>Nuevo servicio</SectionTitle>
      <Card>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Kapping soft, Depilación definitiva..."
          value={name}
          onChangeText={setName}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Categoría (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Uñas, Depilación, Cejas..."
          value={category}
          onChangeText={setCategory}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Color (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="#8E44AD"
          value={color}
          onChangeText={setColor}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Duración (minutos, opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 60"
          keyboardType="numeric"
          value={durationMin}
          onChangeText={setDurationMin}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Precio (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 8000"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Spacer size={8} />

        <View style={styles.row}>
          <Text style={styles.label}>Activo</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        <Spacer size={16} />

        <Button
          title={saving ? 'Guardando...' : 'Guardar servicio'}
          onPress={handleSave}
        />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
