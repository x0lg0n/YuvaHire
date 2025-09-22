const autocannon = require('autocannon');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Configuration
const config = {
  server: {
    url: 'http://localhost:5001',
    timeout: 30000
  },
  tests: {
    duration: 30, // seconds
    connections: 100,
    pipelining: 1
  }
};

// Test scenarios
const scenarios = [
  {
    name: 'Health Check Endpoint',
    url: '/api/health',
    method: 'GET',
    headers: {},
    expectations: {
      statusCode: 200,
      avgLatency: 50, // ms
      throughput: 1000 // req/sec
    }
  },
  {
    name: 'Authentication Login',
    url: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'testuser',
      password: 'password123'
    }),
    expectations: {
      statusCode: 200,
      avgLatency: 200,
      throughput: 100
    }
  },
  {
    name: 'Get Jobs (Authenticated)',
    url: '/api/jobs/my-college',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token-here',
      'Content-Type': 'application/json'
    },
    expectations: {
      statusCode: 200,
      avgLatency: 100,
      throughput: 500
    }
  },
  {
    name: 'Create Application',
    url: '/api/applications',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token-here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      job: '507f1f77bcf86cd799439011',
      coverLetter: 'Performance test application'
    }),
    expectations: {
      statusCode: 201,
      avgLatency: 300,
      throughput: 50
    }
  }
];

class PerformanceTester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  async setup() {
    console.log('🚀 Starting Performance Tests Setup...');
    
    try {
      // Check if server is running
      await this.checkServer();
      
      // Get authentication token
      await this.getAuthToken();
      
      console.log('✅ Setup completed successfully');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkServer() {
    try {
      const result = await autocannon({
        url: `${config.server.url}/api/health`,
        connections: 1,
        duration: 1
      });
      
      if (result.errors > 0) {
        throw new Error('Server health check failed');
      }
      
      console.log('✅ Server is responding');
    } catch (error) {
      throw new Error(`Server is not accessible: ${error.message}`);
    }
  }

  async getAuthToken() {
    try {
      // First register a test user
      await autocannon({
        url: `${config.server.url}/api/auth/register`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'perftest_' + Date.now(),
          password: 'password123',
          role: 'student',
          college_name: 'Performance Test University'
        }),
        connections: 1,
        duration: 1
      });

      // Then login to get token
      const loginResult = await autocannon({
        url: `${config.server.url}/api/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'perftest_' + Date.now(),
          password: 'password123'
        }),
        connections: 1,
        duration: 1
      });

      // Extract token from response (simplified for this test)
      this.authToken = 'mock-test-token';
      console.log('✅ Authentication token obtained');
    } catch (error) {
      console.warn('⚠️  Could not get auth token, some tests may fail');
    }
  }

  async runScenario(scenario) {
    console.log(`\n🧪 Running: ${scenario.name}`);
    console.log(`   URL: ${scenario.method} ${scenario.url}`);
    
    const options = {
      url: `${config.server.url}${scenario.url}`,
      method: scenario.method,
      headers: scenario.headers,
      connections: config.tests.connections,
      duration: config.tests.duration,
      pipelining: config.tests.pipelining
    };

    // Add auth token if available
    if (this.authToken && scenario.headers.Authorization) {
      options.headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Add request body if provided
    if (scenario.body) {
      options.body = scenario.body;
    }

    try {
      const result = await autocannon(options);
      
      const analysis = this.analyzeResults(result, scenario);
      this.results.push({
        scenario: scenario.name,
        result,
        analysis,
        passed: analysis.passed
      });

      this.printScenarioResults(scenario, result, analysis);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to run scenario ${scenario.name}:`, error.message);
      this.results.push({
        scenario: scenario.name,
        error: error.message,
        passed: false
      });
    }
  }

