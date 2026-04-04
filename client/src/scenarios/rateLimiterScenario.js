export const rateLimiterScenarioFiles = {
  'package.json': {
    file: {
      contents: `
{
  "name": "rate-limiter-challenge",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node server.js",
    "test": "node rate-limiter.test.js"
  }
}
      `.trim()
    }
  },
  'server.js': {
    file: {
      contents: `
const express = require('express');
const { rateLimiter } = require('./middleware');

const app = express();

// Apply the candidate's middleware to the API
app.use('/api', rateLimiter);

app.get('/api/profile', (req, res) => {
  // Simulate slow endpoint (e.g. DB fetch)
  setTimeout(() => {
    res.json({ message: 'Profile data', userId: 'user_123' });
  }, 30);
});

module.exports = app;

if (require.main === module) {
  app.listen(3000, () => console.log('Server running on port 3000'));
}
      `.trim()
    }
  },
  'middleware.js': {
    file: {
      contents: `
// middleware.js
// Implement a sliding-window rate limiter and caching layer here.
// Requirements:
// 1. Max 100 requests limit. If exceeded, return status 429.
// 2. Add a basic caching layer to improve response time for repeated requests.

function rateLimiter(req, res, next) {
  // Your implementation here...
  
  next();
}

module.exports = { rateLimiter };
      `.trim()
    }
  },
  'rate-limiter.test.js': {
    file: {
      contents: `
// The output structure expected by the frontend
const testResults = {
  numFailedTestSuites: 0,
  testResults: [{ assertionResults: [] }]
};

async function runTest(title, fn) {
  const result = { title, status: 'passed' };
  
  // Clean module cache for isolation
  Object.keys(require.cache).forEach(key => { delete require.cache[key]; });
  const app = require('./server');
  const http = require('http');
  const server = http.createServer(app);
  
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = \`http://127.0.0.1:\${port}/api/profile\`;

  try {
     await fn(baseUrl);
     console.log(\`  ✓ \${title}\`);
  } catch(e) {
     result.status = 'failed';
     result.failureMessages = [e.stack || e.message];
     testResults.numFailedTestSuites = 1;
     console.log(\`  ✕ \${title} (\${e.message})\`);
  }
  
  await new Promise(resolve => server.close(resolve));
  testResults.testResults[0].assertionResults.push(result);
}

async function main() {
   // Test 1: allows normal requests and caches the response
   await runTest('allows normal requests and caches the response', async (baseUrl) => {
      const start1 = Date.now();
      const res1 = await fetch(baseUrl);
      const data1 = await res1.json();
      const dur1 = Date.now() - start1;
      
      if (res1.status !== 200 || data1.message !== 'Profile data') throw new Error('Failed basic request');
      
      const start2 = Date.now();
      const res2 = await fetch(baseUrl);
      const dur2 = Date.now() - start2;
      
      if (res2.status !== 200) throw new Error('Failed second request. Expected 200 received ' + res2.status);
      if (dur2 >= 30) throw new Error('Cache too slow: ' + dur2 + 'ms');
   });

   // Test 2: handles concurrent requests without stampede
   await runTest('handles concurrent requests without stampede', async (baseUrl) => {
      const promises = [];
      for(let i=0; i<100; i++){ promises.push(fetch(baseUrl)); }
      const results = await Promise.all(promises);
      const successes = results.filter(r => r.status === 200);
      if (successes.length !== 100) throw new Error(\`Stampede collision! Only \${successes.length}/100 passed cleanly\`);
   });

   // Test 3: enforces 429 limit on too many requests
   await runTest('enforces 429 limit on too many requests', async (baseUrl) => {
      let limitHit = false;
      for(let i=0; i<101; i++){ 
         const res = await fetch(baseUrl); 
         if (res.status === 429) { limitHit = true; break; }
      }
      if (!limitHit) throw new Error('Did not return 429 Too Many Requests status code');
   });
   
   // Print final JSON signature exactly as the frontend expects
   console.log('\\n' + JSON.stringify(testResults));
   process.exit(0);
}

main();
      `.trim()
    }
  }
};
