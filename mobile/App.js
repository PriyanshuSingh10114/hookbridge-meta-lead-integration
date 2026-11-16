import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LeadsDashboardScreen from './src/screens/LeadsDashboardScreen';

export default function App() {
  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />
      <LeadsDashboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A'
  }
});

