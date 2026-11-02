
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

const handleLogin = async () => {
  if (!email.trim() || !password) {
    alert('Please enter email and password.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.status !== 'approved') {
      await supabase.auth.signOut();
      alert('Your account is pending Admin approval.');
      return;
    }

   router.replace('/');
  } catch (error: any) {
    alert(error.message || 'Login failed.');
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Your Rise N Shine family awaits you
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email / Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email or mobile number"
            placeholderTextColor="#9AA6B2"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#9AA6B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showText}>
                {showPassword ? 'HIDE' : 'SHOW'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={styles.loginButton}
  onPress={handleLogin}
>
  <Text style={styles.loginButtonText}>LOGIN  →</Text>
</TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New Member? </Text>
           <TouchableOpacity onPress={() => router.push('/register')}>
  <Text style={styles.registerLink}>Register Here</Text>
</TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          Together we grow. Together we shine.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9EE',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  logo: {
    width: 210,
    height: 150,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#174A78',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#174A78',
    marginBottom: 9,
    marginTop: 16,
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
    elevation: 2,
  },
  passwordBox: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF1',
    borderRadius: 16,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#173B68',
  },
  showText: {
    color: '#246BCE',
    fontSize: 12,
    fontWeight: '800',
    padding: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 13,
  },
  forgotText: {
    color: '#246BCE',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 57,
    backgroundColor: '#246BCE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 27,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  registerText: {
    color: '#718096',
    fontSize: 14,
  },
  registerLink: {
    color: '#E66B20',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    color: '#8293A8',
    fontSize: 12,
    marginTop: 35,
    textAlign: 'center',
  },
});
