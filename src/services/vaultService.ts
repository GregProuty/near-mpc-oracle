import { ethers } from 'ethers';
import { VAULT_ABI } from '../config/abis';
import { logger } from '../utils/logger';

/**
 * Get the agent address (AI_AGENT) from the vault contract
 */
export async function getAgentAddress(
  vaultAddress: string,
  rpcUrl: string,
  chainId: number
): Promise<string> {
  try {
    logger.debug(`Querying AI_AGENT address from vault ${vaultAddress} on chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    
    const agentAddress = await vault.AI_AGENT();

    logger.info(`Agent address from vault: ${agentAddress}`);
    return agentAddress;
  } catch (error) {
    logger.error(`Failed to get agent address from vault ${vaultAddress}:`, error);
    throw new Error(`Failed to get agent address from vault: ${error}`);
  }
}

/**
 * Get the current nonce from the vault contract
 */
export async function getVaultNonce(
  vaultAddress: string,
  rpcUrl: string,
  chainId: number
): Promise<bigint> {
  try {
    logger.debug(`Querying nonce from vault ${vaultAddress} on chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    
    try {
      const nonce = await vault.crossChainBalanceNonce();
      logger.info(`Vault nonce: ${nonce.toString()}`);
      return nonce;
    } catch (contractError: any) {
      // If crossChainBalanceNonce() doesn't exist yet, use nonce 0
      // TODO: Remove this fallback once vault contracts are updated
      if (contractError.code === 'CALL_EXCEPTION') {
        logger.warn(`crossChainBalanceNonce() not found on vault, using nonce 0 (TEMPORARY)`);
        logger.warn(`Edson needs to add this function to the vault contracts`);
        return BigInt(0);
      }
      throw contractError;
    }
  } catch (error) {
    logger.error(`Failed to get nonce from vault ${vaultAddress}:`, error);
    throw new Error(`Failed to get nonce from vault: ${error}`);
  }
}

/**
 * Get cross-chain invested assets from the vault
 */
export async function getCrossChainInvestedAssets(
  vaultAddress: string,
  rpcUrl: string,
  chainId: number
): Promise<bigint> {
  try {
    logger.debug(`Querying cross-chain invested assets from vault ${vaultAddress} on chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    
    const crossChainAssets = await vault.crossChainInvestedAssets();

    logger.info(`Cross-chain invested assets: ${ethers.formatUnits(crossChainAssets, 6)}`);
    return crossChainAssets;
  } catch (error) {
    logger.error(`Failed to get cross-chain assets from vault ${vaultAddress}:`, error);
    throw new Error(`Failed to get cross-chain assets from vault: ${error}`);
  }
}

/**
 * Get total assets from the vault
 */
export async function getVaultTotalAssets(
  vaultAddress: string,
  rpcUrl: string,
  chainId: number
): Promise<bigint> {
  try {
    logger.debug(`Querying total assets from vault ${vaultAddress} on chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    
    const totalAssets = await vault.totalAssets();

    logger.info(`Vault total assets: ${ethers.formatUnits(totalAssets, 6)}`);
    return totalAssets;
  } catch (error) {
    logger.error(`Failed to get total assets from vault ${vaultAddress}:`, error);
    throw new Error(`Failed to get total assets from vault: ${error}`);
  }
}

/**
 * Get total supply (shares) from the vault
 */
export async function getVaultTotalSupply(
  vaultAddress: string,
  rpcUrl: string,
  chainId: number
): Promise<bigint> {
  try {
    logger.debug(`Querying total supply from vault ${vaultAddress} on chain ${chainId}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
    
    const totalSupply = await vault.totalSupply();

    logger.info(`Vault total supply: ${ethers.formatUnits(totalSupply, 6)} shares`);
    return totalSupply;
  } catch (error) {
    logger.error(`Failed to get total supply from vault ${vaultAddress}:`, error);
    throw new Error(`Failed to get total supply from vault: ${error}`);
  }
}

/**
 * Calculate price per unit for the vault
 */
export function calculatePricePerUnit(totalValue: bigint, totalShares: bigint): string {
  if (totalShares === BigInt(0)) {
    return '0';
  }
  
  // Price per unit = totalValue / totalShares
  // Both are in 6 decimals, so result is also 6 decimals
  const pricePerUnit = (totalValue * BigInt(1e6)) / totalShares;
  
  return ethers.formatUnits(pricePerUnit, 6);
}


