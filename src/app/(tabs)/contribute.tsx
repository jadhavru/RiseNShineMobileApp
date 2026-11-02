import { StyleSheet, Text, View } from 'react-native';

export default function ContributeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>♡</Text>
      <Text style={styles.title}>Contribute</Text>
      <Text style={styles.subtitle}>
        Your contribution makes a difference.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Community Contributions</Text>
        <Text style={styles.cardText}>
          Support Rise N Shine community activities.
        </Text>
        <Text style={styles.note}>
          Contribution details will appear here.
        </Text>
      </View>
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
  cardTitle: {
    color: '#123B63',
    fontSize: 18,
    fontWeight: '800',
  },
  cardText: {
    color: '#718096',
    marginTop: 10,
    lineHeight: 20,
  },
  note: {
    color: '#E87532',
    marginTop: 16,
    fontWeight: '600',
  },
});