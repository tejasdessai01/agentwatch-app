const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Store active agents in memory (for MVP)
// In production, use Redis/Postgres
let activeAgents = {};
const API_KEY = process.env.AGENTWATCH_API_KEY || "test-key-123"; 

console.log("🔒 ClawSight Server Starting...");
console.log(`🔑 Master API Key: ${API_KEY}`);

// Middleware for Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === API_KEY) {
    next();
  } else {
    // console.log(`🚫 Unauthorized connection attempt: ${socket.id}`);
    next(new Error("Unauthorized"));
  }
});

io.on('connection', (socket) => {
  console.log('✅ Client Connected:', socket.id);

  // Send initial state
  socket.emit('init', activeAgents);

  socket.on('register-agent', (agent) => {
    // console.log(`🤖 Agent Registered: ${agent.name} (${agent.id})`);
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
    // data: { id, message, status, metrics }
    if (!activeAgents[data.id]) return;

    const agent = activeAgents[data.id];
    agent.lastHeartbeat = Date.now();
    agent.status = data.status || agent.status;
    
    // Append log (keep last 50)
    if (data.message) {
      agent.logs.push({ timestamp: Date.now(), message: data.message });
      if (agent.logs.length > 50) agent.logs.shift();
    }

    // Update metrics (cumulative)
    if (data.metrics) {
      // If client sends absolute value, use it. If not, handle delta logic on client side.
      // For now, we assume client sends total or update.
      // To support simple "add 5 tokens", we'd need logic here.
      // But our stress test handles accumulation.
      agent.metrics = { ...agent.metrics, ...data.metrics };
    }

    io.emit('agent-update', agent);
  });

  socket.on('kill-agent', (agentId) => {
    console.log(`💀 Kill Command issued for: ${agentId}`);
    // Broadcast kill command to specific agent (if connected via socket room)
    io.emit('kill-signal', agentId);
    
    if (activeAgents[agentId]) {
      activeAgents[agentId].status = 'killed';
      io.emit('agent-update', activeAgents[agentId]);
    }
  });

  socket.on('disconnect', () => {
    // console.log('❌ Client Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 ClawSight Backend running on port ${PORT}`);
});
