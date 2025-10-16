// Ensure dotenv is loaded
import dotenv from 'dotenv';
dotenv.config();

import { connect, keyStores, KeyPair, Contract, providers, transactions, utils } from 'near-api-js';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { logger } from '../utils/logger';
import BN from 'bn.js';
import * as secp256k1 from 'secp256k1';
import { SHA3 } from 'sha3';
import { keccak256 } from 'js-sha3';

export interface CrossChainBalanceSnapshot {
  balance: string;
  nonce: string;
  deadline: string;
  assets: string;
  receiver: string;
}

export interface MpcSignatureResponse {
  signature: string;
  agentAddress: string;
}

/**
 * NEAR MPC Service - Calls v1.signer-prod.testnet to sign balance snapshots
 */
export class NearMpcService {
  private provider: providers.JsonRpcProvider;
  private mpcContractId: string = 'v1.signer-prod.testnet';
  private path: string = 'ethereum-1';
  private rootPublicKey: string | null = null;
  private agentAddress: string | null = null;
  private isInitialized: boolean = false;
  private nearAccountId: string;
  private nearKeyPair: KeyPair;

  constructor() {
    const rpcUrl = process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org';
    this.provider = new providers.JsonRpcProvider({ url: rpcUrl });

    // Load NEAR credentials from environment
    if (!process.env.NEAR_ACCOUNT_ID || !process.env.NEAR_PRIVATE_KEY) {
      throw new Error('NEAR credentials required: Set NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY in .env');
    }
    
    this.nearAccountId = process.env.NEAR_ACCOUNT_ID;
    this.nearKeyPair = KeyPair.fromString(process.env.NEAR_PRIVATE_KEY);
    logger.info(`NEAR account configured: ${this.nearAccountId}`);
  }

  // Initialize connection to NEAR MPC
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Connecting to NEAR MPC signer');

      // Get root public key from MPC contract
      const result: any = await this.provider.query({
        request_type: 'call_function',
        finality: 'final',
        account_id: this.mpcContractId,
        method_name: 'public_key',
        args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
      });

      const publicKeyStr = JSON.parse(Buffer.from(result.result).toString());
      this.rootPublicKey = publicKeyStr.replace('secp256k1:', '');

      logger.info(`MPC Root public key: ${this.rootPublicKey?.substring(0, 16)}...`);

      // Derive agent's EVM address
      this.agentAddress = await this.deriveEVMAddress();

