
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type EventContribution = {
  id: string;
  event_id: string;
  amount: number;
  payment_status: string;
  created_at: string;
  event: {
    title: string;
    event_date: string;
    location: string | null;
  } | null;
};

type SocialContribution = {
  id: string;
  project_id: string;
  amount: number;
  payment_status: string;
  created_at: string;
  project: {
    title: string;
    activity_date: string;
    location: string | null;
  } | null;
};

type ActivityItem = {
  id: string;
  targetId: string;
  title: string;
  type: 'Event' | 'Social Work';
  date: string;
  amount: number;
  paymentStatus: string;
  location: string | null;
};

export default function ActivitiesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [eventsJoined, setEventsJoined] = useState(0);
  const [socialJoined, setSocialJoined] = useState(0);

  const [totalContribution, setTotalContribution] = useState(0);
  const [pendingContribution, setPendingContribution] = useState(0);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);

      // Logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setActivities([]);
        setEventsJoined(0);
        setSocialJoined(0);
        setTotalContribution(0);
        setPendingContribution(0);
        return;
      }

      // Event Contributions
      const { data: eventData, error: eventError } = await supabase
        .from('event_contributions')
        .select(`
          id,
          event_id,
          amount,
          payment_status,
          created_at,
          event:events (
            title,
            event_date,
            location
          )
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (eventError) throw eventError;

      // Social Work Contributions
      const { data: socialData, error: socialError } = await supabase
        .from('social_work_contributions')
        .select(`
          id,
          project_id,
          amount,
          payment_status,
          created_at,
          project:social_work_projects (
            title,
            activity_date,
            location
          )
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (socialError) throw socialError;

      const eventRows = (eventData || []) as unknown as EventContribution[];
      const socialRows = (socialData || []) as unknown as SocialContribution[];

      // Unique Events: Pending and Verified count as registered.
      // Rejected contributions are excluded.
      const validEvents = eventRows.filter(
        (item) => item.payment_status !== 'rejected'
      );

      const uniqueEvents = new Set(
        validEvents.map((item) => item.event_id)
      );

      // Unique Social Work Projects
      const uniqueSocial = new Set(
        socialRows.map((item) => item.project_id)
      );

      setEventsJoined(uniqueEvents.size);
      setSocialJoined(uniqueSocial.size);

      // Calculate actual paid/verified and pending amounts
      let paidAmount = 0;
      let pendingAmount = 0;

      eventRows.forEach((item) => {
        const amount = Number(item.amount) || 0;

        if (item.payment_status === 'verified') {
          paidAmount += amount;
        } else if (item.payment_status === 'pending') {
          pendingAmount += amount;
        }
      });

      socialRows.forEach((item) => {
        const amount = Number(item.amount) || 0;

        if (item.payment_status === 'paid') {
          paidAmount += amount;
        } else if (item.payment_status === 'pending') {
          pendingAmount += amount;
        }
      });

      setTotalContribution(paidAmount);
      setPendingContribution(pendingAmount);

      // Prepare Activity History
      const eventActivities: ActivityItem[] = eventRows.map((item) => ({
        id: `event-${item.id}`,

        // Actual event ID for opening event details
        targetId: item.event_id,

        title: item.event?.title || 'Event',
        type: 'Event',
        date: item.created_at,
        amount: Number(item.amount) || 0,
        paymentStatus: item.payment_status,
        location: item.event?.location || null,
      }));

      const socialActivities: ActivityItem[] = socialRows.map((item) => ({
        id: `social-${item.id}`,

        // Actual social work project ID for opening project details
        targetId: item.project_id,

        title: item.project?.title || 'Social Work',
        type: 'Social Work',
        date: item.created_at,
        amount: Number(item.amount) || 0,
        paymentStatus: item.payment_status,
        location: item.project?.location || null,
      }));

      const allActivities = [
        ...eventActivities,
        ...socialActivities,
      ].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setActivities(allActivities);
    } catch (error: any) {
      console.log('Activity Loading Error:', error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'verified' || status === 'paid') {
      return '#16834A';
    }

    if (status === 'pending') {
      return '#D18A18';
    }

    if (status === 'rejected') {
      return '#D93636';
    }

    return '#64748B';
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E87532" />
        <Text style={styles.loadingText}>Loading your activities...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#E87532']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Activity</Text>
        <Text style={styles.subtitle}>
          Your participation and contribution journey.
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>My Summary</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎉</Text>
            <Text style={styles.statNumber}>{eventsJoined}</Text>
            <Text style={styles.statLabel}>Events Joined</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🤝</Text>
            <Text style={styles.statNumber}>{socialJoined}</Text>
            <Text style={styles.statLabel}>Social Work Joined</Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountIcon}>
            <Text style={styles.amountEmoji}>💰</Text>
          </View>

          <View style={styles.amountDetails}>
            <Text style={styles.amountLabel}>Total Contribution</Text>
            <Text style={styles.amountValue}>
              {formatAmount(totalContribution)}
            </Text>
            <Text style={styles.amountNote}>
              Successfully paid / verified
            </Text>
          </View>
        </View>

        <View style={styles.pendingCard}>
          <View style={styles.pendingIcon}>
            <Text style={styles.amountEmoji}>⏳</Text>
          </View>

          <View style={styles.amountDetails}>
            <Text style={styles.pendingLabel}>Pending Payments</Text>
            <Text style={styles.pendingValue}>
              {formatAmount(pendingContribution)}
            </Text>
          </View>
        </View>

        {/* Activity History */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>My Activity History</Text>
          <Text style={styles.historyCount}>
            {activities.length} Records
          </Text>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Activities Yet</Text>
            <Text style={styles.emptyText}>
              Your event and social work contributions will appear here.
            </Text>
          </View>
        ) : (
          activities.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.historyCard}
              onPress={() => {
                if (item.type === 'Event') {
                  router.push({
                    pathname: '/event-details',
                    params: { id: item.targetId },
                  });
                } else {
                  router.push({
                    pathname: '/social-work-details',
                    params: { id: item.targetId },
                  });
                }
              }}
            >
              <View style={styles.historyTop}>
                <View style={styles.historyTitleContainer}>
                  <Text style={styles.historyType}>
                    {item.type === 'Event' ? '🎉 EVENT' : '🤝 SOCIAL WORK'}
                  </Text>

                  <Text style={styles.historyTitle}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.historyAmount}>
                  {formatAmount(item.amount)}
                </Text>
              </View>

              <View style={styles.historyBottom}>
                <View>
                  <Text style={styles.historyDate}>
                    📅 {formatDate(item.date)}
                  </Text>

                  {item.location ? (
                    <Text style={styles.historyLocation}>
                      📍 {item.location}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${getStatusColor(item.paymentStatus)}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(item.paymentStatus) },
                    ]}
                  >
                    {getStatusLabel(item.paymentStatus)}
                  </Text>
                </View>
              </View>
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
  scrollContent: {
    paddingBottom: 35,
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 65,
    paddingBottom: 30,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },
  subtitle: {
    color: '#DCE8F3',
    fontSize: 14,
    marginTop: 7,
  },
  content: {
    padding: 18,
  },
  sectionTitle: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: '#F0E8DC',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 27,
    marginBottom: 8,
  },
  statNumber: {
    color: '#123B63',
    fontSize: 27,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: '#D9EBDD',
    marginBottom: 12,
  },
  amountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E9F7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  amountEmoji: {
    fontSize: 23,
  },
  amountDetails: {
    flex: 1,
  },
  amountLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  amountValue: {
    color: '#16834A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  amountNote: {
    color: '#8A9A8E',
    fontSize: 11,
    marginTop: 3,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: '#F3E3C5',
    marginBottom: 28,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF4DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pendingLabel: {
    color: '#8A6A32',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingValue: {
    color: '#D18A18',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  historyCount: {
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  historyTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  historyType: {
    color: '#E87532',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  historyTitle: {
    color: '#123B63',
    fontSize: 16,
    fontWeight: '900',
  },
  historyAmount: {
    color: '#16834A',
    fontSize: 15,
    fontWeight: '900',
  },
  historyBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1ECE5',
    paddingTop: 12,
  },
  historyDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  historyLocation: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: '#7B8794',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 13,
  },
});
