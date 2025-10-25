import { useState, useEffect } from 'react';
import { parseUnits, formatUnits } from 'viem';
import type { Address } from 'viem';
import { Toaster, toast } from 'react-hot-toast';
import { useSplitter } from './hooks/useSplitter';
import { isValidAddress, isValidAmount, hasDuplicateAddresses, formatAmount } from './utils/validation';

interface Recipient {
  address: string;
  amount: string;
}

function App() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' },
    { address: '', amount: '' },
  ]);
  const [validationErrors, setValidationErrors] = useState<{ [key: number]: string }>({});
  const [estimatedGas, setEstimatedGas] = useState<string>('');

  const {
    address,
    cUSDBalance,
    cUSDBalanceFormatted,
    isApproving,
    isSplitting,
    isLoading,
    error,
    approveCUSD,
    splitPayment,
    hasApprovedAmount,
    hasSufficientBalance,
    estimateGasForSplit,
    resetState,
    approveSuccess,
    splitSuccess,
    approveHash,
    splitHash,
  } = useSplitter();

  // Show toast notifications for transaction status
  useEffect(() => {
    if (approveSuccess) {
      toast.success('cUSD approved successfully!', {
        icon: '✅',
        duration: 4000,
      });
    }
  }, [approveSuccess]);

  useEffect(() => {
    if (splitSuccess && splitHash) {
      toast.success('Payment split successfully!', {
        icon: '🎉',
        duration: 5000,
      });
      // Reset form
      setRecipients([
        { address: '', amount: '' },
        { address: '', amount: '' },
      ]);
      setValidationErrors({});
      resetState();
    }
  }, [splitSuccess, splitHash, resetState]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        icon: '❌',
        duration: 6000,
      });
    }
  }, [error]);

  // Estimate gas when recipients and amounts change
  useEffect(() => {
    const estimateGas = async () => {
      const validRecipients = recipients.filter(r => r.address && r.amount);
      if (validRecipients.length > 0) {
        const gas = await estimateGasForSplit(
          validRecipients.map(r => r.address as Address),
          validRecipients.map(r => r.amount)
        );
        if (gas) {
          setEstimatedGas(formatUnits(gas, 0));
        }
      }
    };

    estimateGas();
  }, [recipients, estimateGasForSplit]);

  const addRecipient = () => {
    if (recipients.length < 5) {
      setRecipients([...recipients, { address: '', amount: '' }]);
    }
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 2) {
      setRecipients(recipients.filter((_, i) => i !== index));
      // Clear validation error for removed recipient
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);

    // Clear validation error for this field
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const setMaxAmount = (index: number) => {
    if (!cUSDBalance) {
      toast.error('Unable to get balance');
      return;
    }

    // Calculate total amount already allocated to other recipients
    const otherAmounts = recipients
      .filter((_, i) => i !== index)
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const availableBalance = parseFloat(cUSDBalanceFormatted) - otherAmounts;

    if (availableBalance <= 0) {
      toast.error('No balance available');
      return;
    }

    const updated = [...recipients];
    updated[index].amount = availableBalance.toFixed(6);
    setRecipients(updated);
  };

  const getTotalAmount = (): number => {
    return recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  };

  const validateInputs = (): boolean => {
    const errors: { [key: number]: string } = {};
    let isValid = true;

    // Check if wallet is connected
    if (!address) {
      toast.error('Please connect your wallet');
      return false;
    }

    // Validate each recipient
    recipients.forEach((recipient, index) => {
      if (!recipient.address || !recipient.amount) {
        errors[index] = 'Address and amount required';
        isValid = false;
        return;
      }

      if (!isValidAddress(recipient.address)) {
        errors[index] = 'Invalid Celo address';
        isValid = false;
        return;
      }

      if (!isValidAmount(recipient.amount)) {
        errors[index] = 'Amount must be greater than 0';
        isValid = false;
        return;
      }
    });

    // Check for duplicate addresses
    const addresses = recipients.map(r => r.address).filter(a => a);
    if (hasDuplicateAddresses(addresses)) {
      toast.error('Duplicate recipient addresses found');
      isValid = false;
    }

    // Check sufficient balance
    const total = getTotalAmount();
    if (total <= 0) {
      toast.error('Total amount must be greater than 0');
      isValid = false;
    }

    const totalBigInt = parseUnits(total.toString(), 18);
    if (!hasSufficientBalance(totalBigInt)) {
      toast.error('Insufficient cUSD balance');
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleApproveAndSplit = async () => {
    if (!validateInputs()) return;

    const totalAmount = getTotalAmount();
    const totalBigInt = parseUnits(totalAmount.toString(), 18);

    try {
      // Check if already approved
      if (!hasApprovedAmount(totalBigInt)) {
        toast.loading('Waiting for approval...', { id: 'approve' });
        await approveCUSD(totalAmount.toString());
        toast.dismiss('approve');
      } else {
        // Already approved, proceed to split
        handleSplit();
      }
    } catch (err) {
      toast.dismiss('approve');
      console.error('Approve error:', err);
    }
  };

  const handleSplit = async () => {
    if (!validateInputs()) return;

    try {
      toast.loading('Splitting payment...', { id: 'split' });
      const addresses = recipients.map(r => r.address as Address);
      const amounts = recipients.map(r => r.amount);

      await splitPayment(addresses, amounts);
      toast.dismiss('split');
    } catch (err) {
      toast.dismiss('split');
      console.error('Split error:', err);
    }
  };

  // Auto-proceed to split after approval
  useEffect(() => {
    if (approveSuccess && !isSplitting && !splitSuccess) {
      handleSplit();
    }
  }, [approveSuccess]);

  if (!address) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-celo-green to-celo-gold">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
            <div className="mb-6">
              <div className="w-20 h-20 bg-celo-green rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Celo Remittance Splitter
              </h1>
              <p className="text-gray-600">
                Split your cUSD payments to multiple recipients in one transaction
              </p>
            </div>
            <appkit-button />
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Powered by Celo blockchain
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = getTotalAmount();
  const totalBigInt = parseUnits(totalAmount > 0 ? totalAmount.toString() : '0', 18);
  const needsApproval = !hasApprovedAmount(totalBigInt);
  const canSplit = totalAmount > 0 && hasSufficientBalance(totalBigInt);

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-celo-green rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Remittance Splitter
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">cUSD Balance</div>
                  <div className="text-lg font-semibold text-celo-green">
                    {formatAmount(cUSDBalanceFormatted, 4)} cUSD
                  </div>
                </div>
                <appkit-button />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Split Payment
              </h2>
              <p className="text-gray-600">
                Send cUSD to multiple recipients in a single transaction
              </p>
            </div>

            {/* Connected Wallet Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Connected Wallet</div>
              <div className="font-mono text-sm text-gray-900 break-all">{address}</div>
            </div>

            {/* Recipients Form */}
            <div className="space-y-4 mb-4">
              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    validationErrors[index]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Recipient {index + 1}
                    </span>
                    {recipients.length > 2 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={recipient.address}
                        onChange={(e) =>
                          updateRecipient(index, 'address', e.target.value)
                        }
                        disabled={isLoading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-celo-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          validationErrors[index] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (cUSD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.000001"
                          min="0"
                          value={recipient.amount}
                          onChange={(e) =>
                            updateRecipient(index, 'amount', e.target.value)
                          }
                          disabled={isLoading}
                          className={`w-full px-4 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-celo-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            validationErrors[index] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        <button
                          onClick={() => setMaxAmount(index)}
                          disabled={isLoading}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-celo-green hover:bg-celo-green hover:text-white border border-celo-green rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>
                  {validationErrors[index] && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors[index]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Add Recipient Button */}
            {recipients.length < 5 && (
              <button
                onClick={addRecipient}
                disabled={isLoading}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-celo-green hover:text-celo-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Recipient (Max 5)
              </button>
            )}

            {/* Total Amount & Gas Estimate */}
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-celo-green/10 rounded-lg border border-celo-green/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-celo-green">
                    {formatAmount(totalAmount, 6)} cUSD
                  </span>
                </div>
              </div>

              {estimatedGas && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">Estimated Gas</span>
                    <span className="font-medium text-blue-900">~{estimatedGas} gas units</span>
                  </div>
                </div>
              )}
            </div>

            {/* Split Payment Button */}
            <button
              onClick={handleApproveAndSplit}
              disabled={isLoading || !canSplit}
              className="mt-6 w-full py-4 px-6 bg-celo-green text-white rounded-lg font-semibold text-lg hover:bg-celo-green/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isApproving && (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving cUSD...
                </>
              )}
              {isSplitting && (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Splitting Payment...
                </>
              )}
              {!isLoading && (needsApproval ? 'Approve & Split Payment' : 'Split Payment')}
            </button>

            {/* Transaction Hashes */}
            {(approveHash || splitHash) && (
              <div className="mt-6 space-y-3">
                {approveHash && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      Approval Transaction
                    </div>
                    <a
                      href={`https://alfajores.celoscan.io/tx/${approveHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:underline break-all"
                    >
                      {approveHash}
                    </a>
                  </div>
                )}
                {splitHash && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-800 mb-2">
                      Split Payment Transaction ✅
                    </div>
                    <a
                      href={`https://alfajores.celoscan.io/tx/${splitHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-green-600 hover:underline break-all"
                    >
                      {splitHash}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              How it works
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-celo-green font-bold">1.</span>
                <span>Add 2-5 recipients with their Celo wallet addresses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-celo-green font-bold">2.</span>
                <span>Enter the amount of cUSD for each recipient (use MAX button for convenience)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-celo-green font-bold">3.</span>
                <span>Approve the contract to spend your cUSD (one-time per amount)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-celo-green font-bold">4.</span>
                <span>Split payment is executed in a single transaction, saving time and gas fees</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
