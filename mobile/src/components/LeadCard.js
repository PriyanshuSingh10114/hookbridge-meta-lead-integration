import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatLeadDate } from '../utils/date';
import { updateLeadStatus } from '../services/api';

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

  const [status, setStatus] = useState(lead.status || 'draft');
  const [updating, setUpdating] = useState(false);

  const toggleStatus = async () => {
    const next = status === 'active' ? 'draft' : 'active';
    setUpdating(true);

    try {
      const targetId = leadId || lead._id || lead.id;
      const response = await updateLeadStatus(targetId, next);
      if (response && response.data && response.data.status) {
        setStatus(response.data.status);
      } else {
        setStatus(next);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.card}>
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

      <View style={styles.detailsContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <TouchableOpacity
            onPress={toggleStatus}
            disabled={updating}
            style={[
              styles.statusButton,
              {
                backgroundColor: status === 'active' ? '#10B981' : '#64748B',
                opacity: updating ? 0.6 : 1
              }
            ]}
          >
            <Text style={styles.statusButtonText}>
              {updating ? 'Updating...' : status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue} numberOfLines={1} selectable>
            {email || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue} selectable>
            {phone || 'N/A'}
          </Text>
        </View>
      </View>

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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  testBadge: {
    backgroundColor: '#D97706',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  testBadgeText: {
    color: '#FFFBEB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  detailsContainer: {
    marginBottom: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  infoLabel: {
    width: 60,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500'
  },
  statusButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B'
  },
  metaIdText: {
    fontSize: 10,
    color: '#475569',
    fontFamily: 'monospace'
  }
});
