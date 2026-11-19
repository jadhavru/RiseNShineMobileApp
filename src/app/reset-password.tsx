
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type RecoveryParams = {
  code?: string | string[];
  access_token?: string | string[];
  refresh_token?: string | string[];
  type?: string | string[];
  token_hash?: string | string[];
  error?: string | string[];
  error_description?: string | string[];
};

const getValue = (
  value?: string | string[]
): string => {
  return Array.isArray(value) ? value[0] || '' : value || '';
};

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<RecoveryParams>();

  const routeCode = getValue(params.code);
  const routeAccessToken = getValue(params.access_token);
  const routeRefreshToken = getValue(params.refresh_token);
  const routeType = getValue(params.type);
  const routeTokenHash = getValue(params.token_hash);
  const routeError = getValue(params.error);
  const routeErrorDescription = getValue(params.error_description);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handledLinks = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;

    const setupRecovery = async (url: string) => {
      let recoveryKey = '';

      try {
        const parsedUrl = new URL(url);

        const query = parsedUrl.searchParams;
        const hash = new URLSearchParams(
          parsedUrl.hash.replace(/^#/, '')
        );

        const getParam = (key: string) =>
          query.get(key) || hash.get(key) || '';

        const code = getParam('code');
        const accessToken = getParam('access_token');
        const refreshToken = getParam('refresh_token');
        const type = getParam('type');
        const tokenHash = getParam('token_hash');

        const authError =
          getParam('error_description') ||
          getParam('error');

        recoveryKey = code
          ? `code:${code}`
          : accessToken
          ? `access:${accessToken}`
          : tokenHash
          ? `hash:${tokenHash}`
          : `url:${url}`;

        if (handledLinks.current.has(recoveryKey)) {
          return;
        }

        handledLinks.current.add(recoveryKey);

        if (mounted) {
          setChecking(true);
          setErrorMessage('');
        }

        if (authError) {
          throw new Error(authError);
        }

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) throw error;
        } else if (
          accessToken &&
          refreshToken &&
          type === 'recovery'
        ) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        } else {
          throw new Error(
            'Invalid or expired reset link. Please request a new one.'
          );
        }

        if (mounted) {
          setSessionReady(true);
          setErrorMessage('');
        }
      } catch (error: any) {
        if (mounted) {
          setSessionReady(false);
          setErrorMessage(
            error?.message || 'Unable to verify reset link.'
          );
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    const subscription = Linking.addEventListener(
      'url',
      ({ url }) => {
        void setupRecovery(url);
      }
    );

    const initialize = async () => {
      try {
        const hasRouteParams = Boolean(
          routeCode ||
          routeAccessToken ||
          routeRefreshToken ||
          routeTokenHash ||
          routeError ||
          routeErrorDescription
        );

        if (hasRouteParams) {
          const routeUrl = new URL(
            'risenshinemobile://reset-password'
          );

          if (routeCode) {
            routeUrl.searchParams.set('code', routeCode);
          }

          if (routeAccessToken) {
            routeUrl.searchParams.set(
              'access_token',
              routeAccessToken
            );
          }

          if (routeRefreshToken) {
            routeUrl.searchParams.set(
              'refresh_token',
              routeRefreshToken
            );
          }

          if (routeType) {
            routeUrl.searchParams.set('type', routeType);
          }

          if (routeTokenHash) {
            routeUrl.searchParams.set(
              'token_hash',
              routeTokenHash
            );
          }

          if (routeError) {
            routeUrl.searchParams.set('error', routeError);
          }

          if (routeErrorDescription) {
            routeUrl.searchParams.set(
              'error_description',
              routeErrorDescription
            );
          }

          await setupRecovery(routeUrl.toString());
          return;
        }

        let initialUrl: string | null = null;

        if (Platform.OS === 'web') {
          initialUrl = window.location.href;
        } else {
          initialUrl = (await Linking.getInitialURL()) ?? null;
        }

        if (initialUrl) {
          await setupRecovery(initialUrl);
        } else if (mounted) {
          setSessionReady(false);
          setErrorMessage(
            'Reset link not found. Please request a new link.'
          );
          setChecking(false);
        }
      } catch (error: any) {
        if (mounted) {
          setSessionReady(false);
          setErrorMessage(
            error?.message || 'Unable to open reset link.'
          );
          setChecking(false);
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [
    routeCode,
    routeAccessToken,
    routeRefreshToken,
    routeType,
    routeTokenHash,
    routeError,
    routeErrorDescription,
  ]);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Rise N Shine', message);
    }
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.');
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

      if (error) throw error;

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

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#246BCE" />
        <Text style={styles.subtitle}>
          Verifying reset link...
        </Text>
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Reset Link Error</Text>

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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.subtitle}>
          Enter your new password below.
        </Text>

        <Text style={styles.label}>New Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#9AA6B2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>Confirm Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#9AA6B2"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
});
