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
      const endpoint = import.meta.env.VITE_SELF_ENDPOINT || 'https://api.self.xyz';

      // Create Self App instance with verification requirements
      // Using https endpoint for API-based verification
      const app = new SelfAppBuilder({
        version: 2,
        appName: appName,
        scope: 'remittance-verification',
        endpoint: endpoint, // Use HTTPS API endpoint
        userId: address,
        endpointType: 'https', // HTTPS API mode
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
