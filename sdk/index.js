const io = require('socket.io-client');

/**
 * ClawSight Client SDK
 * @param {Object} config - { name, id, token, server }
 */
module.exports = function AgentWatch(config) {
  const { name, id, token, server } = config;

  if (!token || !server) {
    console.error("❌ ClawSight Error: Missing token or server URL.");
    return;
  }

  const socket = io(server, {
    auth: { token }
  });

  socket.on('connect', () => {
    // console.log(`✅ ClawSight Connected: ${name}`);
    socket.emit('register-agent', { id, name, status: 'working', metrics: { cost: 0, tokens: 0 }, logs: [] });
  });

  socket.on('kill-signal', (targetId) => {
    if (targetId === id) {
      console.error(`💀 ClawSight: KILL SIGNAL RECEIVED for ${id}. Terminating process immediately.`);
      process.exit(1); 
    }
  });

  return {
    log: (message, status = 'working') => {
      socket.emit('agent-log', { id, message, status });
    },
    metric: (key, value) => {
      // e.g. key='cost', value=0.05
      socket.emit('agent-log', { id, metrics: { [key]: value } });
    },
    status: (status) => {
      socket.emit('agent-log', { id, status });
    }
  };
};
