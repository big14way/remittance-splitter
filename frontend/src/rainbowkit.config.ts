import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo, celoAlfajores } from 'wagmi/chains';

// WalletConnect Project ID from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set in environment variables');
}

/**
 * RainbowKit Configuration
 * Pre-configured with Celo networks and WalletConnect
 */
export const rainbowKitConfig = getDefaultConfig({
  appName: 'Celo Remittance Splitter',
  projectId,
  chains: [celo, celoAlfajores],
  ssr: false, // Set to true if using server-side rendering
});
