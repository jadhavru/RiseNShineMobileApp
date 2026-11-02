
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
type MemberProfile = {
  full_name: string;
  mobile: string;
  member_id: string | null;
  status: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, mobile, member_id, status')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (isActive) {
          setProfile(data as MemberProfile);
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

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>♙</Text>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>
        Your Rise N Shine membership
      </Text>

      <View style={styles.card}>
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
        <Text style={styles.status}>{profile.status.toUpperCase()}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    padding: 24,
    justifyContent: 'center',
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
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#F0E8DC',
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
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
