/**
 * Token Addresses
 */
export const CUSD_TOKEN_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as const;

/**
 * Contract Addresses
 * Update these after deploying the RemittanceSplitter contract
 */
export const REMITTANCE_SPLITTER_ADDRESS = {
  // Celo Mainnet (Chain ID: 42220)
  42220: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
  // Alfajores Testnet (Chain ID: 44787)
  44787: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
} as const;

/**
 * Network Configuration
 */
export const SUPPORTED_NETWORKS = {
  CELO_MAINNET: 42220,
  ALFAJORES_TESTNET: 44787,
} as const;

/**
 * cUSD Token Decimals
 */
export const CUSD_DECIMALS = 18;

/**
 * Helper function to get contract address for current chain
 */
export function getRemittanceSplitterAddress(chainId: number): string {
  return REMITTANCE_SPLITTER_ADDRESS[chainId as keyof typeof REMITTANCE_SPLITTER_ADDRESS] || '';
}
