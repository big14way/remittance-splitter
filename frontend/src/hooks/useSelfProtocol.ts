import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { SelfAppBuilder } from '@selfxyz/qrcode';
import type { SelfApp } from '@selfxyz/qrcode';

interface VerificationResult {
  isVerified: boolean;
  attestationId?: string;
  proof?: any;
  publicSignals?: any;
}

interface UseSelfProtocolReturn {
  selfApp: SelfApp | null;
  isInitializing: boolean;
  error: string | null;
  createVerificationRequest: () => SelfApp | null;
}

export function useSelfProtocol(): UseSelfProtocolReturn {
  const { address } = useAccount();
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVerificationRequest = useCallback((): SelfApp | null => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Get environment variables
      const appName = import.meta.env.VITE_SELF_APP_NAME || 'Celo Remittance Splitter';

      // Create Self App instance with verification requirements
      // Using staging_celo for on-chain verification on Alfajores testnet (no backend needed)
      const app = new SelfAppBuilder({
        version: 2,
        appName: appName,
        scope: 'remittance-verification',
        endpoint: address.toLowerCase(), // User's wallet address for on-chain verification
        userId: address,
        endpointType: 'staging_celo', // Alfajores testnet on-chain verification
        userIdType: 'hex',
        disclosures: {
          // Minimum age verification (18+)
          minimumAge: 18,
          // Nationality verification (for compliance)
          nationality: true,
        },
      }).build();

      setSelfApp(app);
      setIsInitializing(false);
      return app;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create verification request';
      setError(errorMessage);
      setIsInitializing(false);
      return null;
    }
  }, [address]);

  // Auto-create verification request when address changes
  useEffect(() => {
    if (address) {
      createVerificationRequest();
    } else {
      setSelfApp(null);
    }
  }, [address, createVerificationRequest]);

  return {
    selfApp,
    isInitializing,
    error,
    createVerificationRequest,
  };
}

export type { VerificationResult };
