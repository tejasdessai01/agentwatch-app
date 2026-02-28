/**
 * AgentWatch SDK Demo
 * Shows how to integrate AgentWatch into your OpenClaw agents
 */

const AgentWatch = require('./agentwatch');

async function demoAgent() {
  // Initialize AgentWatch
  const watcher = new AgentWatch({
    endpoint: 'http://18.188.41.27:8080',
    task: 'Demo Agent - Finding micro-SaaS ideas',
    model: 'claude-3-sonnet'
  });
  
  try {
    // Start monitoring
    await watcher.start();
    
    // Simulate agent work
    watcher.log('Starting research phase...');
    watcher.progress(10);
    
    await sleep(2000);
    
    watcher.log('Searching for problems...');
    watcher.progress(30);
    watcher.tokens(1500, 0.045); // 1500 tokens, $0.045
    
    await sleep(3000);
    
    watcher.log('Analyzing market opportunities...');
    watcher.progress(60);
    watcher.tokens(2500, 0.075);
    
    await sleep(2000);
    
    watcher.log('Generating recommendations...');
    watcher.progress(85);
    watcher.tokens(1000, 0.030);
    
    await sleep(2000);
    
    watcher.log('Research complete!', 'info');
    watcher.progress(100);
    
    // End monitoring
    await watcher.end('complete');
    
  } catch (error) {
    watcher.log(`Fatal error: ${error.message}`, 'error');
    await watcher.fail(error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demo
console.log('🚀 Starting AgentWatch demo agent...\n');
console.log('Open http://localhost:8080 in your browser to see it live!\n');

demoAgent().then(() => {
  console.log('\n✅ Demo complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
