// app/agenda/views/AgendaDay.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Card from '../../../components/ui/Card';
import { supabase } from '../../../lib/supabase';

const ACTIVE_STATUSES = ['pending', 'confirmed'];
const ARCHIVED_STATUSES = ['done', 'cancelled'];

export default function AgendaDay() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const formattedDate = useMemo(
    () =>
      format(selectedDate, "EEEE d 'de' MMMM", {
        locale: es,
      }),
    [selectedDate],
  );

  const filteredAppointments = useMemo(() => {
    const statuses =
      viewMode === 'active' ? ACTIVE_STATUSES : ARCHIVED_STATUSES;

    return appointments.filter((appt) => statuses.includes(appt.status));
  }, [appointments, viewMode]);

  const fetchDayAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id,
          date,
          start_time,
          end_time,
          status,
          notes,
          clients (
            id,
            name,
            phone,
            instagram
          )
        `,
        )
        .eq('date', dateStr)
        .order('start_time', { ascending: true });

      if (error) {
        console.log('Error cargando turnos día:', error.message);
        return;
      }

      setAppointments(data || []);
    } catch (e) {
      console.log('Error inesperado:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayAppointments();
  }, [fetchDayAppointments]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.log('Error actualizando estado:', error.message);
        return;
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: newStatus } : appt,
        ),
      );
    } catch (e) {
      console.log('Error inesperado al cambiar estado:', e);
    }
  };

  const openDatePicker = () => setDatePickerVisible(true);
  const closeDatePicker = () => setDatePickerVisible(false);

  const handleConfirmDate = (date) => {
    closeDatePicker();
    setSelectedDate(date);
  };

  return (
    <View style={styles.container}>
      {/* Selector de fecha (abre calendario) */}
      <TouchableOpacity style={styles.datePill} onPress={openDatePicker}>
        <Text style={styles.datePillText}>{formattedDate}</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={handleConfirmDate}
        onCancel={closeDatePicker}
      />

      {/* Lista de turnos */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : filteredAppointments.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay turnos {viewMode === 'active' ? 'activos' : 'archivados'} para
            este día.
          </Text>
        ) : (
          <ScrollView>
            {filteredAppointments.map((appt) => (
              <Card key={appt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptClient}>
                      {appt.clients?.name || 'Sin nombre'}
                    </Text>
                    <Text style={styles.apptService}>
                      {appt.notes || 'Sin notas'}
                    </Text>
                    <Text style={styles.apptTime}>
                      {appt.start_time?.slice(0, 5)} -{' '}
                      {appt.end_time?.slice(0, 5)}
                    </Text>
                    <Text style={styles.apptStatus}>
                      Estado: {appt.status}
                    </Text>
                  </View>

                  <View style={styles.statusButtons}>
                    {appt.status !== 'pending' && (
                      <TouchableOpacity
                        style={[styles.statusBtn, styles.statusPending]}
                        onPress={() => handleStatusChange(appt.id, 'pending')}
                      >
                        <Text style={styles.statusBtnText}>Pendiente</Text>
                      </TouchableOpacity>
                    )}

                    {appt.status !== 'confirmed' && (
                      <TouchableOpacity
                        style={[styles.statusBtn, styles.statusConfirmed]}
                        onPress={() =>
                          handleStatusChange(appt.id, 'confirmed')
                        }
                      >
                        <Text style={styles.statusBtnText}>Confirmado</Text>
                      </TouchableOpacity>
                    )}

                    {appt.status !== 'done' && (
                      <TouchableOpacity
                        style={[styles.statusBtn, styles.statusDone]}
                        onPress={() => handleStatusChange(appt.id, 'done')}
                      >
                        <Text style={styles.statusBtnText}>Realizado</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  newBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  newBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'white',
  },
  segmentText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#111827',
  },
  archiveRow: { marginBottom: 8 },
  archiveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  archiveBtnActive: {
    backgroundColor: '#4F46E5',
  },
  archiveBtnText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  archiveBtnTextActive: {
    color: 'white',
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  datePillText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  listContainer: { flex: 1, marginTop: 8 },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentCard: { marginBottom: 10 },
  appointmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  apptClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  apptService: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  apptTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  apptStatus: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  statusButtons: { justifyContent: 'space-between' },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  statusBtnText: { fontSize: 11, fontWeight: '600', color: 'white' },
  statusPending: { backgroundColor: '#F59E0B' },
  statusConfirmed: { backgroundColor: '#10B981' },
  statusDone: { backgroundColor: '#6B7280' },
});
