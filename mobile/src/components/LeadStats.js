import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeadStats({ totalLeads, latestLeadTime }) {
  const formatTime = timestamp => {
    if (!timestamp) return 'None yet';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL LEADS</Text>
        <Text style={styles.value}>{totalLeads}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>LATEST SUBMISSION</Text>
        <Text style={styles.valueSmall}>{formatTime(latestLeadTime)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>SYNC MODE</Text>
        <Text style={styles.valueBadge}>REAL-TIME</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 10
  },
  card: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center'
  },
  label: {
    fontSize: 10,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 4
  },
  valueBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    backgroundColor: '#064E3B',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 4
  }
});

