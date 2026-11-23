# Socket.IO Real-Time Delivery & Mobile Synchronization

## 1. Gateway Architecture

The Socket.IO gateway provides a persistent bi-directional WebSocket connection between the Node.js backend and mobile clients.

```javascript
const { Server } = require('socket.io');

class SocketService {
  init(httpServer, corsOrigin = '*') {
    this.io = new Server(httpServer, {
      cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', socket => {
      socket.emit('connected', {
        message: 'Connected to HookBridge Real-Time Lead Gateway',
        socketId: socket.id
      });
    });
  }

  broadcastNewLead(lead) {
    if (!this.io) return false;
    this.io.emit('new_lead', {
      event: 'new_lead',
      leadId: lead.leadId,
      lead: lead,
      timestamp: new Date().toISOString()
    });
    return true;
  }
}
```

---

## 2. React Native Client Integration

### Connection Management:
```javascript
import { io } from 'socket.io-client';

const socket = io(SOCKET_SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

### Client-Side Deduplication & Synchronous Refs:
React state updates are batched asynchronously. If multiple socket events fire in rapid succession, checking `leads.some(...)` against state can fail due to race conditions. A mutable `useRef` guarantees $O(1)$ synchronous deduplication:

```javascript
const seenLeadIdsRef = useRef(new Set());

const addLeadSafely = useCallback((incomingLead) => {
  if (!incomingLead?.leadId) return;

  if (seenLeadIdsRef.current.has(incomingLead.leadId)) return;
  seenLeadIdsRef.current.add(incomingLead.leadId);

  setLeads(prevLeads => [incomingLead, ...prevLeads]);
}, []);
```

---

## 3. Disconnection Recovery Pattern

Socket.IO messages are ephemeral. If a client is disconnected when `new_lead` fires:
1. On app launch or socket reconnection, the client invokes `loadLeads()` via REST (`GET /api/leads?page=1&limit=50`).
2. Existing leads are synchronized from MongoDB, and `seenLeadIdsRef` is repopulated.
3. Live socket events resume prepending leads without duplication.
