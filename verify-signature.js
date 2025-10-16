#!/usr/bin/env node

/**
 * Verify MPC signature offline before calling vault contract
 * This proves the oracle is generating valid signatures
 */

const { ethers } = require('ethers');
const fs = require('fs');

async function verifySignature() {
  console.log('🔍 Verifying MPC Signature Offline\n');

  // Load snapshot
  const snapshot = JSON.parse(fs.readFileSync('/tmp/snapshot.json', 'utf8'));
  
  console.log('📋 Snapshot Data:');
  console.log(`   Balance: ${snapshot.balance}`);
  console.log(`   Nonce: ${snapshot.nonce}`);
  console.log(`   Deadline: ${snapshot.deadline}`);
  console.log(`   Assets: ${snapshot.assets}`);
  console.log(`   Receiver: ${snapshot.receiver}`);
  console.log(`   Agent Address: ${snapshot.agentAddress}`);
  console.log(`   Signature: ${snapshot.signature.slice(0, 20)}...${snapshot.signature.slice(-20)}\n`);

  // Define EIP-712 domain (must match exactly what oracle uses)
  const domain = {
    name: 'AaveVault',
    version: '1',
    chainId: 84532, // Base Sepolia
    verifyingContract: '0x565FDe3703d1bCc7Cbe161488ee1498ae429A145', // Base vault - ACTUAL ADDRESS
  };

  // Define types
  const types = {
    CrossChainBalanceSnapshot: [
      { name: 'balance', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
  };

  // The message to sign
  const value = {
    balance: snapshot.balance,
    nonce: snapshot.nonce,
    deadline: snapshot.deadline,
    assets: snapshot.assets,
    receiver: snapshot.receiver,
  };

  console.log('🔐 Computing EIP-712 hash...');
  const hash = ethers.TypedDataEncoder.hash(domain, types, value);
  console.log(`   Hash: ${hash}\n`);

  console.log('✍️  Recovering signer from signature...');
  const recoveredAddress = ethers.verifyTypedData(domain, types, value, snapshot.signature);
  console.log(`   Recovered: ${recoveredAddress}`);
  console.log(`   Expected:  ${snapshot.agentAddress}\n`);

  if (recoveredAddress.toLowerCase() === snapshot.agentAddress.toLowerCase()) {
    console.log('✅ SIGNATURE VALID!');
    console.log('   The MPC signature correctly signs the balance snapshot');
    console.log(`   Signer: ${recoveredAddress}\n`);
    
    console.log('📝 Vault Contract Status:');
    console.log(`   Current AI_AGENT on vault: 0xD5aC5A88dd3F1FE5dcC3ac97B512Faeb48d06AF0`);
    console.log(`   Required AI_AGENT: ${snapshot.agentAddress}`);
    console.log('   ❌ MISMATCH\n');
    
    console.log('🔧 Next Step:');
    console.log('   Edson needs to update AI_AGENT on the vault contract to:');
    console.log(`   ${snapshot.agentAddress}\n`);
    
    console.log('🎯 Once AI_AGENT is updated:');
    console.log('   ✅ Signature will verify on-chain');
    console.log('   ✅ depositWithExtraInfoViaSignature() will succeed');
    console.log('   ✅ Full multichain oracle integration complete!');
    
    return true;
  } else {
    console.log('❌ SIGNATURE INVALID!');
    console.log(`   Expected signer: ${snapshot.agentAddress}`);
    console.log(`   Actual signer: ${recoveredAddress}`);
    console.log('   This indicates an issue with the MPC signing process.');
    return false;
  }
}

verifySignature()
  .then(valid => process.exit(valid ? 0 : 1))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

