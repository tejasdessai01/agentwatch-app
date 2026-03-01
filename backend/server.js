const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

app.use(express.json()); // Allow JSON body parsing
// Serve Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Store active agents in memory (for MVP)
let activeAgents = {};
// Store shared sessions (snapshots)
let sharedSessions = {}; 

const API_KEY = process.env.AGENTWATCH_API_KEY || "test-key-123"; 

console.log("🔒 ClawSight Server Starting...");
console.log(`🔑 Master API Key: ${API_KEY}`);

// --- PUBLIC API ENDPOINTS ---

// Create a Share Link (Snapshot)
app.post('/api/share', (req, res) => {
  const { agentId } = req.body;
  if (!agentId || !activeAgents[agentId]) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const shareId = uuidv4().slice(0, 8); // Short ID
  sharedSessions[shareId] = JSON.parse(JSON.stringify(activeAgents[agentId])); // Deep copy snapshot
  sharedSessions[shareId].timestamp = Date.now();
  
  // Remove sensitive info if any (none currently, but good practice)
  
  console.log(`🔗 Created Share Link: ${shareId} for Agent ${agentId}`);
  res.json({ shareId, url: `${req.protocol}://${req.get('host')}/share.html?id=${shareId}` });
});

// Get Shared Session Data
app.get('/api/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  const session = sharedSessions[shareId];
  
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired" });
  }
  
  res.json(session);
});

// --- REALTIME SOCKETS ---

// Middleware for Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === API_KEY) {
    next();
  } else {
    next(new Error("Unauthorized"));
  }
});

io.on('connection', (socket) => {
  console.log('✅ Client Connected:', socket.id);

  // Send initial state
  socket.emit('init', activeAgents);

  socket.on('register-agent', (agent) => {
    if (!activeAgents[agent.id]) {
      activeAgents[agent.id] = { 
        ...agent, 
        lastHeartbeat: Date.now(),
        status: 'idle',
        logs: [],
        metrics: { cost: 0, tokens: 0 }
      };
    } else {
      activeAgents[agent.id].lastHeartbeat = Date.now();
      activeAgents[agent.id].status = agent.status || activeAgents[agent.id].status;
    }
    io.emit('agent-update', activeAgents[agent.id]);
  });

  socket.on('agent-log', (data) => {
    if (!activeAgents[data.id]) return;

    const agent = activeAgents[data.id];
    agent.lastHeartbeat = Date.now();
    agent.status = data.status || agent.status;
    
    // Append log (keep last 50)
    if (data.message) {
      agent.logs.push({ timestamp: Date.now(), message: data.message });
      if (agent.logs.length > 50) agent.logs.shift();
    }

    // Update metrics
    if (data.metrics) {
      agent.metrics = { ...agent.metrics, ...data.metrics };
    }

    io.emit('agent-update', agent);
  });

  socket.on('kill-agent', (agentId) => {
    console.log(`💀 Kill Command issued for: ${agentId}`);
    io.emit('kill-signal', agentId);
    if (activeAgents[agentId]) {
      activeAgents[agentId].status = 'killed';
      io.emit('agent-update', activeAgents[agentId]);
    }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 ClawSight Backend running on port ${PORT}`);
});
