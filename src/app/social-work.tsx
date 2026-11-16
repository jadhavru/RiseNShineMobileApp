
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

type SocialWorkItem = {
  id: string;
  title: string;
  description: string | null;
  activity_date: string | null;
  location: string | null;
};

export default function SocialWorkScreen() {
  const [upcomingWorks, setUpcomingWorks] = useState<SocialWorkItem[]>([]);
  const [completedWorks, setCompletedWorks] = useState<SocialWorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion states
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const loadSocialWorks = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date().toISOString();

      const [upcomingResult, completedResult] = await Promise.all([
        supabase
          .from('social_work_projects')
          .select('id, title, description, activity_date, location')
          .gte('activity_date', now)
          .order('activity_date', { ascending: true }),

        supabase
          .from('social_work_projects')
          .select('id, title, description, activity_date, location')
          .lt('activity_date', now)
          .order('activity_date', { ascending: false }),
      ]);

      if (upcomingResult.error) throw upcomingResult.error;
      if (completedResult.error) throw completedResult.error;

      setUpcomingWorks(upcomingResult.data || []);
      setCompletedWorks(completedResult.data || []);

    } catch (error: any) {
      console.log('Social Work Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSocialWorks();
    }, [loadSocialWorks])
  );

  const openSocialWork = (id: string) => {
    router.push({
      pathname: '/social-work-details',
      params: { id },
    });
  };

  const renderWork = (work: SocialWorkItem) => (
    <TouchableOpacity
      key={work.id}
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => openSocialWork(work.id)}
    >
      <Text style={styles.workTitle}>
        {work.title}
      </Text>

      {work.activity_date && (
        <Text style={styles.cardText}>
          📅 {new Date(work.activity_date).toLocaleDateString('en-IN')}
        </Text>
      )}

      <Text style={styles.cardText}>
        📍 {work.location || 'Location not specified'}
      </Text>

      {work.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {work.description}
        </Text>
      ) : null}

      <Text style={styles.link}>
        View Social Work Details →
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
    🤝 Social Work
  </Text>

  <Text style={styles.headerSubtitle}>
    Together we make a difference
  </Text>
</View>

      <View style={styles.content}>

        {/* Upcoming Social Work Accordion */}

        <TouchableOpacity
          style={styles.sectionHeader}
          activeOpacity={0.8}
          onPress={() => setUpcomingExpanded(!upcomingExpanded)}
        >
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>
              Upcoming Social Work
            </Text>

            <Text style={styles.count}>
              {upcomingWorks.length}
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
            ) : upcomingWorks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No upcoming social work activities.
                </Text>
              </View>
            ) : (
              upcomingWorks.map(renderWork)
            )}
          </View>
        )}

        {/* Completed Social Work Accordion */}

        <TouchableOpacity
          style={[styles.sectionHeader, { marginTop: 15 }]}
          activeOpacity={0.8}
          onPress={() => setCompletedExpanded(!completedExpanded)}
        >
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>
              Completed Social Work
            </Text>

            <Text style={styles.completedCount}>
              {completedWorks.length}
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
            ) : completedWorks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No completed social work activities.
                </Text>
              </View>
            ) : (
              completedWorks.map(renderWork)
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
    flex: 1,
    gap: 10,
  },

  sectionTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '900',
    flexShrink: 1,
  },

  arrow: {
    color: '#123B63',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 8,
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

  workTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },

  cardText: {
    color: '#718096',
    fontSize: 13,
    marginTop: 9,
  },

  description: {
    color: '#718096',
    fontSize: 13,
    lineHeight: 20,
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
