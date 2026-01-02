# Database Integration Plan for Scoreboard

This document outlines the strategy for adding real-time multi-user functionality to the scoreboard application, enabling multiple people to view and modify the same game simultaneously.

## Overview

The goal is to transform the current client-side-only application into a real-time collaborative tool where users can:
- Create or join game sessions via room codes
- See live updates as other users make changes
- No authentication required - just share a link

## Architecture Options

### Option 1: Firebase Realtime Database (Recommended for MVP)

**Pros:**
- Extremely easy to set up (no backend code needed)
- Built-in real-time synchronization
- Free tier is generous for this use case
- Automatic offline support
- Simple security rules

**Cons:**
- Vendor lock-in to Google
- Data structure must be denormalized (JSON tree)
- Limited query capabilities

**Implementation:**
```javascript
// Firebase config
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "https://your-app.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Listen for changes
const gameRef = ref(db, `games/${gameId}`);
onValue(gameRef, (snapshot) => {
  const data = snapshot.val();
  gameState.fromJSON(data);
});

// Update game state
function syncToFirebase(gameState) {
  update(ref(db, `games/${gameId}`), gameState.toJSON());
}
```

### Option 2: Supabase (PostgreSQL + Realtime)

**Pros:**
- Open source alternative to Firebase
- Full PostgreSQL database (relational)
- Real-time subscriptions built-in
- Better query capabilities
- Can add authentication later if needed

**Cons:**
- Slightly more complex setup than Firebase
- Requires understanding of SQL/tables
- Free tier has limits on concurrent connections

**Implementation:**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// Subscribe to changes
const channel = supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
    (payload) => {
      gameState.fromJSON(payload.new);
    }
  )
  .subscribe();

// Update game
async function syncToSupabase(gameState) {
  await supabase
    .from('games')
    .upsert({ id: gameId, ...gameState.toJSON() });
}
```

### Option 3: Custom WebSocket Server

**Pros:**
- Full control over logic and data
- No external dependencies or costs
- Can optimize for specific use case

**Cons:**
- Must build and maintain backend server
- Need hosting (e.g., Railway, Render, Fly.io)
- More complex to implement
- Must handle scaling, persistence, errors

**Implementation:**
```javascript
// Server (Node.js + Socket.io)
const io = require('socket.io')(3000);
const games = new Map(); // In-memory storage (should use Redis)

io.on('connection', (socket) => {
  socket.on('join_game', (gameId) => {
    socket.join(gameId);
    socket.emit('game_state', games.get(gameId));
  });
  
  socket.on('update_game', (gameId, data) => {
    games.set(gameId, data);
    io.to(gameId).emit('game_state', data);
  });
});

// Client
import io from 'socket.io-client';
const socket = io('https://your-server.com');

socket.emit('join_game', gameId);
socket.on('game_state', (data) => {
  gameState.fromJSON(data);
});
```

## Recommended Approach: Firebase Realtime Database

For the initial implementation, Firebase is the best choice because:
1. Zero backend code required
2. Real-time sync is automatic
3. Free tier covers expected usage
4. Can migrate later if needed

## Data Schema

### Firebase Structure

```
games/
  {gameId}/
    gameMode: "pooch"
    currentRound: 1
    settings: {...}
    players: [
      {
        id: "player_0"
        name: "Alice"
        score: 45
        position: 45
        roundData: {
          "1": { bid: 5, tricks: 5, score: 15 }
          "2": { bid: 4, tricks: 3, score: -2 }
        }
      },
      ...
    ]
    rounds: []
    createdAt: 1704153600000
    lastUpdated: 1704153700000
```

### Supabase Tables (if chosen)

**games table:**
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_mode TEXT NOT NULL,
  current_round INTEGER DEFAULT 1,
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**players table:**
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  round_data JSONB DEFAULT '{}'::jsonb,
  player_order INTEGER NOT NULL
);
```

## Implementation Steps

### 1. Add Firebase SDK

Update `index.html`:
```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
</script>
```

Or install via npm:
```bash
npm install firebase
```

### 2. Create `firebase-sync.js` Module

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push } from 'firebase/database';

let currentGameId = null;
let currentListener = null;

export function initFirebase(config) {
  const app = initializeApp(config);
  return getDatabase(app);
}

export function createGame(db, gameState) {
  const gamesRef = ref(db, 'games');
  const newGameRef = push(gamesRef);
  currentGameId = newGameRef.key;
  
  set(newGameRef, {
    ...gameState.toJSON(),
    createdAt: Date.now(),
    lastUpdated: Date.now()
  });
  
  // Update URL with game ID
  const url = new URL(window.location);
  url.searchParams.set('gameId', currentGameId);
  window.history.pushState({}, '', url);
  
  return currentGameId;
}

export function joinGame(db, gameId, onUpdate) {
  currentGameId = gameId;
  const gameRef = ref(db, `games/${gameId}`);
  
  // Unsubscribe from previous game
  if (currentListener) {
    currentListener();
  }
  
  // Subscribe to changes
  currentListener = onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      onUpdate(data);
    }
  });
  
  return () => currentListener && currentListener();
}

export function updateGame(db, gameState) {
  if (!currentGameId) return;
  
  update(ref(db, `games/${currentGameId}`), {
    ...gameState.toJSON(),
    lastUpdated: Date.now()
  });
}
```

### 3. Modify `script.js` GameState Class

```javascript
class GameState {
  constructor(syncEnabled = false, db = null) {
    // ... existing code ...
    this.syncEnabled = syncEnabled;
    this.db = db;
    this.isRemoteUpdate = false; // Flag to prevent sync loops
  }
  
