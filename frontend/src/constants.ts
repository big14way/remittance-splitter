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
  42220: '0x0000000000000000000000000000000000000000', // TODO: Update after mainnet deployment
  // Alfajores Testnet (Chain ID: 44787)
  44787: '0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88', // Deployed ✅
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

/**
 * Self Protocol Configuration
 */
export const SELF_PROTOCOL_CONFIG = {
  appName: 'Celo Remittance Splitter',
  scope: 'celo-remittance-splitter',
  minimumAge: 18,
  excludedCountries: [] as string[],
  ofac: false,
  verificationValidityMs: 24 * 60 * 60 * 1000, // 24 hours
  // Set to true to require verification for payments
  requireVerification: false,
} as const;
