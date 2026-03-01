const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../frontend')));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let activeAgents = {};
let sharedSessions = {}; 
const API_KEY = process.env.CLAWSIGHT_API_KEY || process.env.AGENTWATCH_API_KEY || "test-key-123"; 

console.log("🔒 ClawSight Server Starting...");
// console.log(`🔑 Master API Key: ${API_KEY}`); // Redacted for security

// --- API ---
app.post('/api/share', (req, res) => {
  const { agentId } = req.body;
  if (!agentId || !activeAgents[agentId]) return res.status(404).json({ error: "Agent not found" });
  const shareId = uuidv4().slice(0, 8);
  sharedSessions[shareId] = JSON.parse(JSON.stringify(activeAgents[agentId]));
  sharedSessions[shareId].timestamp = Date.now();
  res.json({ shareId, url: `${req.protocol}://${req.get('host')}/share.html?id=${shareId}` });
});

app.get('/api/share/:shareId', (req, res) => {
  const session = sharedSessions[req.params.shareId];
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

// --- SOCKETS ---
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === API_KEY) next();
  else next(new Error("Unauthorized"));
});

io.on('connection', (socket) => {
  console.log('✅ Client Connected:', socket.id);
  socket.emit('init', activeAgents);

  socket.on('register-agent', (agent) => {
    if (!activeAgents[agent.id]) {
      activeAgents[agent.id] = { 
        ...agent, 
        lastHeartbeat: Date.now(),
        status: 'idle',
        logs: [],
        metrics: { cost: 0, tokens: 0, revenue: 0 }
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
    
    if (data.message) {
      agent.logs.push({ timestamp: Date.now(), message: data.message });
      if (agent.logs.length > 50) agent.logs.shift();
    }

    if (data.metrics) {
      // Initialize if missing
      if (!agent.metrics) agent.metrics = { cost: 0, tokens: 0, revenue: 0 };
      
      // Cumulative Metrics (Add to existing)
      if (data.metrics.cost !== undefined) agent.metrics.cost += Number(data.metrics.cost);
      if (data.metrics.tokens !== undefined) agent.metrics.tokens += Number(data.metrics.tokens);
      if (data.metrics.revenue !== undefined) agent.metrics.revenue += Number(data.metrics.revenue);
      
      // Other custom metrics (Replace value)
      const otherMetrics = { ...data.metrics };
      delete otherMetrics.cost;
      delete otherMetrics.tokens;
      delete otherMetrics.revenue;
      agent.metrics = { ...agent.metrics, ...otherMetrics };
    }
    io.emit('agent-update', agent);
  });

  socket.on('kill-agent', (agentId) => {
    console.log(`💀 Kill Command: ${agentId}`);
    io.emit('kill-signal', agentId);
    if (activeAgents[agentId]) {
      activeAgents[agentId].status = 'killed';
      io.emit('agent-update', activeAgents[agentId]);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 ClawSight Backend running on port ${PORT}`);
});
