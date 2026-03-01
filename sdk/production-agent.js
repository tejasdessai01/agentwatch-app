const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

const AGENT_ID = process.env.AGENT_ID || `agent-${uuidv4().substring(0, 8)}`;
// Connecting to Render Production URL
const SERVER_URL = 'https://agentwatch-dashboard.onrender.com';

console.log(`Starting AgentWatch SDK for agent: ${AGENT_ID} -> Connecting to ${SERVER_URL}`);

const socket = io(SERVER_URL);

let intervalId;
let counter = 0;
const tasks = [
  "Fetching market data...",
  "Analyzing trends...",
  "Executing trade simulation...",
  "Writing report to 'strategy.md'...",
  "Sleeping for 5s...",
  "Waking up...",
  "Checking email...",
  "Error: API Timeout. Retrying...",
  "Success! Cycle complete."
];

socket.on('connect', () => {
  console.log('✅ Connected to AgentWatch Dashboard!');
  
  // Register Agent
  socket.emit('register-agent', {
    id: AGENT_ID,
    name: process.env.AGENT_NAME || "Production Agent v1",
    status: "idle"
  });

  // Start simulating work loop
  intervalId = setInterval(() => {
    const task = tasks[counter % tasks.length];
    const status = task.includes("Error") ? "error" : "working";
    
    console.log(`[Agent Work] ${task}`);
    
    // Send log to server
    socket.emit('agent-log', {
      id: AGENT_ID,
      message: task,
      status: status
    });

    counter++;
  }, 3000); // Report every 3 seconds
});

// Listen for KILL command from Dashboard
socket.on('kill-signal', (targetId) => {
  if (targetId === AGENT_ID) {
    console.log("⚠️ KILL COMMAND RECEIVED FROM DASHBOARD! SHUTTING DOWN IMMEDIATELY.");
    socket.emit('agent-log', { id: AGENT_ID, message: "⚠️ SHUTDOWN COMMAND EXECUTED", status: "killed" });
    clearInterval(intervalId);
    socket.disconnect();
    process.exit(0);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
