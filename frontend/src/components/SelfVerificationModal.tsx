import { useEffect, useCallback, useState } from 'react';
import { SelfQRcodeWrapper, type SelfApp } from '@selfxyz/qrcode';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
  onError?: (error: Error) => void;
  selfApp: SelfApp | null;
  minimumAge?: number;
  excludedCountries?: string[];
}

export function SelfVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
  onError,
  selfApp,
  minimumAge = 18,
  excludedCountries = [],
}: SelfVerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle successful verification
  const handleSuccess = useCallback(() => {
    setIsVerifying(false);
    onVerificationComplete();
    onClose();
  }, [onVerificationComplete, onClose]);

  // Handle verification error
  const handleError = useCallback((errorData: { error_code?: string; reason?: string }) => {
    setIsVerifying(false);
    const err = new Error(errorData.reason || errorData.error_code || 'Verification failed');
    if (onError) {
      onError(err);
    }
    console.error('Self Protocol verification error:', errorData);
  }, [onError]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Scrollable */}
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Content - Scrollable inner container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Identity Verification
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Verify your identity using Self Protocol
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Requirements Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verification Requirements
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                {minimumAge > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Minimum age: {minimumAge} years</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Valid biometric passport or ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Self mobile app installed</span>
                </li>
                {excludedCountries.length > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-orange-700">
                      Not available in: {excludedCountries.join(', ')}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Scan with Self App
                </h3>
                <p className="text-sm text-gray-600">
                  Open the Self app and scan this QR code to verify your identity
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex justify-center items-center min-h-[280px] bg-white rounded-xl p-4 border-2 border-dashed border-gray-200">
                {selfApp ? (
                  <div className="qr-code-wrapper">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium">Connect wallet first</p>
                    <p className="text-sm mt-1">Please connect your wallet to generate verification QR code</p>
                  </div>
                )}
              </div>

              {isVerifying && (
                <div className="mt-4 flex items-center justify-center gap-2 text-celo-green">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Verifying...</span>
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">How to verify:</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-celo-green text-white text-sm flex items-center justify-center font-medium">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Download Self App</p>
                    <p className="text-sm text-gray-600">
                      Get the Self app from the App Store or Google Play
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-celo-green text-white text-sm flex items-center justify-center font-medium">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Scan your passport</p>
                    <p className="text-sm text-gray-600">
                      Use NFC to scan your biometric passport or ID card
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-celo-green text-white text-sm flex items-center justify-center font-medium">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Scan this QR code</p>
                    <p className="text-sm text-gray-600">
                      Open the Self app and scan the QR code above
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-celo-green text-white text-sm flex items-center justify-center font-medium">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Approve verification</p>
                    <p className="text-sm text-gray-600">
                      Confirm the verification request in the Self app
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Privacy Notice */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Privacy Protected
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>Your passport data never leaves your device</li>
                <li>Zero-knowledge proofs ensure privacy</li>
                <li>Only verification status is shared, not personal data</li>
                <li>Verification is valid for 24 hours</li>
              </ul>
            </div>

            {/* Download Links */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://apps.apple.com/app/self-identity-wallet/id6478563710"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="font-medium">App Store</span>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=xyz.self.wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span className="font-medium">Google Play</span>
              </a>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelfVerificationModal;
