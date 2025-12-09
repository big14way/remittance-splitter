import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Verification data structure
interface VerificationData {
  attestationId: string;
  proof: unknown;
  publicSignals: unknown;
  timestamp: number;
  expiresAt: number;
}

// Context interface
interface SelfVerificationContextType {
  verificationData: VerificationData | null;
  setVerificationData: (data: VerificationData | null) => void;
  isVerified: boolean;
  isVerificationValid: () => boolean;
  clearVerification: () => void;
  verificationRequired: boolean;
  setVerificationRequired: (required: boolean) => void;
  verificationExpiry: number | null;
}

// Default context value
const SelfVerificationContext = createContext<SelfVerificationContextType | undefined>(undefined);

// Verification validity period (24 hours in milliseconds)
const VERIFICATION_VALIDITY_MS = 24 * 60 * 60 * 1000;

// Local storage key
const STORAGE_KEY = 'self_verification_data';

interface SelfVerificationProviderProps {
  children: ReactNode;
  requireVerification?: boolean;
}

export function SelfVerificationProvider({
  children,
  requireVerification = false
}: SelfVerificationProviderProps) {
  const [verificationData, setVerificationDataState] = useState<VerificationData | null>(() => {
    // Try to load from localStorage on mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as VerificationData;
          // Check if verification is still valid
          if (parsed.expiresAt > Date.now()) {
            return parsed;
          }
          // Clean up expired data
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  });

  const [verificationRequired, setVerificationRequired] = useState(requireVerification);

  // Check if user is verified (has valid, non-expired verification)
  const isVerificationValid = useCallback(() => {
    if (!verificationData) return false;
    return verificationData.expiresAt > Date.now();
  }, [verificationData]);

  const isVerified = verificationData !== null && isVerificationValid();

  // Set verification data and persist to localStorage
  const setVerificationData = useCallback((data: VerificationData | null) => {
    if (data) {
      // Add expiry if not present
      const dataWithExpiry: VerificationData = {
        ...data,
        timestamp: data.timestamp || Date.now(),
        expiresAt: data.expiresAt || Date.now() + VERIFICATION_VALIDITY_MS,
      };
      setVerificationDataState(dataWithExpiry);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithExpiry));
      }
    } else {
      setVerificationDataState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Clear verification data
  const clearVerification = useCallback(() => {
    setVerificationData(null);
  }, [setVerificationData]);

  // Clean up expired verification on mount and periodically
  useEffect(() => {
    const checkExpiry = () => {
      if (verificationData && verificationData.expiresAt <= Date.now()) {
        clearVerification();
      }
    };

    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [verificationData, clearVerification]);

  const value: SelfVerificationContextType = {
    verificationData,
    setVerificationData,
    isVerified,
    isVerificationValid,
    clearVerification,
    verificationRequired,
    setVerificationRequired,
    verificationExpiry: verificationData?.expiresAt || null,
  };

  return (
    <SelfVerificationContext.Provider value={value}>
      {children}
    </SelfVerificationContext.Provider>
  );
}

// Hook to use the verification context
export function useSelfVerificationContext(): SelfVerificationContextType {
  const context = useContext(SelfVerificationContext);
  if (context === undefined) {
    throw new Error('useSelfVerificationContext must be used within a SelfVerificationProvider');
  }
  return context;
}

export default SelfVerificationContext;