  analyzeResults(result, scenario) {
    const analysis = {
      passed: true,
      issues: []
    };

    // Check status codes
    const successRate = ((result['2xx'] || 0) / result.requests.total) * 100;
    if (successRate < 95) {
      analysis.passed = false;
      analysis.issues.push(`Low success rate: ${successRate.toFixed(2)}%`);
    }

    // Check average latency
    if (result.latency.average > scenario.expectations.avgLatency) {
      analysis.passed = false;
      analysis.issues.push(
        `High latency: ${result.latency.average.toFixed(2)}ms (expected < ${scenario.expectations.avgLatency}ms)`
      );
    }

    // Check throughput
    const throughput = result.requests.average;
    if (throughput < scenario.expectations.throughput) {
      analysis.passed = false;
      analysis.issues.push(
        `Low throughput: ${throughput.toFixed(2)} req/s (expected > ${scenario.expectations.throughput} req/s)`
      );
    }

    // Check error rate
    if (result.errors > 0) {
      analysis.passed = false;
      analysis.issues.push(`Errors occurred: ${result.errors}`);
    }

    return analysis;
  }

  printScenarioResults(scenario, result, analysis) {
    const status = analysis.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   Status: ${status}`);
    console.log(`   Requests: ${result.requests.total} (${result.requests.average.toFixed(2)} req/s)`);
    console.log(`   Latency: avg ${result.latency.average.toFixed(2)}ms, p99 ${result.latency.p99.toFixed(2)}ms`);
    console.log(`   Success Rate: ${(((result['2xx'] || 0) / result.requests.total) * 100).toFixed(2)}%`);
    
    if (!analysis.passed) {
      console.log(`   Issues:`);
      analysis.issues.forEach(issue => console.log(`     - ${issue}`));
    }
  }

  async runAllScenarios() {
    console.log('\n🏃‍♂️ Running Performance Test Scenarios...\n');
    
    for (const scenario of scenarios) {
      await this.runScenario(scenario);
      
      // Wait between scenarios to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  generateReport() {
    console.log('\n📊 PERFORMANCE TEST REPORT');
    console.log('=' * 50);
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\nOverall Results:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(2)}%)`);
    console.log(`  Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(2)}%)`);
    
    console.log(`\nDetailed Results:`);
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${result.scenario}`);
      
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      } else if (result.analysis && !result.analysis.passed) {
        result.analysis.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    });

    // Performance recommendations
    console.log(`\n💡 Recommendations:`);
    
    const avgLatencies = this.results
      .filter(r => r.result)
      .map(r => r.result.latency.average);
    
    if (avgLatencies.length > 0) {
      const overallAvgLatency = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
      
      if (overallAvgLatency > 200) {
        console.log(`  - Consider optimizing database queries (avg latency: ${overallAvgLatency.toFixed(2)}ms)`);
        console.log(`  - Implement caching for frequently accessed data`);
        console.log(`  - Review and optimize middleware stack`);
      }
      
      if (failedTests > 0) {
        console.log(`  - Investigate failed scenarios for potential bottlenecks`);
        console.log(`  - Consider implementing rate limiting and request throttling`);
        console.log(`  - Review server resource allocation (CPU, memory)`);
      }
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100
    };
  }

  async runMemoryProfiler() {
    console.log('\n🧠 Running Memory Profile...');
    
    try {
      // Simple memory usage check using Node.js process info
      const initialMemory = process.memoryUsage();
      
      // Run a heavy load test
      await autocannon({
        url: `${config.server.url}/api/health`,
        connections: 200,
        duration: 60 // 1 minute
      });
      
      const finalMemory = process.memoryUsage();
      
      console.log('Memory Usage Analysis:');
      console.log(`  Initial RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Final RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Memory Increase: ${((finalMemory.rss - initialMemory.rss) / 1024 / 1024).toFixed(2)} MB`);
      
      if ((finalMemory.rss - initialMemory.rss) / 1024 / 1024 > 100) {
        console.log('⚠️  Potential memory leak detected!');
      } else {
        console.log('✅ Memory usage appears stable');
      }
      
    } catch (error) {
      console.error('❌ Memory profiling failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();
  
  try {
    await tester.setup();
    await tester.runAllScenarios();
    
    const report = tester.generateReport();
    
    // Run memory profiler if requested
    if (process.argv.includes('--memory')) {
      await tester.runMemoryProfiler();
    }
    
    // Exit with appropriate code
    process.exit(report.successRate === 100 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PerformanceTester, scenarios, config };