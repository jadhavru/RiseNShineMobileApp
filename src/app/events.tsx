
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type EventItem = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
};

export default function EventsScreen() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [completedEvents, setCompletedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion states
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date().toISOString();

      const [upcomingResult, completedResult] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, event_date, location')
          .eq('status', 'published')
          .gte('event_date', now)
          .order('event_date', { ascending: true }),

        supabase
          .from('events')
          .select('id, title, event_date, location')
          .eq('status', 'published')
          .lt('event_date', now)
          .order('event_date', { ascending: false }),
      ]);

      if (upcomingResult.error) throw upcomingResult.error;
      if (completedResult.error) throw completedResult.error;

      setUpcomingEvents(upcomingResult.data || []);
      setCompletedEvents(completedResult.data || []);

    } catch (error: any) {
      console.log('Events Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const openEvent = (id: string) => {
    router.push({
      pathname: '/event-details',
      params: { id },
    });
  };

  const renderEvent = (event: EventItem) => (
    <TouchableOpacity
      key={event.id}
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => openEvent(event.id)}
    >
      <Text style={styles.eventTitle}>
        {event.title}
      </Text>

      <Text style={styles.cardText}>
        📅 {new Date(event.event_date).toLocaleString('en-IN')}
      </Text>

      <Text style={styles.cardText}>
        📍 {event.location || 'Location not specified'}
      </Text>

      <Text style={styles.link}>
        View Event Details →
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
     <View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => router.back()}
    activeOpacity={0.7}
  >
    <Text style={styles.backButtonText}>← Back</Text>
  </TouchableOpacity>

  <Text style={styles.headerTitle}>
    📅 Events
  </Text>

  <Text style={styles.headerSubtitle}>
    Explore our community events
  </Text>
</View>

      <View style={styles.content}>

        {/* Upcoming Events Accordion */}

        <TouchableOpacity
          style={styles.sectionHeader}
          activeOpacity={0.8}
          onPress={() => setUpcomingExpanded(!upcomingExpanded)}
        >
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>
              Upcoming Events
            </Text>

            <Text style={styles.count}>
              {upcomingEvents.length}
            </Text>
          </View>

          <Text style={styles.arrow}>
            {upcomingExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {upcomingExpanded && (
          <View style={styles.sectionContent}>
            {loading ? (
              <ActivityIndicator size="large" color="#E87532" />
            ) : upcomingEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No upcoming events available.
                </Text>
              </View>
            ) : (
              upcomingEvents.map(renderEvent)
            )}
          </View>
        )}

        {/* Completed Events Accordion */}

        <TouchableOpacity
          style={[styles.sectionHeader, { marginTop: 15 }]}
          activeOpacity={0.8}
          onPress={() => setCompletedExpanded(!completedExpanded)}
        >
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>
              Completed Events
            </Text>

            <Text style={styles.completedCount}>
              {completedEvents.length}
            </Text>
          </View>

          <Text style={styles.arrow}>
            {completedExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {completedExpanded && (
          <View style={styles.sectionContent}>
            {loading ? (
              <ActivityIndicator size="large" color="#238653" />
            ) : completedEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No completed events available.
                </Text>
              </View>
            ) : (
              completedEvents.map(renderEvent)
            )}
          </View>
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
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 8,
  },

  content: {
    padding: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
    marginBottom: 12,
  },

  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  sectionTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '900',
  },

  arrow: {
    color: '#123B63',
    fontSize: 15,
    fontWeight: '900',
  },

  sectionContent: {
    marginTop: 2,
  },

  count: {
    color: '#E87532',
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: '800',
    overflow: 'hidden',
  },

  completedCount: {
    color: '#238653',
    backgroundColor: '#E8F4ED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: '800',
    overflow: 'hidden',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },

  eventTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },

  cardText: {
    color: '#718096',
    fontSize: 13,
    marginTop: 9,
  },

  link: {
    color: '#E87532',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 13,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyText: {
    color: '#718096',
    fontSize: 13,
  },
  backButton: {
  alignSelf: 'flex-start',
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: 10,
  marginBottom: 18,
},

backButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '800',
},
});
