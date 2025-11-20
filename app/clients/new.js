// app/clients/new.js
import React, { useState } from 'react'
import {
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

export default function NewClientScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta nombre', 'El nombre del cliente es obligatorio.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('clients').insert({
      name: name.trim(),
      phone: phone.trim() || null,
      instagram: instagram.trim() || null,
      notes: notes.trim() || null,
    })

    setSaving(false)

    if (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudo guardar el cliente.')
      return
    }

    // ✅ Comportamiento distinto para web vs nativo
    if (Platform.OS === 'web') {
      Alert.alert('OK', 'Cliente creado.')
      router.replace('/clients')
    } else {
      Alert.alert('OK', 'Cliente creado.', [
        {
          text: 'Volver a la lista',
          onPress: () => router.replace('/clients'),
        },
      ])
    }
  }

  return (
    <Screen>
      <SectionTitle>Nuevo cliente</SectionTitle>
      <Card>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre y apellido"
          value={name}
          onChangeText={setName}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 2494..."
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={styles.input}
          placeholder="usuario (sin @)"
          autoCapitalize="none"
          value={instagram}
          onChangeText={setInstagram}
        />

        <Spacer size={8} />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder='Ej: "prefiere uñas cortas", "alérgica a..."'
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Spacer size={16} />

        <Button
          title={saving ? 'Guardando...' : 'Guardar cliente'}
          onPress={handleSave}
          disabled={saving}
        />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
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
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
})
