import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface VerificationData {
  isVerified: boolean;
  attestationId?: string;
  proof?: any;
  publicSignals?: any;
  timestamp?: number;
  expiresAt?: number;
}

interface SelfVerificationContextType {
  verificationData: VerificationData | null;
  setVerificationData: (data: VerificationData | null) => void;
  isVerified: boolean;
  isVerificationValid: () => boolean;
  clearVerification: () => void;
  requireVerification: boolean;
  setRequireVerification: (required: boolean) => void;
}

const SelfVerificationContext = createContext<SelfVerificationContextType | undefined>(undefined);

export function SelfVerificationProvider({ children }: { children: ReactNode }) {
  const [verificationData, setVerificationDataState] = useState<VerificationData | null>(null);
  const [requireVerification, setRequireVerification] = useState(true); // Enabled by default for Self Protocol integration

  const setVerificationData = useCallback((data: VerificationData | null) => {
    if (data && data.isVerified) {
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      setVerificationDataState({ ...data, timestamp: Date.now(), expiresAt });
    } else {
      setVerificationDataState(data);
    }
  }, []);

  const isVerificationValid = useCallback(() => {
    if (!verificationData || !verificationData.isVerified) return false;
    if (!verificationData.expiresAt) return false;
    return Date.now() < verificationData.expiresAt;
  }, [verificationData]);

  const clearVerification = useCallback(() => {
    setVerificationDataState(null);
  }, []);

  const isVerified = verificationData?.isVerified === true && isVerificationValid();

  return (
    <SelfVerificationContext.Provider
      value={{
        verificationData,
        setVerificationData,
        isVerified,
        isVerificationValid,
        clearVerification,
        requireVerification,
        setRequireVerification,
      }}
    >
      {children}
    </SelfVerificationContext.Provider>
  );
}

export function useSelfVerificationContext() {
  const context = useContext(SelfVerificationContext);
  if (context === undefined) {
    throw new Error('useSelfVerificationContext must be used within a SelfVerificationProvider');
  }
  return context;
}
