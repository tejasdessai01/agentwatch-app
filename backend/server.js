const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory store for active agents
let agents = {};

// Security: API Key Authentication
const API_KEY = process.env.API_KEY || 'default-insecure-key'; // MUST set this in production!

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === API_KEY) {
    next();
  } else {
    console.log(`[Security] Rejected connection attempt with invalid token: ${token}`);
    next(new Error("Authentication error: Invalid API Key"));
  }
});

io.on('connection', (socket) => {
  console.log(`[Security] Authenticated client connected: ${socket.id}`);
  
  // Send current state on connect
  socket.emit('init', agents);

  // Dashboard listens for 'kill' command
  socket.on('kill-agent', (agentId) => {
    console.log(`Kill command received for ${agentId}`);
    io.emit('kill-signal', agentId); // Broadcast to all connected clients (including the agent)
  });

  // Agent connects and registers
  socket.on('register-agent', (data) => {
    const { id, name, status } = data;
    agents[id] = { id, name, status, logs: [], lastSeen: Date.now() };
    io.emit('agent-update', agents[id]);
    console.log(`Agent registered: ${name} (${id})`);
  });

  // Agent sends logs/status
  socket.on('agent-log', (data) => {
    const { id, message, status } = data;
    if (agents[id]) {
      agents[id].status = status || agents[id].status;
      agents[id].logs.push({ timestamp: Date.now(), message });
      agents[id].lastSeen = Date.now();
      // Keep logs manageable
      if (agents[id].logs.length > 50) agents[id].logs.shift();
      
      io.emit('agent-update', agents[id]);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API for simple status check
app.get('/status', (req, res) => {
  res.json({ status: 'ok', agents: Object.keys(agents).length });
});

const fs = require('fs');

// Read the HTML file once on startup
const indexPath = path.resolve(__dirname, '../frontend/index.html');
let indexHtml = '';
try {
  indexHtml = fs.readFileSync(indexPath, 'utf8');
  console.log('Dashboard HTML loaded successfully from:', indexPath);
} catch (err) {
  console.error('CRITICAL ERROR: Could not read index.html from:', indexPath);
  console.error(err);
  indexHtml = '<h1>Error: Could not load dashboard HTML. Check server logs.</h1>';
}

// Serve the frontend dashboard
app.get('/', (req, res) => {
  res.send(indexHtml);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`AgentWatch Server running on port ${PORT}`);
});
