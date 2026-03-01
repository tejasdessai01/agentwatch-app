const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

module.exports = function AgentWatch(config = {}) {
  const SERVER_URL = config.server || 'https://agentwatch-dashboard.onrender.com';
  const API_KEY = config.token || process.env.AGENTWATCH_KEY;
  const AGENT_ID = config.id || process.env.AGENT_ID || `agent-${uuidv4().substring(0, 8)}`;
  const AGENT_NAME = config.name || process.env.AGENT_NAME || `Agent ${os.hostname()}`;

  if (!API_KEY) {
    console.error('⚠️ AgentWatch: No API Key provided! Monitoring disabled.');
    return { log: () => {}, status: () => {} };
  }

  const socket = io(SERVER_URL, {
    auth: { token: API_KEY },
    reconnection: true
  });

  console.log(`[AgentWatch] Monitoring enabled for: ${AGENT_NAME} (${AGENT_ID})`);

  socket.on('connect', () => {
    // Register immediately on connect/reconnect
    socket.emit('register-agent', {
      id: AGENT_ID,
      name: AGENT_NAME,
      status: 'idle',
      meta: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime()
      }
    });
  });

  socket.on('kill-signal', (targetId) => {
    if (targetId === AGENT_ID) {
      console.error('🛑 AgentWatch: REMOTE KILL SIGNAL RECEIVED. Terminating process.');
      process.exit(1); // Hard exit
    }
  });

  // Public API
  return {
    log: (message, status = 'working') => {
      socket.emit('agent-log', {
        id: AGENT_ID,
        message: String(message),
        status: status
      });
    },
    status: (newStatus) => {
      socket.emit('agent-log', {
        id: AGENT_ID,
        message: `Status changed to: ${newStatus}`,
        status: newStatus
      });
    },
    metric: (key, value) => {
      socket.emit('agent-log', {
        id: AGENT_ID,
        metrics: { [key]: value }
      });
    },
    error: (err) => {
      socket.emit('agent-log', {
        id: AGENT_ID,
        message: `ERROR: ${err.message || err}`,
        status: 'error'
      });
    }
  };
};
