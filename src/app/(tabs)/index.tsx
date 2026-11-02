import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.brand}>RISE N SHINE</Text>
        <Text style={styles.welcome}>Welcome Back! 👋</Text>
        <Text style={styles.subtitle}>Together we grow. Together we shine.</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Our Community</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Upcoming Events</Text>
          <Text style={styles.cardText}>Stay connected with our upcoming events.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤝 Social Work</Text>
          <Text style={styles.cardText}>Small efforts. Big impact. Let's make a difference.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Sports Activities</Text>
          <Text style={styles.cardText}>Explore sports activities and celebrate teamwork.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🖼️ Gallery</Text>
          <Text style={styles.cardText}>Memories and moments from our community.</Text>
        </View>

        <Text style={styles.footer}>ONE TEAM • ONE FAMILY ❤️</Text>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '800',
  },
  cardText: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    color: '#E87532',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 25,
  },
});