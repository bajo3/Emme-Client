// app/services/[id].js
import React, { useEffect, useState } from 'react'
import {
  Text,
  TextInput,
  StyleSheet,
  Button,
  Switch,
  Alert,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Screen from '../../components/ui/Screen'
import SectionTitle from '../../components/ui/SectionTitle'
import Spacer from '../../components/ui/Spacer'
import Card from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [color, setColor] = useState('#8E44AD')
  const [isActive, setIsActive] = useState(true)

  const loadService = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al cargar servicio', error)
      Alert.alert('Error', 'No se pudo cargar el servicio.')
      setLoading(false)
      return
    }

    setName(data.name || '')
    setCategory(data.category || '')
    setPrice(data.price != null ? String(data.price) : '')
    setDurationMin(data.duration_min != null ? String(data.duration_min) : '')
    setColor(data.color || '#8E44AD')
    setIsActive(data.is_active ?? true)

    setLoading(false)
  }

  useEffect(() => {
    if (id) {
      loadService()
    }
  }, [id])

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

    const { error } = await supabase
      .from('services')
      .update({
        name: name.trim(),
        category: category.trim() || null,
        price: parsedPrice,
        color: color || null,
        is_active: isActive,
        duration_min: parsedDuration,
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      console.error('Error al guardar servicio', error)
      Alert.alert('Error', 'No se pudo guardar el servicio.')
      return
    }

    setIsEditing(false)
    Alert.alert('OK', 'Servicio actualizado.')
  }

  const handleDelete = async () => {
    setDeleting(true)

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    setDeleting(false)

    if (error) {
      console.error('Error al eliminar servicio', error)
      Alert.alert(
        'Error',
        error.message || 'No se pudo eliminar el servicio.'
      )
      return
    }

    if (Platform.OS === 'web') {
      Alert.alert('OK', 'Servicio eliminado.')
      router.replace('/services')
    } else {
      Alert.alert('OK', 'Servicio eliminado.', [
        { text: 'Volver a la lista', onPress: () => router.replace('/services') },
      ])
    }
  }

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      // En web no hay Alert con botones, borramos directo
      handleDelete()
      return
    }

    Alert.alert(
      'Eliminar servicio',
      '¿Seguro que querés eliminar este servicio? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
      ]
    )
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator />
        <Spacer />
        <Text>Cargando servicio...</Text>
      </Screen>
    )
  }

  return (
    <Screen>
      <SectionTitle>Servicio</SectionTitle>
      <Card>
        <Text style={styles.label}>Nombre *</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        ) : (
          <Text style={styles.value}>{name}</Text>
        )}

        <Spacer size={8} />

        <Text style={styles.label}>Categoría</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
          />
        ) : (
          <Text style={styles.value}>{category || 'Sin categoría'}</Text>
        )}

        <Spacer size={8} />

        <Text style={styles.label}>Color</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
          />
        ) : (
          <Text style={styles.value}>{color || 'Sin color'}</Text>
        )}

        <Spacer size={8} />

        <Text style={styles.label}>Duración (minutos)</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={durationMin}
            onChangeText={setDurationMin}
          />
        ) : (
          <Text style={styles.value}>
            {durationMin ? `${durationMin} min` : 'Sin duración'}
          </Text>
        )}

        <Spacer size={8} />

        <Text style={styles.label}>Precio</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        ) : (
          <Text style={styles.value}>
            {price
              ? `$ ${Number(price).toLocaleString('es-AR')}`
              : 'Sin precio'}
          </Text>
        )}

        <Spacer size={8} />

        <View style={styles.row}>
          <Text style={styles.label}>Activo</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            disabled={!isEditing}
          />
        </View>

        <Spacer size={16} />

        <Button
          title={isEditing ? 'Cancelar edición' : 'Editar servicio'}
          onPress={() => setIsEditing((prev) => !prev)}
        />

        {isEditing && (
          <>
            <Spacer size={8} />
            <Button
              title={saving ? 'Guardando...' : 'Guardar cambios'}
              onPress={handleSave}
            />
          </>
        )}

        <Spacer size={16} />

        <Button
          title={deleting ? 'Eliminando...' : 'Eliminar servicio'}
          color="#E53935"
          onPress={confirmDelete}
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
  value: {
    fontSize: 14,
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
