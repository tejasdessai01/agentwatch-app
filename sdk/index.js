const io = require('socket.io-client');

/**
 * Connect to ClawSight Dashboard
 * @param {Object} config - Configuration object
 * @param {string} config.server - URL of your dashboard (e.g. 'https://app.clawsight.org')
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
    console.log(`✅ ClawSight Connected: ${name}`);
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

  socket.on('connect_error', (err) => {
    console.error(`❌ ClawSight Error: ${name} failed to connect. ${err.message}`);
  });

  socket.on('kill-signal', (targetId) => {
    if (targetId === id) {
      console.error(`💀 ClawSight: KILL SIGNAL RECEIVED for agent ${id}. Terminating process immediately.`);
      process.exit(1); 
    }
  });

  return {
    log: (message, status = 'working') => {
      socket.emit('agent-log', { id, message, status });
    },
    
    metric: (key, value) => {
      socket.emit('agent-log', { id, metrics: { [key]: value } });
    },
    
    status: (status) => {
      socket.emit('agent-log', { id, status });
    }
  };
};
