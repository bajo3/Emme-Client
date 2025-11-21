// lib/appointments.js
import { supabase } from './supabase'

export async function setAppointmentStatus(id, status) {
  const update = { status }

  if (status === 'done') {
    update.is_archived = true
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error actualizando turno', error)
    throw error
  }

  return data
}