      this.isInitialized = true;
      logger.info(`Connected to NEAR MPC. Agent address: ${this.agentAddress}`);
    } catch (error) {
      logger.error('Failed to initialize NEAR MPC connection:', error);
      throw error;
    }
  }

  // Derive EVM address from root public key + account + path using NEAR MPC KDF
  private async deriveEVMAddress(): Promise<string> {
    if (!this.rootPublicKey) {
      throw new Error('Root public key not initialized');
    }

    try {
      // Derive epsilon using SHA3-256 (not Ethereum keccak256)
      // epsilon = SHA3-256("near-mpc-recovery v0.1.0 epsilon derivation:" + predecessor_id + "," + path)
      const EPSILON_DERIVATION_PREFIX = 'near-mpc-recovery v0.1.0 epsilon derivation:';
      const derivationString = `${EPSILON_DERIVATION_PREFIX}${this.nearAccountId},${this.path}`;
      
      logger.debug(`Derivation string: ${derivationString}`);
      
      // Use proper FIPS SHA3-256
      const sha3 = new SHA3(256);
      sha3.update(derivationString);
      const epsilonHash = Buffer.from(sha3.digest());
      logger.debug(`Epsilon: ${epsilonHash.toString('hex').slice(0, 32)}...`);
      
      // Step 2: Parse root public key (decode base58)
      const rootPkBase58 = this.rootPublicKey;
      let rootPkBytes = utils.serialize.base_decode(rootPkBase58);
      logger.debug(`Root PK bytes length (raw): ${rootPkBytes.length}`);
      logger.debug(`Root PK first bytes: ${Buffer.from(rootPkBytes).toString('hex').slice(0, 20)}...`);
      
      // Ensure root PK is in uncompressed format (65 bytes starting with 0x04)
      if (rootPkBytes.length === 64) {
        // Missing the 0x04 prefix, add it
        rootPkBytes = Buffer.concat([Buffer.from([0x04]), Buffer.from(rootPkBytes)]);
        logger.debug(`Added 0x04 prefix, new length: ${rootPkBytes.length}`);
      } else if (rootPkBytes.length === 33) {
        // Compressed format, convert to uncompressed
        rootPkBytes = secp256k1.publicKeyConvert(rootPkBytes, false);
        logger.debug(`Converted to uncompressed, new length: ${rootPkBytes.length}`);
      }
      
      // Step 3: Derive public key using elliptic curve arithmetic
      // derived_pk = G * epsilon + root_pk
      // First, multiply generator point by epsilon (this gives us G * epsilon)
      const epsilonPoint = secp256k1.publicKeyCreate(epsilonHash, false); // Uncompressed
      logger.debug(`Epsilon point length: ${epsilonPoint.length}`);
      
      // Then add root_pk (elliptic curve point addition)
      // derived_pk = root_pk + (G * epsilon)
      const derivedPkBytes = secp256k1.publicKeyCombine([Buffer.from(rootPkBytes), Buffer.from(epsilonPoint)], false);
      logger.debug(`Derived PK: ${Buffer.from(derivedPkBytes).toString('hex').slice(0, 32)}...`);
      
      // Step 4: Convert to EVM address
      // EVM address = keccak256(uncompressed_public_key)[12:]
      // Skip first byte (0x04) of uncompressed public key
      const pkForHashing = derivedPkBytes.slice(1);
      const addressHash = Buffer.from(keccak256.create().update(pkForHashing).digest());
      const address = '0x' + addressHash.slice(-20).toString('hex');
      
      logger.info(`Derived EVM address: ${address}`);
      logger.info(`   From: ${this.nearAccountId} + ${this.path}`);
      
      return address;
    } catch (error) {
      logger.error('Failed to derive EVM address:', error);
      throw error;
    }
  }

  // Sign balance snapshot using NEAR MPC (creates EIP-712 hash and requests signature)
  async signBalanceSnapshot(
    snapshot: CrossChainBalanceSnapshot,
    vaultAddress: string,
    chainId: number
  ): Promise<MpcSignatureResponse> {
    await this.initialize();

    try {
      logger.info('Requesting MPC signature for balance snapshot');
      
      // Normalize address to checksummed format
      const normalizedSnapshot = {
        ...snapshot,
        receiver: ethers.getAddress(snapshot.receiver),
      };
      
      logger.debug('Normalized snapshot:', {
        balance: snapshot.balance.toString(),
        nonce: snapshot.nonce.toString(),
        deadline: snapshot.deadline.toString(),
        assets: snapshot.assets.toString(),
        receiver: normalizedSnapshot.receiver
      });

      // Create EIP-712 hash
      const domain = {
        name: 'AaveVault',
        version: '1',
        chainId,
        verifyingContract: vaultAddress,
      };

      const types = {
        CrossChainBalanceSnapshot: [
          { name: 'balance', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'assets', type: 'uint256' },
          { name: 'receiver', type: 'address' },
        ],
      };

      const hash = ethers.TypedDataEncoder.hash(domain, types, normalizedSnapshot);
      logger.debug(`EIP-712 hash: ${hash}`);

      // Convert hash to payload for NEAR MPC
      const hashBytes = ethers.getBytes(hash);
      const payload = Array.from(hashBytes);

      logger.info('Sending NEAR transaction to MPC contract');
      
      // Prepare transaction arguments
      const args = {
        request: {
          payload,
          path: this.path,
          key_version: 0,
        },
      };

      // Connect to NEAR and call the MPC contract
      const keyStore = new keyStores.InMemoryKeyStore();
      await keyStore.setKey('testnet', this.nearAccountId, this.nearKeyPair);

      const near = await connect({
        networkId: 'testnet',
        keyStore,
        nodeUrl: process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org',
      });

      const account = await near.account(this.nearAccountId);

      // Call MPC sign method
      logger.info(`Calling ${this.mpcContractId}.sign()`);
      logger.info(`  Payload hash: ${hash}`);
      logger.info(`  Payload bytes: [${payload.slice(0, 8).join(', ')}...]`);
      logger.info(`  Path: ${this.path}`);
      logger.info(`  Key version: 0`);
      
      const result: any = await account.functionCall({
        contractId: this.mpcContractId,
        methodName: 'sign',
        args,
        gas: new BN('300000000000000'),
        attachedDeposit: new BN('250000000000000000000000'),
      });

      logger.info('NEAR transaction successful');
      logger.debug('Full transaction result:', JSON.stringify(result, null, 2));

      // Parse the return value from transaction outcome
      if (!result.status || !result.status.SuccessValue) {
        throw new Error(`Transaction failed: ${JSON.stringify(result.status)}`);
      }

      const returnValue = Buffer.from(result.status.SuccessValue, 'base64').toString();
      const signatureResponse = JSON.parse(returnValue);
      logger.info('MPC signature response received');
      logger.debug('Full MPC response:', signatureResponse);

      // Parse signature components from MPC response
      const affinePointHex = signatureResponse.big_r.affine_point;
      const sScalarHex = signatureResponse.s.scalar;
      const recoveryId = signatureResponse.recovery_id;
      
      logger.info(`  Affine point: ${affinePointHex.slice(0, 20)}...`);
      logger.info(`  S scalar: ${sScalarHex.slice(0, 20)}...`);
      logger.info(`  Recovery ID: ${recoveryId}`);
      
      // Extract r from affine point (skip format byte, take next 32 bytes)
      const rHex = affinePointHex.slice(2, 66);
      const sHex = sScalarHex;
      // Convert recovery_id (0 or 1) to Ethereum v (27 or 28)
      const v = recoveryId + 27;

      // Format signature using ethers.js for OpenZeppelin compatibility
      const sig = ethers.Signature.from({
        r: '0x' + rHex,
        s: '0x' + sHex,
        v: v
      });
      
      const mpcSignature = sig.serialized;

      logger.info('MPC signature generated successfully');
      logger.info(`  Signature: ${mpcSignature.slice(0, 20)}...${mpcSignature.slice(-6)}`);
      logger.info(`  v = ${v} (recovery_id ${recoveryId} + 27)`);
      logger.info(`  Using ethers.Signature.serialized format`);

      return {
        signature: mpcSignature,
        agentAddress: this.agentAddress!,
      };
    } catch (error) {
      logger.error('Failed to get MPC signature:', error);
      throw new Error(`MPC signing failed: ${error}`);
    }
  }

  // Get agent's EVM address
  async getAgentAddress(): Promise<string> {
    await this.initialize();
    return this.agentAddress!;
  }
}

// Global instance
let nearMpcInstance: NearMpcService | null = null;

// Initialize global NEAR MPC service
export function initializeNearMpc(): NearMpcService {
  if (!nearMpcInstance) {
    nearMpcInstance = new NearMpcService();
  }
  return nearMpcInstance;
}

// Get global NEAR MPC service instance
export function getNearMpc(): NearMpcService {
  if (!nearMpcInstance) {
    nearMpcInstance = new NearMpcService();
  }
  return nearMpcInstance;
}

