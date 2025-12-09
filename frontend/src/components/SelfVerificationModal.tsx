import { useState, useEffect } from 'react';
import { SelfQRcodeWrapper } from '@selfxyz/qrcode';
import { useSelfProtocol } from '../hooks/useSelfProtocol';
import type { VerificationResult } from '../hooks/useSelfProtocol';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (result: VerificationResult) => void;
  minimumAge?: number;
  excludedCountries?: string[];
}

export function SelfVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
  minimumAge = 18,
  excludedCountries: _excludedCountries = [],
}: SelfVerificationModalProps) {
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const { selfApp, isInitializing, error: hookError } = useSelfProtocol();

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerificationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerificationSuccess = (result?: any) => {
    console.log('Verification successful:', result);

    // Extract verification data from Self Protocol response
    onVerificationComplete({
      isVerified: true,
      attestationId: result?.attestationId,
      proof: result?.proof,
      publicSignals: result?.publicSignals,
    });

    onClose();
  };

  const handleVerificationError = (err?: any) => {
    console.error('Verification error details:', err);

    let errorMessage = 'Verification failed. ';

    // Provide specific error messages based on error type
    if (err?.message) {
      if (err.message.includes('ScopeMismatch')) {
        errorMessage += 'Configuration mismatch detected. Please contact support.';
      } else if (err.message.includes('InvalidIdentityCommitmentRoot')) {
        errorMessage += 'Invalid passport type for this network. Please use a valid passport.';
      } else if (err.message.includes('network')) {
        errorMessage += 'Network connection issue. Please check your internet and try again.';
      } else {
        errorMessage += err.message;
      }
    } else {
      errorMessage += 'Please ensure you have the Self mobile app installed and try again.';
    }

    setVerificationError(errorMessage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h2>
          <p className="text-gray-600">
            Verify your identity using Self Protocol for privacy-preserving KYC
          </p>
        </div>

        {/* Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Requirements:</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Age {minimumAge}+ verification
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              OFAC sanctions screening
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Nationality verification
            </li>
          </ul>
        </div>

        {/* Privacy Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Privacy First
          </h3>
          <p className="text-sm text-purple-800">
            Your personal data never leaves your device. We only verify the required attributes using zero-knowledge proofs.
          </p>
        </div>

        {/* Error Display */}
        {(verificationError || hookError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">Verification Error</p>
                <p className="text-sm text-red-700">{verificationError || hookError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Real Self Protocol QR Code */}
        <div className="bg-gray-100 rounded-lg p-8 mb-6 flex flex-col items-center justify-center">
          {isInitializing ? (
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Initializing verification...</p>
            </div>
          ) : selfApp ? (
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleVerificationSuccess}
                  onError={handleVerificationError}
                />
              </div>
              <p className="text-sm text-gray-600 text-center max-w-xs">
                Scan this QR code with the Self mobile app to complete your identity verification
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium">Unable to Initialize</p>
              <p className="text-sm mt-1">Please connect your wallet first</p>
            </div>
          )}
        </div>

        {/* Download Link */}
        <div className="mt-4 text-center">
          <a
            href="https://self.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Download Self App →
          </a>
        </div>
      </div>
    </div>
  );
}
