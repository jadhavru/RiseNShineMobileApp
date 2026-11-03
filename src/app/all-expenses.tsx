
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

type Expense = {
  id: string;
  expense_title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
};

export default function AllExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
const [totalCollected, setTotalCollected] = useState(0);
  useEffect(() => {
    loadExpenses();
  }, [id]);

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('event_expenses')
        .select('id, expense_title, amount, expense_date, notes')
        .eq('event_id', id)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      setItems((data || []) as Expense[]);
const { data: contributions, error: contributionError } = await supabase
  .from('event_contributions')
  .select('amount')
  .eq('event_id', id)
  .eq('payment_status', 'verified');

if (contributionError) throw contributionError;

const collected = (contributions || []).reduce(
  (sum, item) => sum + Number(item.amount),
  0
);

setTotalCollected(collected);

    } catch (error: any) {
      console.log('Expenses Error:', error.message);
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>All Expenses</Text>
        <Text style={styles.subtitle}>Event Expense Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Total Expenses</Text>
          <Text style={styles.total}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.label}>
            {items.length} Expense Records
          </Text>
        </View>
<View style={styles.card}>
  <Text style={styles.label}>Remaining Balance</Text>
  <Text style={styles.balance}>
    ₹{(totalCollected - total).toLocaleString('en-IN')}
  </Text>
  <Text style={styles.label}>
    Total Collection - Total Expenses
  </Text>
</View>
        {loading ? (
          <ActivityIndicator size="large" color="#E87532" />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No expenses recorded yet.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.name}>{item.expense_title}</Text>

              <Text style={styles.amount}>
                ₹{Number(item.amount).toLocaleString('en-IN')}
              </Text>

              <Text style={styles.date}>
                {new Date(item.expense_date).toLocaleDateString('en-IN')}
              </Text>

              {item.notes ? (
                <Text style={styles.notes}>{item.notes}</Text>
              ) : null}
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
    color: '#C0392B',
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
  notes: {
    color: '#718096',
    marginTop: 8,
    fontSize: 13,
  },
  empty: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 25,
  },
  balance: {
  color: '#16865B',
  fontSize: 28,
  fontWeight: '800',
  marginVertical: 8,
},
});
