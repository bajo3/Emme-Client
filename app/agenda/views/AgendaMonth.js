// app/agenda/views/AgendaMonth.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import { supabase } from '../../../lib/supabase';

const ACTIVE_STATUSES = ['pending', 'confirmed'];
const ARCHIVED_STATUSES = ['done', 'cancelled'];

export default function AgendaMonth() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthLabel = useMemo(
    () =>
      format(currentMonth, "MMMM yyyy", {
        locale: es,
      }),
    [currentMonth],
  );

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const filteredAppointmentsForSelectedDay = useMemo(() => {
    const statuses =
      viewMode === 'active' ? ACTIVE_STATUSES : ARCHIVED_STATUSES;

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      return isSameDay(apptDate, selectedDate) && statuses.includes(appt.status);
    });
  }, [appointments, selectedDate, viewMode]);

  const fetchMonthAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

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
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.log('Error cargando turnos mes:', error.message);
        return;
      }

      setAppointments(data || []);
    } catch (e) {
      console.log('Error inesperado:', e);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonthAppointments();
  }, [fetchMonthAppointments]);

  const goPrevMonth = () => setCurrentMonth((prev) => addMonths(prev, -1));
  const goNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const countDayAppointments = (day) => {
    const statuses =
      viewMode === 'active' ? ACTIVE_STATUSES : ARCHIVED_STATUSES;
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      return isSameDay(apptDate, day) && statuses.includes(appt.status);
    }).length;
  };

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

  return (
    <View style={styles.container}>
      {/* Navegación del mes */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goPrevMonth}>
          <Text style={styles.monthNavText}>{'< Mes anterior'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNextMonth}>
          <Text style={styles.monthNavText}>{'Mes siguiente >'}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>
        {/* Cabecera L M X J V S D */}
        <View style={styles.weekHeaderRow}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label) => (
            <Text key={label} style={styles.weekHeaderCell}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const count = countDayAppointments(day);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  !inMonth && styles.dayCellOutside,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayCellNumber,
                    !inMonth && styles.dayCellNumberOutside,
                    isSelected && styles.dayCellNumberSelected,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {count > 0 && (
                  <View style={styles.dayCellBadge}>
                    <Text style={styles.dayCellBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Lista de turnos del día seleccionado */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : filteredAppointmentsForSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay turnos {viewMode === 'active' ? 'activos' : 'archivados'} para
            este día.
          </Text>
        ) : (
          <ScrollView>
            {filteredAppointmentsForSelectedDay.map((appt) => (
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
  segmentBtnActive: { backgroundColor: 'white' },
  segmentText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  segmentTextActive: { color: '#111827' },
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
  archiveBtnTextActive: { color: 'white' },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthNavText: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  monthLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  calendarContainer: { backgroundColor: 'white', borderRadius: 16, padding: 10 },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekHeaderCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 10,
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
  },
  dayCellNumber: {
    fontSize: 14,
    color: '#111827',
  },
  dayCellNumberOutside: {
    color: '#9CA3AF',
  },
  dayCellNumberSelected: {
    color: 'white',
    fontWeight: '600',
  },
  dayCellBadge: {
    marginTop: 4,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  dayCellBadgeText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#374151',
  },
  listContainer: { flex: 1, marginTop: 10 },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentCard: { marginBottom: 10 },
  appointmentRow: { flexDirection: 'row', gap: 8 },
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
