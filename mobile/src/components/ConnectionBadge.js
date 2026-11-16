import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConnectionBadge({ status, socketId }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Live Socket Connected',
          dotColor: '#10B981',
          bgColor: '#064E3B',
          textColor: '#A7F3D0',
          borderColor: '#059669'
        };
      case 'connecting':
        return {
          label: 'Connecting to Gateway...',
          dotColor: '#F59E0B',
          bgColor: '#78350F',
          textColor: '#FDE68A',
          borderColor: '#D97706'
        };
      case 'disconnected':
      case 'error':
      default:
        return {
          label: 'Disconnected (Retrying...)',
          dotColor: '#EF4444',
          bgColor: '#7F1D1D',
          textColor: '#FECACA',
          borderColor: '#DC2626'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
      {socketId && status === 'connected' ? (
        <Text style={[styles.subtext, { color: config.textColor }]}>
          • ID: {socketId.substring(0, 5)}...
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginVertical: 10
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  text: {
    fontSize: 12,
    fontWeight: '600'
  },
  subtext: {
    fontSize: 11,
    marginLeft: 6,
    opacity: 0.8
  }
});
