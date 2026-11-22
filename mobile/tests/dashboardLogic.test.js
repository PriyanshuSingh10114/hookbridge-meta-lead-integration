const { formatRelativeTime, formatLeadDate } = require('../src/utils/date');

describe('HookBridge Mobile Leads Logic Tests', () => {
  it('should prevent duplicate lead insertion into state', () => {
    const initialLeads = [
      { leadId: 'lead_001', name: 'John Doe', email: 'john@example.com' }
    ];

    const seenIds = new Set(['lead_001']);

    const addLeadSafely = (currentLeads, incomingLead) => {
      if (seenIds.has(incomingLead.leadId)) return currentLeads;
      seenIds.add(incomingLead.leadId);
      return [incomingLead, ...currentLeads];
    };

    // Attempt to add duplicate
    const duplicateLead = { leadId: 'lead_001', name: 'John Doe Duplicate' };
    const result1 = addLeadSafely(initialLeads, duplicateLead);
    expect(result1.length).toBe(1);
    expect(result1[0].name).toBe('John Doe');

    // Add unique new lead
    const newLead = { leadId: 'lead_002', name: 'Jane Smith', email: 'jane@example.com' };
    const result2 = addLeadSafely(result1, newLead);
    expect(result2.length).toBe(2);
    expect(result2[0].leadId).toBe('lead_002');
  });

  it('should correctly format relative timestamps', () => {
    const now = new Date();
    const tenSecondsAgo = new Date(now.getTime() - 10 * 1000).toISOString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    expect(formatRelativeTime(tenSecondsAgo)).toBe('Just now');
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    expect(formatRelativeTime(null)).toBe('None yet');
  });

  it('should correctly format full lead dates', () => {
    expect(formatLeadDate(null)).toBe('Just now');
    expect(formatLeadDate('invalid-date')).toBe('Recently');
    const validDate = new Date('2026-11-20T10:30:00Z').toISOString();
    expect(formatLeadDate(validDate)).toContain('2026');
  });

  it('should format connection status badge properties correctly', () => {
    const getBadgeConfig = (status) => {
      switch (status) {
        case 'connected':
          return { label: 'Live Socket Connected', color: '#10B981' };
        case 'connecting':
          return { label: 'Connecting to Gateway...', color: '#F59E0B' };
        case 'disconnected':
        default:
          return { label: 'Disconnected (Retrying...)', color: '#EF4444' };
      }
    };

    expect(getBadgeConfig('connected').label).toBe('Live Socket Connected');
    expect(getBadgeConfig('connecting').label).toBe('Connecting to Gateway...');
    expect(getBadgeConfig('disconnected').label).toBe('Disconnected (Retrying...)');
  });
});

