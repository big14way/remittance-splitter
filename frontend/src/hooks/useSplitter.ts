import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import type { Address } from 'viem';
import { CUSD_TOKEN_ADDRESS, getRemittanceSplitterAddress } from '../constants';
import { getErrorMessage } from '../utils/validation';

// ERC20 ABI for cUSD token
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
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// RemittanceSplitter ABI
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
  {
    name: 'hasApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'hasSufficientBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface SplitterState {
  isApproving: boolean;
  isSplitting: boolean;
  approveHash?: Address;
  splitHash?: Address;
  error?: string;
  estimatedGas?: bigint;
}

export function useSplitter() {
  const { address, chainId } = useAccount();
  const [state, setState] = useState<SplitterState>({
    isApproving: false,
    isSplitting: false,
  });

  const splitterAddress = chainId ? getRemittanceSplitterAddress(chainId) as Address : undefined;

  // Get cUSD balance
  const { data: cUSDBalance, refetch: refetchBalance } = useBalance({
    address: address,
    token: CUSD_TOKEN_ADDRESS,
  });

  // Read allowance
  const { data: allowance } = useReadContract({
    address: CUSD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && splitterAddress ? [address, splitterAddress] : undefined,
  });

  // Contract write hooks
  const { writeContract: approveWrite, data: approveData, error: approveError } = useWriteContract();
  const { writeContract: splitWrite, data: splitData, error: splitError } = useWriteContract();

  // Wait for approve transaction
  const { isSuccess: approveSuccess, isLoading: approveLoading } = useWaitForTransactionReceipt({
    hash: approveData,
  });

  // Wait for split transaction
  const { isSuccess: splitSuccess, isLoading: splitLoading } = useWaitForTransactionReceipt({
    hash: splitData,
  });

  // Handle errors
  useEffect(() => {
    if (approveError) {
      setState(prev => ({
        ...prev,
        isApproving: false,
        error: getErrorMessage(approveError),
      }));
    }
  }, [approveError]);

  useEffect(() => {
    if (splitError) {
      setState(prev => ({
        ...prev,
        isSplitting: false,
        error: getErrorMessage(splitError),
      }));
    }
  }, [splitError]);

  /**
   * Get cUSD balance in human-readable format
   */
  const getCUSDBalance = (): string => {
    if (!cUSDBalance) return '0';
    return formatUnits(cUSDBalance.value, 18);
  };

  /**
   * Check if user has approved sufficient cUSD
   */
  const hasApprovedAmount = (amount: bigint): boolean => {
    if (!allowance) return false;
    return allowance >= amount;
  };

  /**
   * Check if user has sufficient balance
   */
  const hasSufficientBalance = (amount: bigint): boolean => {
    if (!cUSDBalance) return false;
    return cUSDBalance.value >= amount;
  };

  /**
   * Estimate gas for split payment
   */
  const estimateGasForSplit = async (
    _recipients: Address[],
    _amounts: string[]
  ): Promise<bigint | null> => {
    if (!address || !splitterAddress) return null;

    try {
      // Use the public RPC to estimate gas
      // This is a simple estimation - actual gas may vary
      return BigInt(300000); // Conservative estimate for split payment
    } catch (error) {
      console.error('Gas estimation error:', error);
      return null;
    }
  };

  /**
   * Approve cUSD for the splitter contract
   */
  const approveCUSD = async (amount: string): Promise<void> => {
    if (!address || !splitterAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isApproving: true, error: undefined }));

      const amountWei = parseUnits(amount, 18);

      approveWrite({
        address: CUSD_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [splitterAddress, amountWei],
      });

      setState(prev => ({ ...prev, approveHash: approveData }));
    } catch (error) {
      console.error('Approve error:', error);
      setState(prev => ({
        ...prev,
        isApproving: false,
        error: error instanceof Error ? error.message : 'Failed to approve cUSD',
      }));
    }
  };

  /**
   * Split payment to multiple recipients
   */
  const splitPayment = async (
    recipients: Address[],
    amounts: string[]
  ): Promise<void> => {
    if (!address || !splitterAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    if (recipients.length !== amounts.length) {
      setState(prev => ({ ...prev, error: 'Recipients and amounts length mismatch' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isSplitting: true, error: undefined }));

      const amountsWei = amounts.map(amt => parseUnits(amt, 18));

      splitWrite({
        address: splitterAddress,
        abi: REMITTANCE_SPLITTER_ABI,
        functionName: 'splitPayment',
        args: [recipients, amountsWei],
      });

      setState(prev => ({ ...prev, splitHash: splitData }));
    } catch (error) {
      console.error('Split payment error:', error);
      setState(prev => ({
        ...prev,
        isSplitting: false,
        error: error instanceof Error ? error.message : 'Failed to split payment',
      }));
    }
  };

  /**
   * Reset state after transaction
   */
  const resetState = () => {
    setState({
      isApproving: false,
      isSplitting: false,
    });
  };

  // Update loading states based on transaction status
  useEffect(() => {
    if (approveSuccess && state.isApproving) {
      setState(prev => ({ ...prev, isApproving: false }));
      refetchBalance();
    }
  }, [approveSuccess, state.isApproving, refetchBalance]);

  useEffect(() => {
    if (splitSuccess && state.isSplitting) {
      setState(prev => ({ ...prev, isSplitting: false }));
      refetchBalance();
    }
  }, [splitSuccess, state.isSplitting, refetchBalance]);

  return {
    // State
    ...state,
    isLoading: state.isApproving || state.isSplitting || approveLoading || splitLoading,

    // Data
    cUSDBalance: cUSDBalance?.value,
    cUSDBalanceFormatted: getCUSDBalance(),
    allowance,
    address,

    // Functions
    approveCUSD,
    splitPayment,
    getCUSDBalance,
    hasApprovedAmount,
    hasSufficientBalance,
    estimateGasForSplit,
    resetState,
    refetchBalance,

    // Transaction status
    approveSuccess,
    splitSuccess,
    approveHash: approveData,
    splitHash: splitData,
  };
}

export default useSplitter;
