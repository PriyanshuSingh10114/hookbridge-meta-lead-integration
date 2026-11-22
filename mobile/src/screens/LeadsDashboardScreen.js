import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';

import Header from '../components/Header';
import ConnectionBadge from '../components/ConnectionBadge';
import LeadStats from '../components/LeadStats';
import LeadCard from '../components/LeadCard';
import EmptyState from '../components/EmptyState';
import apiService from '../services/api';
import socketClient from '../services/socket';

export default function LeadsDashboardScreen() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [socketId, setSocketId] = useState(null);

  const seenLeadIdsRef = useRef(new Set());

  const addLeadSafely = useCallback(incomingLead => {
    if (!incomingLead || !incomingLead.leadId) return;

    if (seenLeadIdsRef.current.has(incomingLead.leadId)) return;
    seenLeadIdsRef.current.add(incomingLead.leadId);

    setLeads(prevLeads => {
      const exists = prevLeads.some(l => l.leadId === incomingLead.leadId);
      if (exists) return prevLeads;
      return [incomingLead, ...prevLeads];
    });
  }, []);

  const loadLeads = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.fetchLeads(1, 50);
      const fetchedLeads = response.data || [];

      if (isRefresh) {
        seenLeadIdsRef.current = new Set(fetchedLeads.map(l => l.leadId).filter(Boolean));
        setLeads(fetchedLeads);
      } else {
        fetchedLeads.forEach(l => {
          if (l.leadId) seenLeadIdsRef.current.add(l.leadId);
        });

        setLeads(prevLeads => {
          const currentSeen = new Set(prevLeads.map(l => l.leadId));
          const newUniqueFromBackend = fetchedLeads.filter(l => !currentSeen.has(l.leadId));
          return [...prevLeads, ...newUniqueFromBackend];
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();

    socketClient.connect({
      onConnect: id => {
        setSocketStatus('connected');
        setSocketId(id);
      },
      onDisconnect: () => {
        setSocketStatus('disconnected');
        setSocketId(null);
      },
      onConnectError: () => {
        setSocketStatus('error');
      },
      onNewLead: payload => {
        if (payload?.lead) {
          addLeadSafely(payload.lead);
        }
      }
    });

    return () => {
      socketClient.disconnect();
    };
  }, [addLeadSafely, loadLeads]);

  const latestLeadTimestamp = leads.length > 0 ? leads[0].submittedAt : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Header />

      <View style={styles.container}>
        <ConnectionBadge status={socketStatus} socketId={socketId} />

        <LeadStats totalLeads={leads.length} latestLeadTime={latestLeadTimestamp} />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadLeads()}>
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loaderText}>Connecting to Lead Gateway...</Text>
          </View>
        ) : (
          <FlatList
            data={leads}
            keyExtractor={item => item.leadId || item._id || String(Math.random())}
            renderItem={({ item }) => <LeadCard lead={item} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadLeads(true)}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8'
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  errorText: {
    color: '#FECACA',
    fontSize: 12,
    flex: 1,
    marginRight: 8
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
