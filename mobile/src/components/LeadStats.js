import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../utils/date';

export default function LeadStats({ totalLeads, latestLeadTime }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL LEADS</Text>
        <Text style={styles.value}>{totalLeads}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>LATEST SUBMISSION</Text>
        <Text style={styles.valueSmall}>{formatRelativeTime(latestLeadTime)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 12,
    gap: 12
  },
  card: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center'
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  valueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 4
  }
});
