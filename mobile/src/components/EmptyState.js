import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>📡</Text>
      </View>
      <Text style={styles.title}>Awaiting Meta Leads</Text>
      <Text style={styles.description}>
        Submit a test lead via Meta Lead Ads Testing Tool.
      </Text>
      <View style={styles.hintBox}>
        <Text style={styles.hintStep}>1. Webhook receives leadgen notification</Text>
        <Text style={styles.hintStep}>2. Backend retrieves lead from Graph API</Text>
        <Text style={styles.hintStep}>3. Stored in MongoDB & broadcast via Socket</Text>
        <Text style={styles.hintStep}>4. App automatically updates instantly</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  iconText: {
    fontSize: 28
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  hintBox: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6'
  },
  hintStep: {
    fontSize: 12,
    color: '#CBD5E1',
    marginVertical: 2,
    fontWeight: '500'
  }
});
