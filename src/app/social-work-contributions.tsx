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
  donor_name: string | null;
  amount: number;
  contribution_date: string;
  payment_method: string | null;
  payment_status: string;
  member_name: string;
};

export default function SocialWorkContributionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [items, setItems] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributions();
  }, [id]);

  const loadContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('social_work_contributions')
        .select(
          'id, member_id, donor_name, amount, contribution_date, payment_method, payment_status'
        )
        .eq('project_id', id)
        .order('contribution_date', { ascending: false });

      if (error) throw error;

      const contributions = data || [];

      const memberIds = [
        ...new Set(
          contributions
            .map((item) => item.member_id)
            .filter((value): value is string => value !== null)
        ),
      ];

      let memberMap: Record<string, string> = {};

      if (memberIds.length > 0) {
        const { data: members, error: memberError } = await supabase
          .from('approved_member_directory')
          .select('id, full_name')
          .in('id', memberIds);

        if (memberError) throw memberError;

        (members || []).forEach((member) => {
          memberMap[member.id] = member.full_name;
        });
      }

      const formatted = contributions.map((item) => ({
        ...item,
        member_name: item.member_id
          ? memberMap[item.member_id] || 'Member'
          : item.donor_name || 'Anonymous Donor',
      }));

      setItems(formatted);
      setTotal(
        formatted.reduce((sum, item) => sum + Number(item.amount), 0)
      );
    } catch (error) {
      console.log('Social Work Contributions Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
       <TouchableOpacity
               onPress={() => router.back()}
               style={styles.backButton}
             >
               <Text style={styles.backText}>← Back</Text>
             </TouchableOpacity>

        <Text style={styles.heading}>Contributions</Text>
        <Text style={styles.subtitle}>Social Work Contributions</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Contributions</Text>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
          <Text style={styles.count}>{items.length} Records</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>No contributions available.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.memberName}>{item.member_name}</Text>

              <Text style={styles.amount}>
                ₹{Number(item.amount).toFixed(2)}
              </Text>

              <Text style={styles.info}>
                📅 {new Date(item.contribution_date).toLocaleDateString()}
              </Text>

              <Text style={styles.info}>
                Payment: {item.payment_method || 'Not specified'}
              </Text>

              <Text style={styles.status}>
                {item.payment_status.toUpperCase()}
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
    paddingTop: 60,
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
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  totalLabel: {
    color: '#718096',
    fontSize: 14,
  },
  totalAmount: {
    color: '#15965A',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
  },
  count: {
    color: '#718096',
    fontSize: 12,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  memberName: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },
  amount: {
    color: '#15965A',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 8,
  },
  info: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
  },
  status: {
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 30,
  },
});