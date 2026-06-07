const http = require('http');

async function fetchAPI() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/projects?category=All&limit=24&offset=0', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Parse error', data });
        }
      });
    });
  });
}

async function runTest() {
  console.log('--- Projects API Verification Audit ---');
  
  let hits = 0;
  let misses = 0;
  let totalRequests = 50;

  console.log(`Sending ${totalRequests} requests to /api/projects...`);

  for (let i = 0; i < totalRequests; i++) {
    const start = Date.now();
    const result = await fetchAPI();
    const duration = Date.now() - start;

    if (result.cached === true) {
      hits++;
      if (i < 5) console.log(`[Req ${i+1}] CACHE HIT! Response time: ${duration}ms`);
    } else {
      misses++;
      if (i < 5) console.log(`[Req ${i+1}] CACHE MISS. Response time: ${duration}ms`);
    }
    
    if (i === 0) {
      console.log(`\nSample Data Validation:`);
      console.log(`- Array returned? ${Array.isArray(result.projects)}`);
      console.log(`- Project count: ${result.projects ? result.projects.length : 0}`);
      if (result.projects && result.projects.length > 0) {
        console.log(`- Sample Project Title: "${result.projects[0].title}"`);
        console.log(`- Profile joined? ${!!result.projects[0].profiles}`);
      }
      console.log('\nContinuing test...\n');
    }
  }

  console.log('\n--- Final Audit Results ---');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Cache Hits: ${hits}`);
  console.log(`Cache Misses: ${misses}`);
  console.log(`Cache Hit Ratio: ${((hits / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Database Queries Avoided: ${hits}`);
}

runTest();
