const { ethers } = require('ethers');
const { connect, keyStores, KeyPair } = require('near-api-js');
const BN = require('bn.js');
require('dotenv').config();

const VAULT_ADDRESS = "0xB57D1241fb45B83E10039e9c2EaaB348628f2e03"; // New vault with correct aToken
const CHAIN_ID = 84532; // Base Sepolia
const RPC_URL = "https://sepolia.base.org";

// ABI for updateCrossChainBalance
const VAULT_ABI = [
    "function updateCrossChainBalance(uint256 _crossChainATokenBalance) external"
];

async function main() {
    console.log('🔐 Preparing transaction...');
    
    // Encode the function call
    const iface = new ethers.Interface(VAULT_ABI);
    const data = iface.encodeFunctionData('updateCrossChainBalance', [
        ethers.parseUnits('1000', 6) // Set to 1000 USDC equivalent for testing
    ]);
    
    console.log('   Function: updateCrossChainBalance(1000000000)');
    console.log('   Encoded data:', data);
    console.log('');
    
    // Get current nonce
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const agentAddress = '0x3001bb6aa8beed7db35a05c171dbac32341cdd1a';
    const nonce = await provider.getTransactionCount(agentAddress);
    
    console.log('   Agent address:', agentAddress);
    console.log('   Nonce:', nonce);
    console.log('');
    
    // Build the transaction
    const feeData = await provider.getFeeData();
    const tx = {
        to: VAULT_ADDRESS,
        data: data,
        nonce: nonce,
        chainId: CHAIN_ID,
        gasLimit: 200000n,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        value: 0n,
    };
    
    console.log('📝 Transaction:', tx);
    console.log('');
    
    // Serialize for signing
    const unsignedTx = ethers.Transaction.from(tx);
    const txHash = unsignedTx.unsignedHash;
    const payload = Array.from(ethers.getBytes(txHash));
    
    console.log('🔐 Requesting MPC signature from NEAR...');
    console.log('   Transaction hash:', txHash);
    console.log('');
    
    // Sign with NEAR MPC
    const keyStore = new keyStores.InMemoryKeyStore();
    const nearKeyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
    await keyStore.setKey('testnet', process.env.NEAR_ACCOUNT_ID, nearKeyPair);
    
    const near = await connect({
        networkId: 'testnet',
        keyStore,
        nodeUrl: 'https://rpc.testnet.near.org',
    });
    
    const account = await near.account(process.env.NEAR_ACCOUNT_ID);
    
    const result = await account.functionCall({
        contractId: 'v1.signer-prod.testnet',
        methodName: 'sign',
        args: {
            request: {
                payload,
                path: 'ethereum-1',
                key_version: 0,
            },
        },
        gas: new BN('300000000000000'),
        attachedDeposit: new BN('250000000000000000000000'),
    });
    
    if (!result.status || !result.status.SuccessValue) {
        throw new Error(`MPC signing failed: ${JSON.stringify(result.status)}`);
    }
    
    const returnValue = Buffer.from(result.status.SuccessValue, 'base64').toString();
    const signatureResponse = JSON.parse(returnValue);
    
    const rHex = signatureResponse.big_r.affine_point.slice(2, 66);
    const sHex = signatureResponse.s.scalar;
    const v = signatureResponse.recovery_id;
    
    console.log('✅ Got MPC signature!');
    console.log('   r:', rHex);
    console.log('   s:', sHex);
    console.log('   v:', v);
    console.log('');
    
    // Attach signature to transaction
    unsignedTx.signature = ethers.Signature.from({
        r: '0x' + rHex,
        s: '0x' + sHex,
        v: v,
    });
    
    const signedTx = unsignedTx.serialized;
    
    console.log('📤 Broadcasting transaction...');
    const txResponse = await provider.broadcastTransaction(signedTx);
    
    console.log('✅ Transaction sent!');
    console.log('   Tx Hash:', txResponse.hash);
    console.log('   View: https://sepolia.basescan.org/tx/' + txResponse.hash);
    console.log('');
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await txResponse.wait();
    
    if (receipt.status === 1) {
        console.log('✅ Transaction confirmed!');
        console.log('   Block:', receipt.blockNumber);
    } else {
        console.log('❌ Transaction failed!');
    }
}

main().catch(console.error);

