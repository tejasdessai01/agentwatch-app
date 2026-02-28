# AgentWatch - Real-Time Agent Monitoring

**Professional-grade monitoring dashboard for OpenClaw agents.**

Built in response to: "I spawned 4 agents today and had zero visibility into what they were doing."

---

## 🎯 What It Does

- **Real-time monitoring** of all your OpenClaw agents
- **Cost tracking** down to the penny (tokens + $USD)
- **Live progress bars** showing agent completion
- **Streaming logs** for each agent
- **Kill switch** to stop agents from dashboard
- **Cost intelligence** (burn rate, projections, budget alerts)

---

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
npm start
```

Backend runs on **http://localhost:8080**

### 2. Open the Dashboard

Open in your browser:
```
http://localhost:8080
```

Or serve the frontend separately:
```bash
cd frontend
python3 -m http.server 3000
# Then open http://localhost:3000
```

### 3. Use in Your Agents

```javascript
const AgentWatch = require('./sdk/agentwatch');

async function myAgent() {
  const watcher = new AgentWatch({
    task: 'Research micro-SaaS opportunities',
    model: 'claude-3-sonnet'
  });
  
  await watcher.start();
  
  watcher.log('Starting research...');
  watcher.progress(25);
  
  // ... do work ...
  
  watcher.tokens(1500, 0.045); // 1500 tokens, $0.045
  watcher.log('Found 10 opportunities');
  watcher.progress(75);
  
  await watcher.end('complete');
}
```

---

## 📦 Project Structure

```
agentwatch-app/
├── backend/
│   ├── server.js           # WebSocket + REST API server
│   └── package.json
├── frontend/
│   └── index.html          # Beautiful dashboard UI
├── sdk/
│   ├── agentwatch.js       # SDK for OpenClaw agents
│   └── demo.js             # Example usage
└── README.md               # You are here
```

---

## 🎨 Features

### Dashboard
- **Dark theme** optimized for long monitoring sessions
- **Real-time updates** via WebSocket (<100ms latency)
- **Professional design** with gradients and smooth animations
- **Cost intelligence** with burn rate calculations
- **Agent cards** showing status, progress, logs, costs

### SDK
- **Simple API** - just 5 lines to integrate
- **Auto-reconnect** if connection drops
- **Kill command listener** - agents can respond to dashboard kills
- **Heartbeat** to keep connections alive
- **Error handling** built-in

### Backend
- **In-memory storage** (fast, no DB needed for MVP)
- **WebSocket server** for real-time updates
- **REST API** for historical data
- **Logging** with Winston
- **CORS enabled** for cross-origin requests

---

## 📊 API Reference

### SDK Methods

```javascript
const watcher = new AgentWatch(options);
```

**Options:**
- `endpoint` - Backend URL (default: 'http://localhost:8080')
- `agentId` - Unique ID (auto-generated if omitted)
- `task` - Description of what agent is doing
- `model` - AI model being used

**Methods:**
- `await watcher.start()` - Begin monitoring
- `watcher.log(message, level)` - Log a message ('info', 'warning', 'error')
- `watcher.tokens(count, costUSD)` - Report token usage
- `watcher.progress(percent)` - Update progress (0-100)
- `await watcher.end(status)` - End monitoring ('complete', 'failed', 'killed')
- `await watcher.fail(error)` - Report failure

**Events:**
- `watcher.on('kill', handler)` - Listen for kill commands from dashboard

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
PORT=8080
FRONTEND_URL=http://localhost:3000
```

### Dashboard Config

Edit `frontend/index.html` line ~150:
```javascript
const socket = io('http://localhost:8080');
```

Change URL if backend is on different host/port.

---

## 🧪 Testing

### Run Demo Agent

```bash
cd sdk
node demo.js
```

This will:
1. Connect to AgentWatch
2. Simulate an agent doing research
3. Show logs, progress, token usage
4. Complete after ~10 seconds

Open dashboard to watch it live!

### Manual Test

```javascript
const AgentWatch = require('./sdk/agentwatch');

(async () => {
  const w = new AgentWatch({ task: 'Test Agent' });
  await w.start();
  w.log('Hello from test agent!');
  w.progress(50);
  w.tokens(100, 0.003);
  await w.end('complete');
})();
```

---

## 📈 Cost Tracking

AgentWatch tracks:
- **Per-agent costs** (tokens × model pricing)
- **Total daily spend**
- **Burn rate** ($/hour based on recent activity)
- **Projections** (daily, monthly)

**Model Pricing (built-in):**
- GPT-4: $30/$60 per 1M tokens (input/output)
- Claude Opus: $15/$75 per 1M tokens
- Claude Sonnet: $3/$15 per 1M tokens
- Gemini Pro: $3.50/$10.50 per 1M tokens

---

## 🎯 Use Cases

### 1. Multi-Agent Orchestration
Monitor 5+ agents running simultaneously, see which are stuck, which are expensive.

### 2. Cost Control
Get alerts when spend hits thresholds, auto-kill expensive agents.

### 3. Debugging
Stream logs in real-time, see exactly where agents fail.

### 4. Performance Optimization
Compare token usage across agents, optimize prompts.

---

## 🚀 Deployment (Production)

### Backend (Railway)
```bash
cd backend
railway up
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
vercel --prod
```

Update WebSocket URL in `index.html` to point to production backend.

---

## 🛠️ Roadmap

**MVP (Done):**
- ✅ Real-time monitoring
- ✅ Cost tracking
- ✅ Progress bars
- ✅ Kill switch
- ✅ Beautiful UI

**Next:**
- [ ] User authentication
- [ ] PostgreSQL for persistent storage
- [ ] Budget alerts (email/SMS)
- [ ] Historical data & charts
- [ ] Multi-user support
- [ ] API webhooks

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check backend is running: `curl http://localhost:8080/health`
- Check CORS settings in `server.js`
- Check firewall/network settings

### "Agents not appearing"
- Check WebSocket connection in browser console
- Verify SDK is sending events: `socket.emit('agent:start', ...)`
- Check backend logs for errors

### "Cost calculations wrong"
- Verify token counts are accurate
- Check model pricing in SDK documentation
- Ensure `watcher.tokens()` is called after each API request

---

## 📝 License

MIT - Built for the OpenClaw community

---

## 🙏 Credits

Built by: OpenClaw Agent  
Date: February 23, 2026  
Build time: ~3 hours  

Inspired by the need to monitor multiple agents and avoid surprise API bills.

---

**Ready to monitor your agents? Start the backend and open the dashboard! 🚀**
