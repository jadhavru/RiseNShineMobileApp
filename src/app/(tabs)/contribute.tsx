
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ContributeScreen() {
  const [loading, setLoading] = useState(true);
  const [eventPaid, setEventPaid] = useState(0);
  const [socialWorkPaid, setSocialWorkPaid] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  const totalPaid = eventPaid + socialWorkPaid;

  useEffect(() => {
    loadMyContributions();
  }, []);

  const loadMyContributions = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('Please sign in again.');
      }

      const [eventResult, socialResult] = await Promise.all([
        supabase
          .from('event_contributions')
          .select('amount, payment_status')
          .eq('member_id', userId),

        supabase
          .from('social_work_contributions')
          .select('amount, payment_status')
          .eq('member_id', userId),
      ]);

      if (eventResult.error) throw eventResult.error;
      if (socialResult.error) throw socialResult.error;

      const eventRecords = eventResult.data || [];
      const socialRecords = socialResult.data || [];

      const eventPaidTotal = eventRecords
        .filter((item) => item.payment_status === 'verified')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const socialPaidTotal = socialRecords
        .filter((item) => item.payment_status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const eventPendingTotal = eventRecords
        .filter((item) => item.payment_status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const socialPendingTotal = socialRecords
        .filter((item) => item.payment_status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      setEventPaid(eventPaidTotal);
      setSocialWorkPaid(socialPaidTotal);
      setPendingPayments(eventPendingTotal + socialPendingTotal);
    } catch (error: any) {
      console.log('My Contributions Error:', error.message);
      Alert.alert(
        'Contributions Error',
        error.message || 'Unable to load your contributions.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E87532" />
        <Text style={styles.loadingText}>Loading Contributions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.icon}>♡</Text>
      <Text style={styles.title}>Contribute</Text>
      <Text style={styles.subtitle}>
        Your contribution makes a difference.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Contributions</Text>

        <Text style={styles.totalAmount}>
          {formatAmount(totalPaid)}
        </Text>
        <Text style={styles.totalLabel}>
          एकूण भरलेली वर्गणी
        </Text>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>
              Event Contributions
            </Text>
            <Text style={styles.summarySubtitle}>
              Verified payments
            </Text>
          </View>
          <Text style={styles.summaryAmount}>
            {formatAmount(eventPaid)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>
              Social Work Contributions
            </Text>
            <Text style={styles.summarySubtitle}>
              Paid contributions
            </Text>
          </View>
          <Text style={styles.summaryAmount}>
            {formatAmount(socialWorkPaid)}
          </Text>
        </View>

        <View style={styles.pendingCard}>
          <View style={styles.summaryInfo}>
            <Text style={styles.pendingTitle}>
              Pending Payments
            </Text>
            <Text style={styles.pendingSubtitle}>
              Awaiting verification
            </Text>
          </View>
          <Text style={styles.pendingAmount}>
            {formatAmount(pendingPayments)}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Together we grow. Together we shine.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    padding: 24,
    paddingTop: 55,
  },
  loader: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#123B63',
    marginTop: 12,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#123B63',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    color: '#E87532',
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    color: '#123B63',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: '800',
  },
  totalAmount: {
    color: '#16865B',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 18,
  },
  totalLabel: {
    color: '#718096',
    fontSize: 14,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF0F3',
    marginVertical: 17,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryInfo: {
    flex: 1,
    paddingRight: 8,
  },
  summaryTitle: {
    color: '#123B63',
    fontSize: 14,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: '#8291A3',
    fontSize: 11,
    marginTop: 4,
  },
  summaryAmount: {
    color: '#16865B',
    fontSize: 19,
    fontWeight: '800',
  },
  pendingCard: {
    backgroundColor: '#FFF5E8',
    borderRadius: 13,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  pendingTitle: {
    color: '#A65B13',
    fontSize: 14,
    fontWeight: '800',
  },
  pendingSubtitle: {
    color: '#B47A3C',
    fontSize: 11,
    marginTop: 4,
  },
  pendingAmount: {
    color: '#D97706',
    fontSize: 19,
    fontWeight: '800',
  },
  footer: {
    color: '#8291A3',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 25,
  },
});
