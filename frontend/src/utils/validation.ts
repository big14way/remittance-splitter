import { isAddress } from 'viem';

/**
 * Validates if a string is a valid Ethereum/Celo address
 */
export function isValidAddress(address: string): boolean {
  if (!address || address.trim() === '') return false;
  return isAddress(address);
}

/**
 * Validates if an amount is a valid positive number
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || amount.trim() === '') return false;

  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Formats error messages for common transaction issues
 */
export function getErrorMessage(error: Error | unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // User rejected transaction
  if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
    return 'Transaction was rejected';
  }

  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
    return 'Insufficient funds for this transaction';
  }

  // Insufficient allowance
  if (errorMessage.includes('insufficient allowance') || errorMessage.includes('ERC20: insufficient allowance')) {
    return 'Insufficient token allowance. Please approve first.';
  }

  // Gas estimation failed
  if (errorMessage.includes('gas') && errorMessage.includes('estimate')) {
    return 'Transaction may fail. Please check your inputs.';
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network error. Please check your connection.';
  }

  // Contract errors
  if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
    return 'Transaction failed validation. Please check recipient addresses and amounts.';
  }

  return errorMessage.length > 100
    ? `${errorMessage.substring(0, 100)}...`
    : errorMessage;
}

/**
 * Validates duplicate addresses in recipient list
 */
export function hasDuplicateAddresses(addresses: string[]): boolean {
  const uniqueAddresses = new Set(addresses.map(addr => addr.toLowerCase()));
  return uniqueAddresses.size !== addresses.length;
}

/**
 * Formats a number to display with proper decimals
 */
export function formatAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}
