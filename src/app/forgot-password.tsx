
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const registeredEmail = email.trim();

    if (!registeredEmail) {
      alert('Please enter your registered email.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(registeredEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const redirectUrl =
        Platform.OS === 'web'
          ? `${window.location.origin}/reset-password`
          : 'risenshinemobile://reset-password';

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          registeredEmail,
          {
            redirectTo: redirectUrl,
          }
        );

      if (error) throw error;

      alert(
        'Password reset link sent! Please check your email.'
      );
    } catch (error: any) {
      alert(error.message || 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password?</Text>

        <Text style={styles.subtitle}>
          Enter your registered email address.
          We will send you a password reset link.
        </Text>

        <Text style={styles.label}>Registered Email</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9AA6B2"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9EE',
    justifyContent: 'center',
  },
  content: {
    padding: 25,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#174A78',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#174A78',
    marginBottom: 9,
  },
  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF1',
    borderRadius: 16,
    paddingHorizontal: 17,
    fontSize: 15,
    color: '#173B68',
  },
  button: {
    height: 57,
    backgroundColor: '#246BCE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 27,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 25,
  },
  backText: {
    color: '#246BCE',
    fontSize: 14,
    fontWeight: '700',
  },
});
