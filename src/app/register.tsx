
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Join Our Family!</Text>
        <Text style={styles.subtitle}>
          Become a part of Rise N Shine
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#9AA6B2"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10 digit mobile number"
            placeholderTextColor="#9AA6B2"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9AA6B2"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Enter your address"
            placeholderTextColor="#9AA6B2"
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create password"
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

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#9AA6B2"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>
<View style={styles.loginRow}>
  <Text style={styles.loginText}>Already a Member? </Text>
  <TouchableOpacity onPress={() => router.replace('/login')}>
    <Text style={styles.loginLink}>Login Here</Text>
  </TouchableOpacity>
</View>
          <Text style={styles.note}>
            Your registration will be sent to Admin for approval.
          </Text>
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
  padding: 20,
  paddingTop: 20,
},
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#174A78',
    textAlign: 'center',
  },
 subtitle: {
  fontSize: 13,
  color: '#718096',
  textAlign: 'center',
  marginTop: 5,
  marginBottom: 12,
},
  form: {
    width: '100%',
  },
label: {
  fontSize: 13,
  fontWeight: '700',
  color: '#174A78',
  marginBottom: 5,
  marginTop: 9,
},
input: {
  minHeight: 46,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E4EAF1',
  borderRadius: 12,
  paddingHorizontal: 14,
  fontSize: 14,
  color: '#173B68',
},
  addressInput: {
    height: 85,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  passwordBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF1',
    borderRadius: 15,
    paddingHorizontal: 16,
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
  registerButton: {
    height: 56,
    backgroundColor: '#246BCE',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    elevation: 5,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  note: {
    color: '#718096',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 19,
  },
  footer: {
    color: '#8293A8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  loginRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 18,
},
loginText: {
  color: '#718096',
  fontSize: 14,
},
loginLink: {
  color: '#E66B20',
  fontSize: 14,
  fontWeight: '800',
},
});
