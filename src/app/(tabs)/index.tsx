
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
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [eventCount, setEventCount] = useState(0);
  const [socialCount, setSocialCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date().toISOString();

      const [eventsResult, socialResult] = await Promise.all([
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published')
          .gte('event_date', now),

        supabase
          .from('social_work_projects')
          .select('id', { count: 'exact', head: true })
          .gte('activity_date', now),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (socialResult.error) throw socialResult.error;

      setEventCount(eventsResult.count || 0);
      setSocialCount(socialResult.count || 0);
    } catch (error: any) {
      console.log('Dashboard Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts])
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>RISE N SHINE</Text>

        <Text style={styles.welcome}>
          Welcome Back! 👋
        </Text>

        <Text style={styles.subtitle}>
          Together we grow. Together we shine.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Our Community
        </Text>

        <View style={styles.cardContainer}>
          {/* Upcoming Events */}
          <TouchableOpacity
            style={[styles.card, styles.eventCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.cardIcon}>📅</Text>

            <Text style={styles.cardCount}>
              {loading ? '...' : eventCount}
            </Text>

            <Text style={styles.cardTitle}>
              Upcoming Events
            </Text>

            <Text style={styles.cardLink}>
              View Events →
            </Text>
          </TouchableOpacity>

          {/* Upcoming Social Work */}
          <TouchableOpacity
            style={[styles.card, styles.socialCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/social-work')}
          >
            <Text style={styles.cardIcon}>🤝</Text>

            <Text style={styles.cardCount}>
              {loading ? '...' : socialCount}
            </Text>

            <Text style={styles.cardTitle}>
              Upcoming Social Work
            </Text>

            <Text style={styles.cardLink}>
              View Activities →
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator
            size="small"
            color="#E87532"
            style={{ marginTop: 15 }}
          />
        )}

        {/* Entertainment Zone */}
        <Text style={styles.sectionTitle}>
          Entertainment Zone
        </Text>

        <TouchableOpacity
          style={styles.gameCard}
          activeOpacity={0.85}
          onPress={() => router.push('/game-zone')}
        >
          <View style={styles.gameContent}>
            <View style={styles.gameIconBox}>
              <Text style={styles.gameIcon}>🎮</Text>
            </View>

            <View style={styles.gameTextContainer}>
              <Text style={styles.gameTitle}>
                Game Zone
              </Text>

              <Text style={styles.gameSubtitle}>
                Play Games • Have Fun • Challenge Yourself
              </Text>

              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>
                  FREE FOR ALL MEMBERS
                </Text>
              </View>
            </View>

            <Text style={styles.gameArrow}>➜</Text>
          </View>

          {/* New Games */}
          <View style={styles.gameFooter}>
            <View style={styles.gameItem}>
              <Text style={styles.gameItemIcon}>⭕</Text>
              <Text style={styles.gameFooterText}>
                Tic Tac Toe
              </Text>
            </View>

            <View style={styles.gameItem}>
              <Text style={styles.gameItemIcon}>🧠</Text>
              <Text style={styles.gameFooterText}>
                Memory Match
              </Text>
            </View>

            <View style={styles.gameItem}>
              <Text style={styles.gameItemIcon}>🔨</Text>
              <Text style={styles.gameFooterText}>
                Whack-a-Mole
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.footer}>
          ONE TEAM • ONE FAMILY ❤️
        </Text>
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
    marginBottom: 18,
    marginTop: 8,
  },

  cardContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  card: {
    flex: 1,
    padding: 15,
    borderRadius: 18,
    minHeight: 180,
    justifyContent: 'center',
    borderWidth: 1,
  },

  eventCard: {
    backgroundColor: '#FFF0E5',
    borderColor: '#F5D3BD',
  },

  socialCard: {
    backgroundColor: '#E8F4ED',
    borderColor: '#C9E4D3',
  },

  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  cardCount: {
    color: '#123B63',
    fontSize: 34,
    fontWeight: '900',
  },

  cardTitle: {
    color: '#123B63',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
  },

  cardLink: {
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },

  // Game Zone Styles

  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6E9FA',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#123B63',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  gameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  gameIconBox: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: '#E9F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  gameIcon: {
    fontSize: 32,
  },

  gameTextContainer: {
    flex: 1,
  },

  gameTitle: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: '900',
  },

  gameSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },

  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F4ED',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 9,
  },

  freeBadgeText: {
    color: '#16834A',
    fontSize: 9,
    fontWeight: '900',
  },

  gameArrow: {
    color: '#E87532',
    fontSize: 25,
    fontWeight: '900',
    marginLeft: 5,
  },

  gameFooter: {
    backgroundColor: '#F2F8FD',
    paddingHorizontal: 8,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#DCEBF7',
  },

  gameItem: {
    alignItems: 'center',
    flex: 1,
  },

  gameItemIcon: {
    fontSize: 20,
    marginBottom: 5,
  },

  gameFooterText: {
    color: '#123B63',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  footer: {
    textAlign: 'center',
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 40,
    marginBottom: 25,
  },
});
