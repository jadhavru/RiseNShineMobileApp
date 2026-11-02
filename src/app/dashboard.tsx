import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const COLORS = {
  navy: '#123B63',
  orange: '#E87532',
  cream: '#FFF9F0',
  white: '#FFFFFF',
  muted: '#8291A3',
  green: '#DDF2E5',
  blue: '#E2EDFA',
  peach: '#FCE8DC',
  purple: '#EEE8FA',
};

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>WELCOME TO</Text>
              <Text style={styles.brand}>Rise N Shine</Text>
            </View>

            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tagline}>
            Together we grow. Together we shine.
          </Text>

          <View style={styles.welcomeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeSmall}>LET'S MAKE A DIFFERENCE</Text>
              <Text style={styles.welcomeTitle}>
                Together, we can{'\n'}shine brighter!
              </Text>
              <Text style={styles.welcomeDesc}>
                Every small action creates a better tomorrow.
              </Text>
            </View>
            <Text style={styles.welcomeEmoji}>🌟</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Explore Activities</Text>
            <Text style={styles.sectionSub}>Be a part of something good</Text>
          </View>

          <View style={styles.grid}>
            <TouchableOpacity style={[styles.activityCard, { backgroundColor: COLORS.blue }]}>
              <Text style={styles.activityIcon}>📅</Text>
              <Text style={styles.activityTitle}>Upcoming Events</Text>
              <Text style={styles.activityDesc}>What's happening next?</Text>
              <Text style={styles.arrow}>Explore →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.activityCard, { backgroundColor: COLORS.green }]}>
              <Text style={styles.activityIcon}>🤝</Text>
              <Text style={styles.activityTitle}>Social Work</Text>
              <Text style={styles.activityDesc}>Serve and support others</Text>
              <Text style={styles.arrow}>Explore →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.activityCard, { backgroundColor: COLORS.peach }]}>
              <Text style={styles.activityIcon}>🏆</Text>
              <Text style={styles.activityTitle}>Sports Activities</Text>
              <Text style={styles.activityDesc}>Play, grow and achieve</Text>
              <Text style={styles.arrow}>Explore →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.activityCard, { backgroundColor: COLORS.purple }]}>
              <Text style={styles.activityIcon}>🖼️</Text>
              <Text style={styles.activityTitle}>Gallery</Text>
              <Text style={styles.activityDesc}>Memories and moments</Text>
              <Text style={styles.arrow}>Explore →</Text>
            </TouchableOpacity>
          </View>

          {/* Community Message */}
          <View style={styles.messageCard}>
            <Text style={styles.messageIcon}>💙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.messageTitle}>One Team. One Family.</Text>
              <Text style={styles.messageDesc}>
                Unity • Service • Humanity
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation - Visual only for now */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>▦</Text>
          <Text style={styles.navText}>Activities</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>♡</Text>
          <Text style={styles.navText}>Contribute</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 35,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#B9D2E9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  brand: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 23,
  },
  tagline: {
    color: '#D9E6F2',
    fontSize: 12,
    marginTop: 8,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF18',
    borderWidth: 1,
    borderColor: '#FFFFFF30',
    borderRadius: 22,
    padding: 18,
    marginTop: 27,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeSmall: {
    color: '#F6C58E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  welcomeTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    marginTop: 8,
  },
  welcomeDesc: {
    color: '#D9E6F2',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginLeft: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 25,
  },
  sectionHeading: {
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    width: '48%',
    minHeight: 174,
    borderRadius: 19,
    padding: 15,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  activityIcon: {
    fontSize: 30,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  activityDesc: {
    fontSize: 11,
    color: '#66788A',
    marginTop: 5,
    lineHeight: 16,
  },
  arrow: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
  },
  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    elevation: 2,
  },
  messageIcon: {
    fontSize: 30,
    marginRight: 13,
  },
  messageTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  messageDesc: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  bottomNav: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#EDF0F3',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    color: COLORS.navy,
    fontSize: 23,
  },
  navActive: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  navText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
});