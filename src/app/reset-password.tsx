
import * as ExpoLinking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type RecoveryData = {
  code: string;
  accessToken: string;
  refreshToken: string;
  type: string;
  tokenHash: string;
  error: string;
};

export default function ResetPasswordScreen() {
  const incomingUrl = ExpoLinking.useLinkingURL();

  const recoveryTasks = useRef(
    new Map<string, Promise<void>>()
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Extract authentication information from the complete URL.
  const parseRecoveryUrl = (url: string): RecoveryData => {
    const parsedUrl = new URL(url);

    const queryParams = parsedUrl.searchParams;

    const hashParams = new URLSearchParams(
      parsedUrl.hash.replace(/^#/, '')
    );

    const getParam = (key: string): string => {
      return (
        queryParams.get(key) ||
        hashParams.get(key) ||
        ''
      );
    };

    return {
      code: getParam('code'),
      accessToken: getParam('access_token'),
      refreshToken: getParam('refresh_token'),
      type: getParam('type'),
      tokenHash: getParam('token_hash'),
      error:
        getParam('error_description') ||
        getParam('error') ||
        '',
    };
  };

  // Verify recovery link and create Supabase session.
  const verifyRecoveryLink = async (
    url: string
  ): Promise<void> => {
    const recovery = parseRecoveryUrl(url);

    if (recovery.error) {
      throw new Error(recovery.error);
    }

    // PKCE recovery flow.
    if (recovery.code) {
      const { error } =
        await supabase.auth.exchangeCodeForSession(
          recovery.code
        );

      if (error) {
        throw error;
      }

      return;
    }

    // Token hash recovery flow.
    if (recovery.tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: recovery.tokenHash,
        type: 'recovery',
      });

      if (error) {
        throw error;
      }

      return;
    }

    // Implicit token recovery flow.
    if (
      recovery.accessToken &&
      recovery.refreshToken &&
      recovery.type === 'recovery'
    ) {
      const { error } = await supabase.auth.setSession({
        access_token: recovery.accessToken,
        refresh_token: recovery.refreshToken,
      });

      if (error) {
        throw error;
      }

      return;
    }

    throw new Error(
      'Reset link not found. Please request a new link.'
    );
  };

  useEffect(() => {
    let mounted = true;

    const initializeRecovery = async () => {
      try {
        setChecking(true);
        setSessionReady(false);
        setErrorMessage('');

        let resetUrl: string | null = null;

        // On web, use the complete browser URL.
        if (Platform.OS === 'web') {
          resetUrl = window.location.href;
        } else {
          // On Android and iOS, use the incoming deep link.
          resetUrl =
            incomingUrl ??
            (await ExpoLinking.getInitialURL()) ??
            null;
        }

        if (!resetUrl) {
          throw new Error(
            'Reset link not found. Please request a new link.'
          );
        }

        // Reuse an existing verification task if React runs
        // the effect more than once for the same URL.
        let recoveryTask =
          recoveryTasks.current.get(resetUrl);

        if (!recoveryTask) {
          recoveryTask = verifyRecoveryLink(resetUrl);

          recoveryTasks.current.set(
            resetUrl,
            recoveryTask
          );

          recoveryTask.catch(() => {
            if (
              recoveryTasks.current.get(resetUrl) ===
              recoveryTask
            ) {
              recoveryTasks.current.delete(resetUrl);
            }
          });
        }

        await recoveryTask;

        if (mounted) {
          setSessionReady(true);
          setErrorMessage('');
        }
      } catch (error: any) {
        if (mounted) {
          setSessionReady(false);

          setErrorMessage(
            error?.message ||
              'Unable to verify reset link.'
          );
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    void initializeRecovery();

    return () => {
      mounted = false;
    };
  }, [incomingUrl]);

  // Show messages on web and mobile.
  const showMessage = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Rise N Shine', message);
    }
  };

  // Update user's password.
  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showMessage(
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      showMessage(
        'Password updated successfully! Please login again.'
      );

      await supabase.auth.signOut();

      router.replace('/login');
    } catch (error: any) {
      showMessage(
        error?.message || 'Password update failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading screen.
  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#246BCE"
        />

        <Text style={styles.subtitle}>
          Verifying reset link...
        </Text>
      </View>
    );
  }

  // Invalid or expired link screen.
  if (!sessionReady) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            Reset Link Error
          </Text>

          <Text style={styles.subtitle}>
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.replace('/forgot-password')
            }
          >
            <Text style={styles.buttonText}>
              REQUEST NEW LINK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // New password screen.

return (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>
        Reset Password
      </Text>

      <Text style={styles.subtitle}>
        Enter your new password below.
      </Text>

      <Text style={styles.label}>
        New Password
      </Text>

      <View style={styles.passwordField}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter new password"
          placeholderTextColor="#9AA6B2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.showPasswordButton}
        >
          <Text style={styles.showPasswordText}>
            {showPassword ? '🙈 Hide' : '👁 Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>
        Confirm Password
      </Text>

      <View style={styles.passwordField}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm new password"
          placeholderTextColor="#9AA6B2"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
          style={styles.showPasswordButton}
        >
          <Text style={styles.showPasswordText}>
            {showConfirmPassword ? '🙈 Hide' : '👁 Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading && { opacity: 0.6 },
        ]}
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'UPDATING...'
            : 'UPDATE PASSWORD'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

}

// Styles.
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
  passwordField: {
  height: 56,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E4EAF1',
  borderRadius: 16,
  paddingHorizontal: 14,
  flexDirection: 'row',
  alignItems: 'center',
},

passwordInput: {
  flex: 1,
  height: '100%',
  fontSize: 15,
  color: '#173B68',
},

showPasswordButton: {
  paddingLeft: 10,
  paddingVertical: 10,
},

showPasswordText: {
  color: '#246BCE',
  fontSize: 13,
  fontWeight: '700',
},
});
