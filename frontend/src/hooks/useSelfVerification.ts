import { useState, useEffect, useCallback, useMemo } from 'react';
import { SelfAppBuilder, countries, type SelfApp } from '@selfxyz/qrcode';
import { useSelfVerificationContext } from '../contexts/SelfVerificationContext';

// Country code type (3-letter ISO codes)
type CountryCode = keyof typeof countries;

// Self Protocol configuration interface
export interface SelfVerificationConfig {
  minimumAge?: number;
  excludedCountries?: string[];
  ofac?: boolean;
  appName?: string;
  scope?: string;
  endpoint?: string;
}

// Default configuration
const DEFAULT_CONFIG: SelfVerificationConfig = {
  minimumAge: 18,
  excludedCountries: [],
  ofac: false,
  appName: 'Celo Remittance Splitter',
  scope: 'celo-remittance-splitter',
};

interface UseSelfVerificationReturn {
  selfApp: SelfApp | null;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  verificationExpiry: number | null;
  startVerification: () => void;
  handleVerificationSuccess: () => void;
  handleVerificationError: (error: Error) => void;
  clearVerification: () => void;
  config: SelfVerificationConfig;
}

export function useSelfVerification(
  userId: string | undefined,
  customConfig?: Partial<SelfVerificationConfig>
): UseSelfVerificationReturn {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isVerified,
    setVerificationData,
    clearVerification,
    verificationExpiry,
  } = useSelfVerificationContext();

  // Merge default config with custom config
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...customConfig,
  }), [customConfig]);

  // Initialize Self App when userId is available
  useEffect(() => {
    if (!userId) {
      setSelfApp(null);
      return;
    }

    try {
      // Get endpoint from environment or use a mock for demo
      const endpoint = import.meta.env.VITE_SELF_ENDPOINT ||
        `${window.location.origin}/api/verify`;

      // Convert string country codes to the expected Country type
      const excludedCountryCodes = config.excludedCountries
        ?.map(code => countries[code.toUpperCase() as CountryCode])
        .filter((c): c is typeof countries[CountryCode] => c !== undefined);

      const app = new SelfAppBuilder({
        appName: config.appName || DEFAULT_CONFIG.appName!,
        scope: config.scope || DEFAULT_CONFIG.scope!,
        endpoint: endpoint,
        userId: userId,
        // Use staging for testnet, production for mainnet
        endpointType: 'staging_https',
        userIdType: 'hex',
        disclosures: {
          minimumAge: config.minimumAge,
          excludedCountries: excludedCountryCodes,
          ofac: config.ofac,
        },
      }).build();

      setSelfApp(app);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize Self App:', err);
      setError('Failed to initialize verification');
      setSelfApp(null);
    }
  }, [userId, config]);

  // Start verification process
  const startVerification = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  // Handle successful verification
  const handleVerificationSuccess = useCallback(() => {
    setIsLoading(false);
    setError(null);

    // Store verification data (minimal data since callback doesn't provide details)
    setVerificationData({
      attestationId: `self-${Date.now()}`,
      proof: null,
      publicSignals: null,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
  }, [setVerificationData]);

  // Handle verification error
  const handleVerificationError = useCallback((err: Error) => {
    setIsLoading(false);
    setError(err.message || 'Verification failed');
    console.error('Verification error:', err);
  }, []);

  return {
    selfApp,
    isVerified,
    isLoading,
    error,
    verificationExpiry,
    startVerification,
    handleVerificationSuccess,
    handleVerificationError,
    clearVerification,
    config,
  };
}

export default useSelfVerification;
