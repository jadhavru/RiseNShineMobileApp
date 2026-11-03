import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Contribution = {
  id: string;
  member_id: string | null;
  amount: number;
  paid_at: string;
};

type Member = {
  id: string;
  full_name: string;
};

export default function AllContributionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Contribution[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributions();
  }, [id]);

  const loadContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('event_contributions')
        .select('id, member_id, amount, paid_at')
        .eq('event_id', id)
        .eq('payment_status', 'verified')
        .order('paid_at', { ascending: false });

      if (error) throw error;

      const contributions = data || [];
      setItems(contributions);

      const memberIds = [
        ...new Set(
          contributions
            .map(item => item.member_id)
            .filter((value): value is string => value !== null)
        ),
      ];

      if (memberIds.length > 0) {
        const { data: members, error: memberError } = await supabase
          .from('approved_member_directory')
          .select('id, full_name')
          .in('id', memberIds);

        if (memberError) throw memberError;

        const nameMap: Record<string, string> = {};
        (members || []).forEach((member: Member) => {
          nameMap[member.id] = member.full_name;
        });

        setNames(nameMap);
      }
    } catch (error: any) {
      console.log('Contribution Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Contributions</Text>
        <Text style={styles.subtitle}>Verified Member Contributions</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Total Collected</Text>
          <Text style={styles.total}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.label}>
            {items.length} Contributions
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No verified contributions yet.</Text>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.name}>
                {item.member_id
                  ? names[item.member_id] || 'Member name unavailable'
                  : 'Anonymous Contributor'}
              </Text>
              <Text style={styles.amount}>
                ₹{Number(item.amount).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.date}>
                {new Date(item.paid_at).toLocaleDateString('en-IN')}
              </Text>
            </View>
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
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  backText: {
    color: '#123B63',
    fontWeight: '800',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F5C49E',
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  label: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
  },
  total: {
    color: '#16865B',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 8,
  },
  name: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },
  amount: {
    color: '#E87532',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 8,
  },
  date: {
    color: '#718096',
    marginTop: 6,
  },
  empty: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 25,
  },
});