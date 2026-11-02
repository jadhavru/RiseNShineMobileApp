import { ScrollView, StyleSheet, Text, View } from 'react-native';

const activities = [
  {
    icon: '📅',
    title: 'Upcoming Events',
    description: 'Explore upcoming programs, celebrations and community events.',
  },
  {
    icon: '🤝',
    title: 'Social Work',
    description: 'Discover our social initiatives and community service activities.',
  },
  {
    icon: '🏆',
    title: 'Sports Activities',
    description: 'Join sports events, competitions and team activities.',
  },
  {
    icon: '🖼️',
    title: 'Gallery',
    description: 'View photos and videos of our memorable moments.',
  },
];

export default function ActivitiesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Our Activities</Text>
        <Text style={styles.subtitle}>
          Together we participate, contribute and grow.
        </Text>
      </View>

      <View style={styles.content}>
        {activities.map((item, index) => (
          <View style={styles.card} key={index}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </View>
        ))}
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
    paddingTop: 65,
    paddingHorizontal: 24,
    paddingBottom: 35,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  icon: {
    fontSize: 30,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: '#718096',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  arrow: {
    color: '#E87532',
    fontSize: 28,
    marginLeft: 8,
  },
});