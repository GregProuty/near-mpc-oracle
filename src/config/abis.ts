// AAVE Pool ABI - getReserveData to get aToken address
export const AAVE_POOL_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'currentLiquidityRate', type: 'uint256' },
          { internalType: 'uint256', name: 'currentStableBorrowRate', type: 'uint256' },
          { internalType: 'uint256', name: 'currentVariableBorrowRate', type: 'uint256' },
          { internalType: 'uint256', name: 'liquidityIndex', type: 'uint256' },
          { internalType: 'uint256', name: 'variableBorrowIndex', type: 'uint256' },
          { internalType: 'uint40', name: 'lastUpdateTimestamp', type: 'uint40' },
          { internalType: 'address', name: 'aTokenAddress', type: 'address' },
          { internalType: 'address', name: 'stableDebtTokenAddress', type: 'address' },
          { internalType: 'address', name: 'variableDebtTokenAddress', type: 'address' },
          { internalType: 'address', name: 'interestRateStrategyAddress', type: 'address' },
          { internalType: 'uint128', name: 'accruedToTreasury', type: 'uint128' },
          { internalType: 'uint128', name: 'unbacked', type: 'uint128' },
          { internalType: 'uint128', name: 'isolationModeTotalDebt', type: 'uint128' },
        ],
        internalType: 'struct DataTypes.ReserveData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI for token balances
export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Vault ABI for querying nonce, agent address, and shares
export const VAULT_ABI = [
  {
    inputs: [],
    name: 'AI_AGENT',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'crossChainBalanceNonce',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'crossChainInvestedAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;


