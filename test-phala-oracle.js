#!/usr/bin/env node

/**
 * Test script for Phala-deployed oracle
 * Tests health endpoint and balance/signature endpoint
 */

const https = require('https');
const http = require('http');

// Configuration
const ORACLE_URL = process.env.ORACLE_URL || 'https://near-mpc-oracle-yjgb1.phatfn.xyz';
const API_KEY = process.env.API_KEY || 'phak__Gf8RSmDH8EeIkSJoCHRhE-VW4w1zotHytMp5CKAAPQ';
const TEST_RECEIVER = process.env.TEST_RECEIVER || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const TEST_ASSETS = '1000000'; // 1 USDC

// Expected values
const EXPECTED_AGENT = '0x3c00e24AB8EE6d91C1d4f52AfaD384f1286CA1Df';
const EXPECTED_BALANCE = '1000000'; // Hardcoded fake balance

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: true });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testHealthEndpoint() {
  log('\n=== Test 1: Health Endpoint ===', 'blue');
  log(`Testing: ${ORACLE_URL}/health`);
  
  try {
    const result = await makeRequest(`${ORACLE_URL}/health`);
    
    if (result.status === 200 && result.data.status === 'ok') {
      log('✅ Health check PASSED', 'green');
      log(`   Status: ${result.data.status}`);
      log(`   Timestamp: ${result.data.timestamp}`);
      return true;
    } else {
      log('❌ Health check FAILED', 'red');
      log(`   Status: ${result.status}`);
      log(`   Response: ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    log(`❌ Health check ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function testBalanceEndpoint() {
  log('\n=== Test 2: Balance Endpoint (Arbitrum Sepolia) ===', 'blue');
  log(`Testing: ${ORACLE_URL}/balance/arbitrumSepolia`);
  log(`Receiver: ${TEST_RECEIVER}`);
  log(`Assets: ${TEST_ASSETS}`);
  
  try {
    const result = await makeRequest(`${ORACLE_URL}/balance/arbitrumSepolia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: {
        receiver: TEST_RECEIVER,
        assets: TEST_ASSETS,
      },
    });
    
    if (result.status === 200) {
      const data = result.data;
      
      log('✅ Balance endpoint RESPONDED', 'green');
      log(`   Balance: ${data.balance}`);
      log(`   Nonce: ${data.nonce}`);
      log(`   Deadline: ${data.deadline}`);
      log(`   Agent Address: ${data.agentAddress}`);
      log(`   Signature: ${data.signature ? data.signature.slice(0, 20) + '...' : 'missing'}`);
      
      // Verify expected values
      let allPassed = true;
      
      if (data.balance !== EXPECTED_BALANCE) {
        log(`❌ Balance mismatch! Expected: ${EXPECTED_BALANCE}, Got: ${data.balance}`, 'red');
        allPassed = false;
      } else {
        log(`✅ Balance correct: ${EXPECTED_BALANCE}`, 'green');
      }
      
      if (data.agentAddress?.toLowerCase() !== EXPECTED_AGENT.toLowerCase()) {
        log(`❌ Agent address mismatch! Expected: ${EXPECTED_AGENT}, Got: ${data.agentAddress}`, 'red');
        allPassed = false;
      } else {
        log(`✅ Agent address correct: ${EXPECTED_AGENT}`, 'green');
      }
      
      if (!data.signature || data.signature.length < 130) {
        log(`❌ Signature missing or invalid length`, 'red');
        allPassed = false;
      } else {
        log(`✅ Signature present (${data.signature.length} chars)`, 'green');
      }
      
      if (!data.nonce || data.nonce === undefined) {
        log(`⚠️  Nonce missing`, 'yellow');
      } else {
        log(`✅ Nonce present: ${data.nonce}`, 'green');
      }
      
      if (!data.deadline) {
        log(`❌ Deadline missing`, 'red');
        allPassed = false;
      } else {
        const deadlineDate = new Date(parseInt(data.deadline) * 1000);
        const now = new Date();
        const diffMinutes = (deadlineDate - now) / 1000 / 60;
        log(`✅ Deadline present: ${deadlineDate.toISOString()} (${diffMinutes.toFixed(1)} min from now)`, 'green');
      }
      
      return allPassed;
    } else {
      log(`❌ Balance endpoint FAILED`, 'red');
      log(`   Status: ${result.status}`);
      log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log(`❌ Balance endpoint ERROR: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`);
    return false;
  }
}

async function testAgentEndpoint() {
  log('\n=== Test 3: Agent Address Endpoint ===', 'blue');
  log(`Testing: ${ORACLE_URL}/agent`);
  
  try {
    const result = await makeRequest(`${ORACLE_URL}/agent`);
    
    if (result.status === 200) {
      log('✅ Agent endpoint RESPONDED', 'green');
      log(`   Agent Address: ${result.data.agentAddress}`);
      
      if (result.data.agentAddress?.toLowerCase() === EXPECTED_AGENT.toLowerCase()) {
        log(`✅ Agent address matches expected: ${EXPECTED_AGENT}`, 'green');
        return true;
      } else {
        log(`❌ Agent address mismatch! Expected: ${EXPECTED_AGENT}, Got: ${result.data.agentAddress}`, 'red');
        return false;
      }
    } else {
      log(`⚠️  Agent endpoint returned status ${result.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`⚠️  Agent endpoint ERROR (might not exist): ${error.message}`, 'yellow');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║          PHALA ORACLE TEST SUITE v4.1-fake-balance        ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\nOracle URL: ${ORACLE_URL}`);
  log(`API Key: ${API_KEY.slice(0, 20)}...`);
  log(`Test Receiver: ${TEST_RECEIVER}`);
  log(`Expected Balance: ${EXPECTED_BALANCE} (hardcoded fake value)`);
  log(`Expected Agent: ${EXPECTED_AGENT}`);
  
  const results = {
    health: false,
    balance: false,
    agent: false,
  };
  
  // Run tests
  results.health = await testHealthEndpoint();
  
  if (results.health) {
    results.balance = await testBalanceEndpoint();
    results.agent = await testAgentEndpoint();
  } else {
    log('\n❌ Skipping further tests because health check failed', 'red');
  }
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║                       TEST SUMMARY                         ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\n${results.health ? '✅' : '❌'} Health Check: ${results.health ? 'PASSED' : 'FAILED'}`, results.health ? 'green' : 'red');
  log(`${results.balance ? '✅' : '❌'} Balance Endpoint: ${results.balance ? 'PASSED' : 'FAILED'}`, results.balance ? 'green' : 'red');
  log(`${results.agent ? '✅' : '⚠️ '} Agent Endpoint: ${results.agent ? 'PASSED' : 'N/A'}`, results.agent ? 'green' : 'yellow');
  
  const allPassed = results.health && results.balance;
  
  if (allPassed) {
    log('\n🎉 ALL CRITICAL TESTS PASSED! Oracle is working correctly!', 'green');
    log('\n📝 Next Steps:', 'blue');
    log('   1. Test deposit from frontend on Arbitrum Sepolia');
    log('   2. Frontend should use depositWithExtraInfoViaSignature()');
    log('   3. Transaction should succeed with the hardcoded balance!');
    process.exit(0);
  } else {
    log('\n❌ SOME TESTS FAILED. Please check the oracle logs.', 'red');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});


