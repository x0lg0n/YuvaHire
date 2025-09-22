#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      backend: { unit: null, integration: null, performance: null },
      frontend: { unit: null, e2e: null },
      overall: { passed: 0, failed: 0, total: 0 }
    };
    
    this.config = {
      backend: {
        path: path.join(__dirname, '..', '..'),
        testCommand: 'npm test',
        performanceCommand: 'node tests/performance/load-test.js'
      },
      frontend: {
        path: path.join(__dirname, '..', '..', '..', 'client'),
        unitTestCommand: 'npm test',
        e2eTestCommand: 'npm run test:e2e'
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      start: '🚀'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, cwd, description) {
    this.log(`Starting: ${description}`, 'start');
    
    return new Promise((resolve, reject) => {
      const process = spawn('npm', command.split(' ').slice(1), {
        cwd,
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        if (process.env.VERBOSE) {
          console.log(data.toString());
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (process.env.VERBOSE) {
          console.error(data.toString());
        }
      });

      process.on('close', (code) => {
        const result = {
          success: code === 0,
          code,
          stdout,
          stderr,
          command,
          description
        };

        if (code === 0) {
          this.log(`Completed: ${description}`, 'success');
        } else {
          this.log(`Failed: ${description} (exit code: ${code})`, 'error');
        }

        resolve(result);
      });

      process.on('error', (error) => {
        this.log(`Error running ${description}: ${error.message}`, 'error');
        resolve({
          success: false,
          error: error.message,
          command,
          description
        });
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'start');
    
    const checks = [
      { command: 'node --version', name: 'Node.js' },
      { command: 'npm --version', name: 'npm' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8' });
        this.log(`${check.name}: ${result.trim()}`, 'success');
      } catch (error) {
        this.log(`${check.name} not found or not working`, 'error');
        throw new Error(`${check.name} is required but not available`);
      }
    }

    // Check if dependencies are installed
    const backendNodeModules = path.join(this.config.backend.path, 'node_modules');
    const frontendNodeModules = path.join(this.config.frontend.path, 'node_modules');

    if (!fs.existsSync(backendNodeModules)) {
      this.log('Installing backend dependencies...', 'start');
      execSync('npm install', { cwd: this.config.backend.path, stdio: 'inherit' });
    }

    if (!fs.existsSync(frontendNodeModules)) {
      this.log('Installing frontend dependencies...', 'start');
      execSync('npm install', { cwd: this.config.frontend.path, stdio: 'inherit' });
    }

    this.log('Prerequisites check completed', 'success');
  }

  async runBackendTests() {
    this.log('Running Backend Tests', 'start');
    
    // Unit and Integration Tests
    const testResult = await this.runCommand(
      this.config.backend.testCommand,
      this.config.backend.path,
      'Backend Unit & Integration Tests'
    );

    this.results.backend.unit = testResult;
    this.results.backend.integration = testResult; // Combined for now

    return testResult;
  }

  async runPerformanceTests() {
    this.log('Running Performance Tests', 'start');
    
    // Start server first
    this.log('Starting backend server for performance tests...', 'start');
    const serverProcess = spawn('npm', ['start'], {
      cwd: this.config.backend.path,
      stdio: 'pipe',
      detached: true
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const perfResult = await this.runCommand(
        this.config.backend.performanceCommand,
        this.config.backend.path,
        'Performance Tests'
      );

      this.results.backend.performance = perfResult;
      return perfResult;
    } finally {
      // Clean up server process
      if (serverProcess && !serverProcess.killed) {
        this.log('Stopping backend server...', 'info');
        process.kill(-serverProcess.pid);
      }
    }
  }

  async runFrontendTests() {
    this.log('Running Frontend Tests', 'start');
    
    // Unit Tests
    const unitResult = await this.runCommand(
      this.config.frontend.unitTestCommand,
      this.config.frontend.path,
      'Frontend Unit Tests'
    );

    this.results.frontend.unit = unitResult;
    return unitResult;
  }

  async runE2ETests() {
    this.log('Running End-to-End Tests', 'start');
    
    // Start both backend and frontend servers
    this.log('Starting servers for E2E tests...', 'start');
    
    const backendProcess = spawn('npm', ['start'], {
      cwd: this.config.backend.path,
      stdio: 'pipe',
      detached: true
    });

    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: this.config.frontend.path,
      stdio: 'pipe',
      detached: true
    });

    // Wait for servers to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      const e2eResult = await this.runCommand(
        this.config.frontend.e2eTestCommand,
        this.config.frontend.path,
        'End-to-End Tests'
      );

      this.results.frontend.e2e = e2eResult;
      return e2eResult;
    } finally {
      // Clean up server processes
      this.log('Stopping test servers...', 'info');
      if (backendProcess && !backendProcess.killed) {
        process.kill(-backendProcess.pid);
      }
      if (frontendProcess && !frontendProcess.killed) {
        process.kill(-frontendProcess.pid);
      }
    }
  }

  generateTestReport() {
    this.log('Generating Test Report', 'start');
    
    const allResults = [
      { name: 'Backend Unit Tests', result: this.results.backend.unit },
      { name: 'Backend Performance Tests', result: this.results.backend.performance },
      { name: 'Frontend Unit Tests', result: this.results.frontend.unit },
      { name: 'End-to-End Tests', result: this.results.frontend.e2e }
    ].filter(test => test.result !== null);

    const passed = allResults.filter(test => test.result.success).length;
    const total = allResults.length;
    const failed = total - passed;

    console.log('\n' + '='.repeat(60));
    console.log('🧪 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Test Suites: ${total}`);
    console.log(`   ✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    
    console.log(`\n📋 Detailed Results:`);
    allResults.forEach((test, index) => {
      const status = test.result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${index + 1}. ${status} ${test.name}`);
      
      if (!test.result.success && test.result.stderr) {
        const errorLines = test.result.stderr.split('\n').slice(0, 3);
        errorLines.forEach(line => {
          if (line.trim()) {
            console.log(`      ${line.trim()}`);
          }
        });
      }
    });

    // Test Coverage Analysis (if available)
    const coverageFiles = [
      path.join(this.config.backend.path, 'coverage', 'coverage-summary.json'),
      path.join(this.config.frontend.path, 'coverage', 'coverage-summary.json')
    ];

    coverageFiles.forEach((file, index) => {
      if (fs.existsSync(file)) {
        try {
          const coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
          const component = index === 0 ? 'Backend' : 'Frontend';
          
          console.log(`\n📈 ${component} Code Coverage:`);
          if (coverage.total) {
            console.log(`   Lines: ${coverage.total.lines.pct}%`);
            console.log(`   Functions: ${coverage.total.functions.pct}%`);
            console.log(`   Branches: ${coverage.total.branches.pct}%`);
            console.log(`   Statements: ${coverage.total.statements.pct}%`);
          }
        } catch (error) {
          this.log(`Could not parse coverage file: ${file}`, 'warning');
        }
      }
    });

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (failed > 0) {
      console.log(`   - Review and fix ${failed} failing test suite(s)`);
      console.log(`   - Check error logs above for specific failure details`);
    }
    
    if (passed === total) {
      console.log(`   - All tests passing! 🎉`);
      console.log(`   - Consider adding more edge case tests`);
      console.log(`   - Monitor performance metrics in production`);
    }

    console.log(`   - Run individual test suites with --backend, --frontend, --e2e, or --performance flags`);
    console.log(`   - Use --verbose flag for detailed output`);
    
    console.log('\n' + '='.repeat(60));

    this.results.overall = { passed, failed, total };
    return this.results.overall;
  }

  async run(options = {}) {
    try {
      await this.checkPrerequisites();

      if (options.backend || options.all) {
        await this.runBackendTests();
      }

      if (options.performance || options.all) {
        await this.runPerformanceTests();
      }

      if (options.frontend || options.all) {
        await this.runFrontendTests();
      }

      if (options.e2e || options.all) {
        await this.runE2ETests();
      }

      const results = this.generateTestReport();
      
      // Exit with appropriate code
      process.exit(results.failed === 0 ? 0 : 1);
      
    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {
    all: args.includes('--all') || args.length === 0,
    backend: args.includes('--backend'),
    frontend: args.includes('--frontend'),
    e2e: args.includes('--e2e'),
    performance: args.includes('--performance'),
    verbose: args.includes('--verbose')
  };

  if (options.verbose) {
    process.env.VERBOSE = 'true';
  }

  const runner = new TestRunner();
  runner.run(options);
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;