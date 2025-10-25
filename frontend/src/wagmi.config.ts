import { http, createConfig } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// cUSD token address on Celo mainnet
export const CUSD_TOKEN_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as const;

// WalletConnect Project ID from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. Please add VITE_WALLETCONNECT_PROJECT_ID to your .env file');
}

// Configure chains for the application
export const chains = [celo, celoAlfajores] as const;

// Create wagmi configuration
export const config = createConfig({
  chains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId: projectId || '',
      metadata: {
        name: 'Celo Remittance Splitter',
        description: 'Split cUSD payments to multiple recipients',
        url: 'https://remittance-splitter.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
});

// Re-export for convenience
export { celo, celoAlfajores };
