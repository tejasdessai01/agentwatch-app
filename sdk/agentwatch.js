/**
 * AgentWatch SDK for OpenClaw
 * Simple integration to monitor agents in real-time
 */

const io = require('socket.io-client');

class AgentWatch {
  constructor(options = {}) {
    this.endpoint = options.endpoint || 'http://localhost:8080';
    this.agentId = options.agentId || this.generateId();
    this.task = options.task || 'Unknown task';
    this.model = options.model || 'unknown';
    this.socket = null;
    this.connected = false;
    this.heartbeatInterval = null;
  }
  
  generateId() {
    return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.endpoint, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      this.socket.on('connect', () => {
        this.connected = true;
        console.log(`✅ AgentWatch connected: ${this.agentId}`);
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ AgentWatch connection error:', error.message);
        reject(error);
      });
      
      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('🔌 AgentWatch disconnected');
      });
      
      // Listen for kill commands
      this.socket.on('agent:killed', (data) => {
        if (data.agentId === this.agentId) {
          console.log('⛔ Agent kill command received');
          this.emit('kill');
        }
      });
    });
  }
  
  async start() {
    if (!this.connected) {
      await this.connect();
    }
    
    this.socket.emit('agent:start', {
      agentId: this.agentId,
      task: this.task,
      model: this.model,
      timestamp: Date.now()
    });
    
    // Start heartbeat
    this.startHeartbeat();
    
    console.log(`🚀 Agent started: ${this.task}`);
  }
  
  log(message, level = 'info') {
    if (!this.connected) return;
    
    this.socket.emit('agent:log', {
      agentId: this.agentId,
      message,
      level,
      timestamp: Date.now()
    });
  }
  
  tokens(count, costUSD) {
    if (!this.connected) return;
    
    this.socket.emit('agent:tokens', {
      agentId: this.agentId,
      tokens: count,
      cost: costUSD,
      timestamp: Date.now()
    });
  }
  
  progress(percent) {
    if (!this.connected) return;
    
    this.socket.emit('agent:progress', {
      agentId: this.agentId,
      progress: Math.max(0, Math.min(100, percent)),
      timestamp: Date.now()
    });
  }
  
  async end(status = 'complete') {
    if (!this.connected) return;
    
    this.stopHeartbeat();
    
    this.socket.emit('agent:end', {
      agentId: this.agentId,
      status,
      timestamp: Date.now()
    });
    
    console.log(`✅ Agent ended: ${status}`);
    
    // Close connection after a delay
    setTimeout(() => {
      if (this.socket) {
        this.socket.close();
      }
    }, 1000);
  }
  
  async fail(error) {
    this.log(`Error: ${error}`, 'error');
    await this.end('failed');
  }
  
  startHeartbeat() {
    // Ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // Event emitter for kill commands
  on(event, handler) {
    if (!this.socket) return;
    this.socket.on(event, handler);
  }
  
  off(event, handler) {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }
  
  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }
}

module.exports = AgentWatch;