  notify() {
    this.observers.forEach(callback => callback(this));
    
    if (!this.isRemoteUpdate) {
      if (this.syncEnabled && this.db) {
        // Sync to Firebase
        updateGame(this.db, this);
      } else {
        // Local-only mode
        this.persistState();
      }
    }
  }
  
  fromJSON(data, isRemote = false) {
    this.isRemoteUpdate = isRemote;
    // ... existing fromJSON code ...
    this.isRemoteUpdate = false;
  }
}
```

### 4. Update URL Structure

Add room code parameter:
```
Current: ?game=pooch&players=Alice,Bob&theme=dark
Future:  ?gameId=abc123&room=abc123
```

When `gameId` param exists, join that game instead of loading from localStorage.

### 5. Add UI for Creating/Joining Games

Add to header:
```html
<div class="room-controls">
  <button id="create-room-btn">Create New Game</button>
  <button id="share-link-btn" style="display:none">Share Link</button>
  <span id="room-code" style="display:none"></span>
</div>
```

## Conflict Resolution Strategy

### Last-Write-Wins (Simple)

- Every update includes a timestamp
- Latest timestamp wins
- Firebase/Supabase handle this automatically
- Works well for this use case (low conflict likelihood)

### Operational Transform (Complex, probably overkill)

- Track each operation (add player, update score, etc.)
- Transform operations to resolve conflicts
- Required for Google Docs-level collaboration
- Not necessary for scoreboard app

## Security Rules

### Firebase Rules

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['gameMode', 'players', 'settings'])"
      }
    }
  }
}
```

**Note:** These rules allow anyone to read/write. For production, consider:
- Rate limiting
- Size limits on data
- Validation rules for data structure

### Supabase Row-Level Security

```sql
-- Allow anyone to read games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- Allow anyone to update games (no auth)
CREATE POLICY "Games are editable by everyone"
  ON games FOR UPDATE
  USING (true);
```

## Testing Strategy

1. **Local Testing:**
   - Open two browser windows
   - Create game in window 1
   - Join via URL in window 2
   - Verify changes sync both ways

2. **Network Testing:**
   - Test on different devices/networks
   - Verify offline behavior (should queue updates)
   - Test with slow connections (throttle in DevTools)

3. **Conflict Testing:**
   - Rapidly update same player score from two clients
   - Verify no data loss
   - Check for race conditions

## Monitoring & Maintenance

### Metrics to Track
- Active games (concurrent)
- Database reads/writes (stay within free tier)
- Average game duration
- Number of players per game

### Cleanup Strategy
- Delete games older than 7 days (scheduled function)
- Archive completed games
- Implement game expiration warnings

## Migration Path

### Phase 1: Local Only (Current)
- localStorage + URL params
- No backend required
- Works offline

### Phase 2: Optional Sync
- Add "Enable Multiplayer" button
- Creates Firebase game on-demand
- Falls back to local if offline

### Phase 3: Sync by Default
- All games synced to Firebase
- Local storage as cache only
- Offline mode still works

## Cost Estimates

### Firebase Free Tier
- 1GB storage
- 10GB/month downloads
- 100 simultaneous connections

**Expected usage for 1000 games/month:**
- Storage: ~1MB per game = 1GB for 1000 games ✓
- Reads: ~100 per game session = well within limits ✓
- Connections: ~20 concurrent = within limits ✓

**Verdict:** Should stay free indefinitely for moderate usage

### Supabase Free Tier
- 500MB database
- Unlimited API requests
- 200,000 realtime messages/month

Similar to Firebase, should handle moderate usage on free tier.

## Alternative: Peer-to-Peer (Future Consideration)

Use WebRTC + CRDT (Conflict-free Replicated Data Type):
- No server needed
- True peer-to-peer
- Works offline
- Complex to implement
- Libraries: Yjs, Automerge

This is overkill for MVP but worth considering for v2.

## Recommended Next Steps

1. Create Firebase project (5 minutes)
2. Add Firebase SDK to project (10 minutes)
3. Implement `firebase-sync.js` module (1 hour)
4. Update GameState class for sync (30 minutes)
5. Add "Create Game" / "Join Game" UI (1 hour)
6. Test with multiple clients (30 minutes)
7. Deploy and share links (15 minutes)

**Total estimated time: 4 hours**

## Example User Flow

### Creating a Game
1. User opens scoreboard
2. Clicks "Create Multiplayer Game"
3. Game is created in Firebase
4. URL updates: `?gameId=abc123`
5. User shares URL with friends
6. Everyone sees real-time updates

### Joining a Game
1. User opens shared link
2. App detects `gameId` parameter
3. Joins Firebase game room
4. Downloads current game state
5. All changes sync automatically

## Code Integration Points

### Current Code
```javascript
// script.js - current
gameState.updatePlayerScore(playerId, delta);
// → Updates local state
// → Saves to localStorage
// → Updates URL params
```

### With Firebase
```javascript
// script.js - with sync
gameState.updatePlayerScore(playerId, delta);
// → Updates local state
// → Syncs to Firebase (if enabled)
// → Firebase broadcasts to all clients
// → Other clients receive update
// → Their local state updates
```

Minimal code changes required - mainly in GameState class notify() method.

## Conclusion

Firebase Realtime Database is the recommended solution for adding multiplayer functionality to the scoreboard. It provides:
- Real-time synchronization with minimal code
- Free tier sufficient for expected usage
- Simple migration path from current architecture
- No backend server maintenance required

The entire integration can be completed in approximately 4 hours and will enable true collaborative gameplay.

