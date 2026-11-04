
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
  event_date: string;
  location: string | null;
};

type SocialWorkItem = {
  id: string;
  title: string;
  description: string | null;
  activity_date: string | null;
  location: string | null;
};

export default function HomeScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [socialWorks, setSocialWorks] = useState<SocialWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(true);

  useEffect(() => {
    loadUpcomingEvents();
    loadSocialWorks();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, location')
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(2);

      if (error) throw error;

      setEvents(data || []);
    } catch (error: any) {
      console.log('Upcoming Events Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_work_projects')
        .select('id, title, description, activity_date, location')
 
        .order('activity_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      setSocialWorks(data || []);
    } catch (error: any) {
      console.log('Social Work Error:', error.message);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.brand}>RISE N SHINE</Text>
        <Text style={styles.welcome}>Welcome Back! 👋</Text>
        <Text style={styles.subtitle}>
          Together we grow. Together we shine.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Our Community</Text>

        <Text style={styles.heading}>📅 Upcoming Events</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : events.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              No upcoming events at the moment.
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/event-details',
                  params: { id: event.id },
                })
              }
            >
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardText}>
                {new Date(event.event_date).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.cardText}>
                📍 {event.location || 'Location not specified'}
              </Text>
              <Text style={styles.link}>View Event Details →</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.heading}>🤝 Social Work</Text>

        {socialLoading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : socialWorks.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              No Social Work activities available at the moment.
            </Text>
          </View>
        ) : (
          socialWorks.map((work) => (
            <TouchableOpacity
              key={work.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/social-work-details',
                  params: { id: work.id },
                })
              }
            >
              <Text style={styles.cardTitle}>{work.title}</Text>

              {work.activity_date ? (
                <Text style={styles.cardText}>
                  📅 {new Date(work.activity_date).toLocaleDateString('en-IN')}
                </Text>
              ) : null}

              <Text style={styles.cardText}>
                📍 {work.location || 'Location not specified'}
              </Text>

              {work.description ? (
                <Text style={styles.cardText}>
                  {work.description}
                </Text>
              ) : null}

              <Text style={styles.link}>View Social Work Details →</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/gallery')}
        >
          <Text style={styles.heading}>🖼️ Gallery</Text>
          <Text style={styles.cardText}>
            Memories and moments from our community.
          </Text>
          <Text style={styles.link}>View Gallery →</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>ONE TEAM • ONE FAMILY ❤️</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 35,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  welcome: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 25,
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 16,
  },
  heading: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },
  cardText: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  link: {
    color: '#E87532',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  footer: {
    textAlign: 'center',
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 25,
  },
});
