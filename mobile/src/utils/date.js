const formatLeadDate = timestamp => {
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'Recently';
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}`;
};

const formatRelativeTime = timestamp => {
  if (!timestamp) return 'None yet';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

module.exports = {
  formatLeadDate,
  formatRelativeTime
};
