const { ethers } = require('ethers');
const { NearMpcService } = require('./dist/services/nearMpcService');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const VAULT_ADDRESS = "0xB57D1241fb45B83E10039e9c2EaaB348628f2e03"; // New vault with correct aToken
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const CHAIN_ID = 84532;
const RPC_URL = "https://sepolia.base.org";

// Load deployer key from .env.deployment
function loadDeployerKey() {
    const envPath = path.join(__dirname, '.env.deployment');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/DEPLOYER_PRIVATE_KEY=(.+)/);
        if (match) {
            return match[1].trim();
        }
    }
    throw new Error('DEPLOYER_PRIVATE_KEY not found in .env.deployment');
}

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Full Deposit Flow Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const depositorKey = loadDeployerKey();
    const depositor = new ethers.Wallet(depositorKey, provider);
    
    console.log('Configuration:');
    console.log('  Depositor:', depositor.address);
    console.log('  Vault:', VAULT_ADDRESS);
    console.log('');
    
    // Get vault state
    const vault = new ethers.Contract(
        VAULT_ADDRESS,
        [
            'function crossChainInvestedAssets() view returns (uint256)',
            'function crossChainBalanceNonce() view returns (uint256)',
            'function depositWithExtraInfoViaSignature(uint256,address,(uint256,uint256,uint256,uint256,address),bytes) returns (uint256)'
        ],
        depositor
    );
    
    const crossChainAssets = await vault.crossChainInvestedAssets();
    const nonce = await vault.crossChainBalanceNonce();
    
    console.log('Vault State:');
    console.log('  crossChainInvestedAssets:', crossChainAssets.toString());
    console.log('  nonce:', nonce.toString());
    console.log('');
    
    // Build snapshot
    const depositAmount = ethers.parseUnits('1', 6); // 1 USDC
    const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
    
    const snapshot = {
        balance: crossChainAssets, // Use the vault's crossChainInvestedAssets
        nonce: nonce,
        deadline: BigInt(deadline),
        assets: depositAmount,
        receiver: depositor.address,
    };
    
    console.log('Snapshot to sign:');
    console.log('  balance:', snapshot.balance.toString());
    console.log('  nonce:', snapshot.nonce.toString());
    console.log('  deadline:', snapshot.deadline.toString());
    console.log('  assets:', snapshot.assets.toString());
    console.log('  receiver:', snapshot.receiver);
    console.log('');
    
    // Get signature from NEAR MPC
    console.log('🔐 Requesting signature from NEAR MPC...');
    const nearMpc = new NearMpcService();
    await nearMpc.initialize();
    
    const { signature, agentAddress } = await nearMpc.signBalanceSnapshot(
        snapshot,
        VAULT_ADDRESS,
        CHAIN_ID
    );
    
    console.log('✅ Got signature!');
    console.log('  Agent:', agentAddress);
    console.log('  Signature:', signature);
    console.log('');
    
    // Check USDC allowance
    const usdc = new ethers.Contract(
        USDC_ADDRESS,
        ['function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)'],
        depositor
    );
    
    const allowance = await usdc.allowance(depositor.address, VAULT_ADDRESS);
    console.log('USDC Allowance:', allowance.toString());
    
    if (allowance < depositAmount) {
        console.log('  Approving vault...');
        const approveTx = await usdc.approve(VAULT_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
        console.log('  ✅ Approved!');
    }
    console.log('');
    
    // Execute deposit
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Calling depositWithExtraInfoViaSignature...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    try {
        // Pass snapshot as a tuple (array) for Solidity struct
        const snapshotTuple = [
            snapshot.balance,
            snapshot.nonce,
            snapshot.deadline,
            snapshot.assets,
            snapshot.receiver
        ];
        
        const tx = await vault.depositWithExtraInfoViaSignature(
            snapshot.assets,
            snapshot.receiver,
            snapshotTuple,
            signature
        );
        
        console.log('✅ Transaction sent!');
        console.log('  Tx Hash:', tx.hash);
        console.log('  View: https://sepolia.basescan.org/tx/' + tx.hash);
        console.log('');
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log('');
            console.log('🎉🎉🎉 DEPOSIT SUCCESSFUL! 🎉🎉🎉');
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ FULL END-TO-END TEST COMPLETE!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
            console.log('What just happened:');
            console.log('  1. User requests deposit ✅');
            console.log('  2. Oracle signs balance snapshot via NEAR MPC ✅');
            console.log('  3. User deposits with oracle signature ✅');
            console.log('  4. Vault verifies signature matches AI_AGENT ✅');
            console.log('  5. Deposit executed successfully ✅');
            console.log('');
            console.log('🚀 The oracle is PRODUCTION READY!');
        } else {
            console.log('❌ Transaction failed!');
        }
    } catch (error) {
        console.log('❌ Deposit failed!');
        console.error(error.shortMessage || error.message);
    }
}

main().catch(console.error);

