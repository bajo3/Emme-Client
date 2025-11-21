// app/agenda/views/AgendaWeek.js
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
  startOfWeek,
  addDays,
  format,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import { supabase } from '../../../lib/supabase';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

export default function AgendaWeek() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // lunes
    return Array.from({ length: 7 }).map((_, index) => addDays(start, index));
  }, [currentDate]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      return (
        isSameDay(apptDate, selectedDate) &&
        ACTIVE_STATUSES.includes(appt.status)
      );
    });
  }, [appointments, selectedDate]);

  const fetchWeekAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);

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
        console.log('Error cargando turnos semana:', error.message);
        return;
      }

      setAppointments(
        (data || []).map((d) => ({
          ...d,
          date: d.date,
        })),
      );
    } catch (e) {
      console.log('Error inesperado:', e);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchWeekAppointments();
  }, [fetchWeekAppointments]);

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

  const countDayAppointments = (day) => {
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.date);
      return (
        isSameDay(apptDate, day) && ACTIVE_STATUSES.includes(appt.status)
      );
    }).length;
  };

  const goToPrevWeek = () => {
    setCurrentDate((prev) => addDays(prev, -7));
    setSelectedDate((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate((prev) => addDays(prev, 7));
    setSelectedDate((prev) => addDays(prev, 7));
  };

  return (
    <View style={styles.container}>
      {/* Navegación de semana */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={goToPrevWeek}>
          <Text style={styles.weekNavText}>{'< Semana anterior'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextWeek}>
          <Text style={styles.weekNavText}>{'Semana siguiente >'}</Text>
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekDaysRow}
      >
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const count = countDayAppointments(day);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => setSelectedDate(day)}
              style={[
                styles.dayContainer,
                isSelected && styles.dayContainerSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {format(day, 'EEE', { locale: es }).charAt(0).toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {format(day, 'd')}
              </Text>

              {count > 0 ? (
                <Text
                  style={[
                    styles.turnsCount,
                    isSelected && styles.turnsCountSelected,
                  ]}
                >
                  {count} turno{count > 1 ? 's' : ''}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.turnsCount,
                    isSelected && styles.turnsCountSelected,
                  ]}
                >
                  —
                </Text>
              )}

              {isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista de turnos del día seleccionado */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator />
        ) : filteredAppointments.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay turnos activos para este día.
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

                  {/* Botones rápidos de estado */}
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 5,
    backgroundColor: '#F5F6FA',
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,      // antes 6
  },
  weekNavText: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  weekDaysRow: {
    // paddingVertical: 8,
    paddingVertical: 0,   // sin aire extra debajo del calendario
    alignItems: 'center',
  },
  dayContainer: {
    width: 55,
    height: 160,             // más angosto
    paddingVertical: 2,    // más bajo
    borderRadius: 12,      // más compacto
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    backgroundColor: '#E5E7EB',
  },
  dayContainerSelected: {
    backgroundColor: '#4F46E5',
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: 'white',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  dayNumberSelected: {
    color: 'white',
  },
  turnsCount: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  turnsCountSelected: {
    color: '#E5E7EB',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  listContainer: {
      flex: 1,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentCard: {
    marginBottom: 10,
  },
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
  statusButtons: {
    justifyContent: 'space-between',
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  statusPending: { backgroundColor: '#F59E0B' },
  statusConfirmed: { backgroundColor: '#10B981' },
  statusDone: { backgroundColor: '#6B7280' },
});
