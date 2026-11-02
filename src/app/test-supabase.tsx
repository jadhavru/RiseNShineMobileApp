
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    async function checkConnection() {
      const { error } = await supabase.auth.getSession();

      if (error) {
        setStatus('Connection error: ' + error.message);
      } else {
        setStatus('Supabase connected successfully!');
      }
    }

    checkConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9EE',
    padding: 20,
  },
  text: {
    color: '#174A78',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
