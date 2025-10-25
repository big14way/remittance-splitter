import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, Address } from 'viem';
import { CUSD_TOKEN_ADDRESS } from './constants';

// Sample ABI for cUSD approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Sample ABI for RemittanceSplitter
const REMITTANCE_SPLITTER_ABI = [
  {
    name: 'splitPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const;

// Placeholder for contract address - update after deployment
const SPLITTER_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

interface Recipient {
  address: string;
  amount: string;
}

function App() {
  const { address, isConnected } = useAccount();
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' },
    { address: '', amount: '' },
  ]);
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [step, setStep] = useState<'input' | 'approving' | 'splitting'>('input');

  // Get cUSD balance
  const { data: balance } = useBalance({
    address: address,
    token: CUSD_TOKEN_ADDRESS,
  });

  // Contract write hooks
  const { writeContract: approve, data: approveData } = useWriteContract();
  const { writeContract: splitPayment, data: splitData } = useWriteContract();

  // Wait for transactions
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
  });

  const { isSuccess: splitSuccess, isLoading: splitLoading } = useWaitForTransactionReceipt({
    hash: splitData,
  });

  // Handle approve success
  useEffect(() => {
    if (approveSuccess && step === 'approving') {
      handleSplitPayment();
    }
  }, [approveSuccess, step]);

  // Handle split success
  useEffect(() => {
    if (splitSuccess && splitData) {
      setTxHash(splitData);
      setStep('input');
      // Reset form
      setRecipients([
        { address: '', amount: '' },
        { address: '', amount: '' },
      ]);
    }
  }, [splitSuccess, splitData]);

  const addRecipient = () => {
    if (recipients.length < 5) {
      setRecipients([...recipients, { address: '', amount: '' }]);
    }
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 2) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const getTotalAmount = (): string => {
    return recipients
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
      .toFixed(2);
  };

  const validateInputs = (): boolean => {
    setError('');

    // Check all recipients have addresses and amounts
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.amount) {
        setError('All fields must be filled');
        return false;
      }

      // Validate address format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.address)) {
        setError('Invalid address format');
        return false;
      }

      // Validate amount is positive
      if (parseFloat(recipient.amount) <= 0) {
        setError('Amounts must be greater than 0');
        return false;
      }
    }

    // Check sufficient balance
    const total = parseFloat(getTotalAmount());
    if (balance && total > parseFloat(formatUnits(balance.value, 18))) {
      setError('Insufficient cUSD balance');
      return false;
    }

    return true;
  };

  const handleApprove = async () => {
    if (!validateInputs()) return;

    const totalAmount = parseUnits(getTotalAmount(), 18);

    try {
      setStep('approving');
      approve({
        address: CUSD_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [SPLITTER_ADDRESS, totalAmount],
      });
    } catch (err) {
      setError('Failed to approve cUSD');
      setStep('input');
      console.error(err);
    }
  };

  const handleSplitPayment = async () => {
    try {
      setStep('splitting');
      const addresses = recipients.map((r) => r.address as Address);
      const amounts = recipients.map((r) => parseUnits(r.amount, 18));

      splitPayment({
        address: SPLITTER_ADDRESS,
        abi: REMITTANCE_SPLITTER_ABI,
        functionName: 'splitPayment',
        args: [addresses, amounts],
      });
    } catch (err) {
      setError('Failed to split payment');
      setStep('input');
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-celo-green to-celo-gold">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Celo Remittance Splitter
          </h1>
          <p className="text-gray-600 mb-6">
            Split your cUSD payments to multiple recipients in one transaction
          </p>
          <appkit-button />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Celo Remittance Splitter
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Balance</div>
                <div className="text-lg font-semibold text-celo-green">
                  {balance ? formatUnits(balance.value, 18) : '0'} cUSD
                </div>
              </div>
              <appkit-button />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Split Payment
            </h2>
            <p className="text-gray-600">
              Send cUSD to multiple recipients in a single transaction
            </p>
          </div>

          {/* Connected Wallet Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Connected Wallet</div>
            <div className="font-mono text-sm text-gray-900">{address}</div>
          </div>

          {/* Recipients Form */}
          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Recipient {index + 1}
                  </span>
                  {recipients.length > 2 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-celo-green focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (cUSD)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={recipient.amount}
                      onChange={(e) =>
                        updateRecipient(index, 'amount', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-celo-green focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Recipient Button */}
          {recipients.length < 5 && (
            <button
              onClick={addRecipient}
              className="mt-4 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-celo-green hover:text-celo-green transition-colors"
            >
              + Add Recipient (Max 5)
            </button>
          )}

          {/* Total Amount */}
          <div className="mt-6 p-4 bg-celo-green/10 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-celo-green">
                {getTotalAmount()} cUSD
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Split Payment Button */}
          <button
            onClick={handleApprove}
            disabled={step !== 'input' || splitLoading}
            className="mt-6 w-full py-4 px-6 bg-celo-green text-white rounded-lg font-semibold text-lg hover:bg-celo-green/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {step === 'approving' && 'Approving cUSD...'}
            {step === 'splitting' && 'Splitting Payment...'}
            {step === 'input' && 'Split Payment'}
          </button>

          {/* Transaction Hash */}
          {txHash && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">
                Transaction Successful!
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-700">TX:</span>
                <a
                  href={`https://celoscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-celo-green hover:underline flex-1 truncate"
                >
                  {txHash}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Add up to 5 recipients with their wallet addresses</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Enter the amount of cUSD for each recipient</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Approve the contract to spend your cUSD</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Split payment is executed in a single transaction</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
