
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  fee: number;
};

export default function ActivitiesScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, location, fee')
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.log('Events Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Upcoming Events</Text>
        <Text style={styles.subtitle}>
          Together we participate, contribute and grow.
        </Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>
            No upcoming events at the moment.
          </Text>
        ) : (
          events.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/event-details',
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.cardTitle}>{item.title}</Text>

              <Text style={styles.description}>
                {item.description || 'No description available.'}
              </Text>

              <Text style={styles.info}>
                📅 {new Date(item.event_date).toLocaleDateString()}
              </Text>

              <Text style={styles.info}>
                📍 {item.location || 'Location not specified'}
              </Text>

              <Text style={styles.fee}>
                Contribution: {Number(item.fee) > 0
                  ? `₹${item.fee}`
                  : 'Optional'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 65,
    paddingHorizontal: 24,
    paddingBottom: 35,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  info: {
    color: '#123B63',
    fontSize: 13,
    marginTop: 10,
  },
  fee: {
    color: '#E87532',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 30,
  },
});
