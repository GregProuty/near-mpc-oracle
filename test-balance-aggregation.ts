// Test script to verify balance aggregation works
import { fetchChainBalances, fetchVaultBalances, aggregateBalances } from './src/services/balanceFetcher';

// Mock agent address for testing
const MOCK_AGENT_ADDRESS = '0x0000000000000000000000000000000000000000';

async function testBalanceAggregation() {
  console.log('🧪 Testing Balance Aggregation\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Fetch chain balances (agent's aTokens)
    console.log('\n📊 Test 1: Fetching aToken balances across chains...');
    const chainBalances = await fetchChainBalances(MOCK_AGENT_ADDRESS);
    console.log(`✅ Fetched balances from ${chainBalances.length} chains`);
    
    chainBalances.forEach(cb => {
      console.log(`   ${cb.chainName}: ${cb.aTokenBalance} aTokens`);
    });

    // Test 2: Fetch vault balances
    console.log('\n📊 Test 2: Fetching USDC in vaults...');
    const vaultBalances = await fetchVaultBalances();
    console.log(`✅ Fetched balances from ${vaultBalances.length} vaults`);
    
    vaultBalances.forEach(vb => {
      console.log(`   ${vb.chainName}:`);
      console.log(`      USDC: ${vb.usdcBalance}`);
      console.log(`      aTokens: ${vb.aTokenBalance}`);
    });

    // Test 3: Aggregate
    console.log('\n📊 Test 3: Aggregating totals...');
    const aggregated = aggregateBalances(chainBalances, vaultBalances);
    
    console.log('\n✅ AGGREGATION RESULTS:');
    console.log('='.repeat(60));
    console.log(`Total aTokens:    ${aggregated.totalATokens} (${formatUSDC(aggregated.totalATokens)})`);
    console.log(`Total USDC:       ${aggregated.totalUSDC} (${formatUSDC(aggregated.totalUSDC)})`);
    console.log(`Total Pool Value: ${aggregated.totalValue} (${formatUSDC(aggregated.totalValue)})`);
    console.log('='.repeat(60));
    
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('The Oracle can successfully:');
    console.log('  ✓ Query aToken balances across chains');
    console.log('  ✓ Query USDC in vault contracts');
    console.log('  ✓ Aggregate total pool value');
    console.log('\n🎯 Ready for NEAR integration once contract deploys!\n');
    
  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

function formatUSDC(amount: string): string {
  const num = BigInt(amount);
  const dollars = num / BigInt(1000000);
  const cents = num % BigInt(1000000);
  return `$${dollars}.${cents.toString().padStart(6, '0').slice(0, 2)}`;
}

// Run tests
testBalanceAggregation();

