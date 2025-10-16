export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  aavePoolAddress: string;
  usdcAddress: string;
  vaultAddress?: string;
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  aTokenBalance: string;
  aTokenAddress: string;
  blockNumber: number;
  timestamp: number;
}

export interface VaultBalance {
  chainId: number;
  chainName: string;
  vaultAddress: string;
  usdcBalance: string;
  aTokenBalance: string;
  blockNumber: number;
  timestamp: number;
}

export interface AggregatedBalances {
  totalATokens: string;
  totalUSDC: string;
  totalValue: string;
  agentAddress: string;
  chainBalances: ChainBalance[];
  vaultBalances: VaultBalance[];
  timestamp: number;
}

export interface CrossChainBalanceSnapshot {
  balance: string;      // Total aTokens across all chains
  nonce: string;        // From vault's crossChainBalanceNonce
  deadline: string;     // Unix timestamp
  assets: string;       // Amount to deposit
  receiver: string;     // Receiver of shares
}

export interface SignedBalanceSnapshot {
  snapshot: CrossChainBalanceSnapshot;
  signature: string;
  signatureComponents: {
    r: string;
    s: string;
    v: number;
  };
  signer: string;
  domain: EIP712Domain;
  timestamp: number;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface BalanceSnapshotRequest {
  assets: string;
  receiver: string;
  vaultChainId: number;
  validitySeconds?: number;
}

export interface PoolValueResponse {
  totalATokens: string;
  totalUSDC: string;
  totalValue: string;
  totalShares?: string;
  pricePerUnit?: string;
  agentAddress: string;
  chainBalances: ChainBalance[];
  vaultBalances: VaultBalance[];
  timestamp: number;
}

export interface OracleConfig {
  agentAddress: string;
  supportedChains: string[];
  vaultAddresses: Record<number, string>;
}

