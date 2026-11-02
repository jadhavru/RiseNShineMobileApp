
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -18,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    let isActive = true;

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!isActive) return;

        if (data.session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', data.session.user.id)
            .single();

          if (error || profileError) {
            throw profileError || error;
          }

          if (!isActive) return;

          if (profile.status === 'approved') {
            router.replace('/(tabs)');
            return;
          }

          await supabase.auth.signOut();

          if (!isActive) return;
        }

        router.replace('/login');
      } catch (error) {
        console.error('Session check failed:', error);

        await supabase.auth.signOut();

        if (isActive) {
          router.replace('/login');
        }
      }
    }, 5000);

    return () => {
      isActive = false;
      clearTimeout(timer);
      floatAnim.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sloganContainer,
          {
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [25, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.sloganOne}>
          Together we grow.
        </Text>

        <Text style={styles.sloganTwo}>
          Together we shine.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.footer}>
          UNITY  •  SERVICE  •  HUMANITY
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  topCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFE8B5',
    top: -150,
    right: -100,
  },

  bottomCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#DDF5E9',
    bottom: -140,
    left: -100,
  },

  logoContainer: {
    width: '100%',
    alignItems: 'center',
  },

  logo: {
    width: '100%',
    height: 300,
  },

  sloganContainer: {
    alignItems: 'center',
    marginTop: 15,
  },

  sloganOne: {
    fontSize: 27,
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: 'serif',
    color: '#174A78',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  sloganTwo: {
    fontSize: 29,
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: 'serif',
    color: '#E66B20',
    marginTop: 8,
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  divider: {
    width: 65,
    height: 4,
    backgroundColor: '#F5B52E',
    borderRadius: 5,
    marginTop: 25,
    marginBottom: 15,
  },

  footer: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 2,
  },
});
