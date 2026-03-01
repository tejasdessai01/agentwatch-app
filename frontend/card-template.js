    function renderAgent(agent, targetGrid) {
      if (!targetGrid) { renderAllAgents(); return; } // Force re-sort

      let card = document.createElement('div');
      card.id = `agent-${agent.id}`;
      card.className = "bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden flex flex-col h-96 transition-all hover:border-emerald-500/50";
      targetGrid.appendChild(card);

      // Dynamic Status Colors
      let statusColor = 'bg-gray-500';
      if (agent.status === 'working') statusColor = 'bg-emerald-500 animate-pulse';
      if (agent.status === 'error') statusColor = 'bg-yellow-500 animate-bounce';
      if (agent.status === 'killed') statusColor = 'bg-red-600';

      // Metrics (Defaults)
      const cost = agent.metrics?.cost?.toFixed(4) || '0.0000';
      const tokens = agent.metrics?.tokens?.toLocaleString() || '0';
      const uptime = agent.metrics?.uptime ? Math.floor(agent.metrics.uptime / 60) + 'm' : '0m';

      // Logs HTML
      const logsHtml = agent.logs.slice().reverse().map(l => 
        `<div class="mb-1 text-xs text-gray-300 font-mono border-l-2 border-gray-700 pl-2">
           <span class="text-gray-500">[${new Date(l.timestamp).toLocaleTimeString()}]</span> ${l.message}
         </div>`
      ).join('');

      card.innerHTML = `
        <div class="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-white truncate w-40" title="${agent.name}">${agent.name}</h3>
            <div class="text-xs text-gray-500 font-mono truncate w-40">${agent.id}</div>
          </div>
          <div class="w-3 h-3 rounded-full ${statusColor} status-dot"></div>
        </div>

        <!-- PRO METRICS GRID -->
        <div class="grid grid-cols-3 gap-1 bg-gray-900 border-b border-gray-700 p-2 text-center">
          <div>
            <div class="text-[10px] text-gray-500 uppercase font-bold">COST</div>
            <div class="text-sm font-mono text-emerald-400">$${cost}</div>
          </div>
          <div class="border-l border-gray-800">
            <div class="text-[10px] text-gray-500 uppercase font-bold">TOKENS</div>
            <div class="text-sm font-mono text-blue-400">${tokens}</div>
          </div>
          <div class="border-l border-gray-800">
            <div class="text-[10px] text-gray-500 uppercase font-bold">UPTIME</div>
            <div class="text-sm font-mono text-gray-400">${uptime}</div>
          </div>
        </div>
        
        <div class="flex-1 bg-black p-4 overflow-y-auto scrollbar-thin">
          ${logsHtml || '<div class="text-gray-600 text-sm italic">Waiting for logs...</div>'}
        </div>

        <div class="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
          <span class="text-xs text-gray-400 uppercase font-bold tracking-wider">${agent.status}</span>
          ${agent.status !== 'killed' ? 
            `<button onclick="killAgent('${agent.id}')" class="bg-red-900/80 hover:bg-red-600 text-white text-xs px-3 py-1 rounded font-bold transition-colors">KILL</button>` : 
            `<span class="text-red-500 text-xs font-bold">TERMINATED</span>`
          }
        </div>
      `;
    }
