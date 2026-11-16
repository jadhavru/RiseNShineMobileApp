
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type MemberProfile = {
  full_name: string;
  mobile: string;
  member_id: string | null;
  status: string;
};

type Membership = {
  id: string;
  membership_type: 'free' | 'paid';
  billing_period: 'monthly' | 'yearly';
  amount: number;
  payment_status: 'not_required' | 'pending' | 'paid';
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  // Date formatting
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';

    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  // Next payment date = end_date + 1 day
  const getNextPaymentDate = (endDate: string) => {
    if (!endDate) return null;

    const [year, month, day] = endDate.split('T')[0].split('-').map(Number);

    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    const y = nextDate.getUTCFullYear();
    const m = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getUTCDate()).padStart(2, '0');

    return formatDate(`${y}-${m}-${d}`);
  };

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error('Please login again.');
        }

        // Load Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, mobile, member_id, status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (isActive) {
          setProfile(profileData as MemberProfile);
        }

        // Load Latest Membership
        const { data: membershipData, error: membershipError } =
          await supabase
            .from('memberships')
            .select(`
              id,
              membership_type,
              billing_period,
              amount,
              payment_status,
              start_date,
              end_date,
              status
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (membershipError) throw membershipError;

        if (isActive) {
          setMembership(membershipData as Membership | null);
        }

      } catch (error: any) {
        if (isActive) {
          Alert.alert(
            'Profile Error',
            error.message || 'Unable to load profile.'
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E87532" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Profile information could not be loaded.
        </Text>
      </View>
    );
  }

  const nextPaymentDate =
    membership?.membership_type === 'paid' &&
    membership.status === 'active'
      ? getNextPaymentDate(membership.end_date)
      : null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <Text style={styles.icon}>♙</Text>

        <Text style={styles.title}>My Profile</Text>

        <Text style={styles.subtitle}>
          Your Rise N Shine membership
        </Text>
      </View>

      {/* Member Information */}

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Personal Information</Text>

        <Text style={styles.label}>Member Name</Text>
        <Text style={styles.value}>{profile.full_name}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Mobile Number</Text>
        <Text style={styles.value}>{profile.mobile}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Member ID</Text>
        <Text style={styles.value}>
          {profile.member_id || 'Not assigned yet'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Account Status</Text>
        <Text style={styles.status}>
          {profile.status.toUpperCase()}
        </Text>
      </View>

      {/* Membership Information */}

      <View style={styles.membershipCard}>
        <Text style={styles.cardHeading}>
          💳 My Membership
        </Text>

        {!membership ? (
          <Text style={styles.emptyText}>
            No membership information available.
          </Text>
        ) : (
          <>
            <View style={styles.membershipTypeBox}>
              <Text style={styles.label}>Membership Type</Text>

              <Text style={styles.membershipType}>
                {membership.membership_type.toUpperCase()}
              </Text>
            </View>

            {membership.membership_type === 'paid' && (
              <>
                <View style={styles.divider} />

                <Text style={styles.label}>Billing Period</Text>
                <Text style={styles.value}>
                  {membership.billing_period === 'monthly'
                    ? 'Monthly'
                    : 'Yearly'}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Membership Amount</Text>
                <Text style={styles.value}>
                  ₹{Number(membership.amount).toLocaleString('en-IN')}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Payment Status</Text>
                <Text style={styles.paymentStatus}>
                  {membership.payment_status.replace('_', ' ').toUpperCase()}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Membership Start Date</Text>
                <Text style={styles.value}>
                  {formatDate(membership.start_date)}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Membership End Date</Text>
                <Text style={styles.value}>
                  {formatDate(membership.end_date)}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.label}>Next Payment Date</Text>

                {membership.status === 'active' &&
                membership.payment_status === 'paid' ? (
                  <Text style={styles.nextPayment}>
                    📅 {nextPaymentDate}
                  </Text>
                ) : membership.status === 'expired' ? (
                  <Text style={styles.expiredText}>
                    Membership Expired
                  </Text>
                ) : membership.status === 'cancelled' ? (
                  <Text style={styles.expiredText}>
                    Membership Cancelled
                  </Text>
                ) : (
                  <Text style={styles.pendingText}>
                    Payment Pending
                  </Text>
                )}
              </>
            )}

            {membership.membership_type === 'free' && (
              <View style={styles.freeBox}>
                <Text style={styles.freeText}>
                  ✓ No Payment Required
                </Text>
                <Text style={styles.freeSubText}>
                  You are using the Free Membership.
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.label}>Membership Status</Text>

            <Text
              style={[
                styles.membershipStatus,
                membership.status === 'active'
                  ? styles.activeStatus
                  : styles.inactiveStatus,
              ]}
            >
              {membership.status.toUpperCase()}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.footer}>
        Together we grow. Together we shine.
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>LOGOUT</Text>
      </TouchableOpacity>

      <View style={{ height: 25 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: '#123B63',
    marginTop: 12,
    fontWeight: '600',
  },

  errorText: {
    color: '#C0392B',
    textAlign: 'center',
  },

  profileHeader: {
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 10,
    paddingHorizontal: 24,
  },

  icon: {
    color: '#E87532',
    fontSize: 55,
    textAlign: 'center',
  },

  title: {
    color: '#123B63',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  subtitle: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },

  membershipCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },

  cardHeading: {
    color: '#123B63',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 20,
  },

  label: {
    color: '#8291A3',
    fontSize: 12,
    fontWeight: '600',
  },

  value: {
    color: '#123B63',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#EDF0F3',
    marginVertical: 16,
  },

  status: {
    color: '#219653',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  membershipTypeBox: {
    backgroundColor: '#FFF0E5',
    padding: 15,
    borderRadius: 12,
  },

  membershipType: {
    color: '#E87532',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },

  paymentStatus: {
    color: '#219653',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  nextPayment: {
    color: '#E87532',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },

  expiredText: {
    color: '#C0392B',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  pendingText: {
    color: '#D69E2E',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },

  membershipStatus: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 6,
  },

  activeStatus: {
    color: '#219653',
  },

  inactiveStatus: {
    color: '#C0392B',
  },

  freeBox: {
    backgroundColor: '#E8F4ED',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },

  freeText: {
    color: '#238653',
    fontSize: 16,
    fontWeight: '900',
  },

  freeSubText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 6,
  },

  emptyText: {
    color: '#718096',
    fontSize: 13,
  },

  footer: {
    color: '#E87532',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12,
    fontWeight: '700',
  },

  logoutButton: {
    backgroundColor: '#E87532',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
    marginHorizontal: 20,
    alignItems: 'center',
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
