const io = require('socket.io-client');

/**
 * Connect to ClawSight Dashboard
 * @param {Object} config - Configuration object
 * @param {string} config.server - URL of your dashboard (e.g. 'https://agentwatch-dashboard.onrender.com')
 * @param {string} config.token - API Key from dashboard settings
 * @returns {Object} Watcher instance
 */
module.exports = function ClawSight(config) {
  const { name, id, token, server } = config;

  if (!token || !server) {
    console.error("❌ ClawSight Error: Missing 'token' or 'server' URL in config.");
    return {
      log: () => {},
      metric: () => {},
      status: () => {}
    }; // Return dummy functions to prevent crashes
  }

  // Connect to backend
  const socket = io(server, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    // Register agent on connect
    if (name && id) {
      socket.emit('register-agent', { 
        id, 
        name, 
        status: 'working', 
        metrics: { cost: 0, tokens: 0 }, 
        logs: [] 
      });
    }
  });

  socket.on('kill-signal', (targetId) => {
    if (targetId === id) {
      console.error(`💀 ClawSight: KILL SIGNAL RECEIVED for agent ${id}. Terminating process immediately.`);
      process.exit(1); 
    }
  });

  return {
    /**
     * Log a message to the dashboard
     * @param {string} message - Text to log
     * @param {string} [status='working'] - Status ('working', 'success', 'error', 'idle')
     */
    log: (message, status = 'working') => {
      socket.emit('agent-log', { id, message, status });
    },
    
    /**
     * Update a metric value
     * @param {string} key - Metric name (e.g. 'cost', 'tokens')
     * @param {number} value - New value
     */
    metric: (key, value) => {
      socket.emit('agent-log', { id, metrics: { [key]: value } });
    },
    
    /**
     * Set agent status
     * @param {string} status - New status ('working', 'idle', 'error')
     */
    status: (status) => {
      socket.emit('agent-log', { id, status });
    }
  };
};
