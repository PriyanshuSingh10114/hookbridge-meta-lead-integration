import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatLeadDate } from '../utils/date';

export default function LeadCard({ lead }) {
  const {
    name,
    email,
    phone,
    submittedAt,
    source,
    isTestLead,
    leadId,
    formId
  } = lead;

  return (
    <View style={styles.card}>
      {/* Top Header: Name & Badges */}
      <View style={styles.headerRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name || 'Unnamed Lead'}
          </Text>
        </View>
        <View style={styles.badgeGroup}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>{source || 'Meta Lead Ads'}</Text>
          </View>
          {isTestLead && (
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST LEAD</Text>
            </View>
          )}
        </View>
      </View>

      {/* Contact Details */}
      <View style={styles.detailsContainer}>
        {/* Email */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue} numberOfLines={1} selectable>
            {email || 'N/A'}
          </Text>
        </View>

        {/* Phone */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue} selectable>
            {phone || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Footer: Metadata & Timestamp */}
      <View style={styles.footerRow}>
        <Text style={styles.timestampText}>{formatLeadDate(submittedAt)}</Text>
        <Text style={styles.metaIdText} numberOfLines={1}>
          ID: {leadId ? leadId.substring(0, 10) + '...' : 'N/A'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  nameContainer: {
    flex: 1,
    marginRight: 8
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sourceBadge: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  sourceBadgeText: {
    color: '#EFF6FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  testBadge: {
    backgroundColor: '#D97706',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6
  },
  testBadgeText: {
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '800'
  },
  detailsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3
  },
  infoLabel: {
    width: 55,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500'
  },
  metaIdText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace'
  }
});

