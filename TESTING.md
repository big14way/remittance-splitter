# Testing Guide - RemittanceSplitter

This guide explains how to run test transactions on the RemittanceSplitter contract to generate on-chain activity.

## Overview

The test script (`scripts/testTransactions.ts`) performs multiple split payment transactions with different scenarios to demonstrate the contract's functionality and generate on-chain activity.

## Prerequisites

1. **Deployed Contract**: The RemittanceSplitter contract must be deployed to your target network
2. **cUSD Balance**: You need cUSD tokens in your wallet
   - **Alfajores (Testnet)**: Get free cUSD from [Celo Faucet](https://faucet.celo.org)
   - **Mainnet**: Swap for cUSD on [Ubeswap](https://app.ubeswap.org/) or [Mento](https://app.mento.org/)
3. **Wallet Private Key**: Set in `.env` file

## Test Scenarios

The script runs 8 different test scenarios:

1. **2-Way Split** - Split to 2 recipients
2. **3-Way Split** - Split to 3 recipients
3. **2-Way Split (Variation)** - Different 2-recipient split
4. **4-Way Split** - Split to 4 recipients
5. **3-Way Split (Variation)** - Different 3-recipient split
6. **2-Way Split (Final)** - Another 2-recipient split
7. **5-Way Split** - Split to 5 recipients (maximum)
8. **3-Way Split (Large)** - Another 3-recipient split

Each transaction uses random amounts between 0.01 and 0.1 cUSD per recipient.

## Configuration

### Update Test Recipients

Before running on **mainnet**, update the recipient addresses in `scripts/testTransactions.ts`:

```typescript
const TEST_RECIPIENTS = [
  "0x1234567890123456789012345678901234567890", // Replace with real addresses
  "0x2345678901234567890123456789012345678901",
  "0x3456789012345678901234567890123456789012",
  "0x4567890123456789012345678901234567890123",
  "0x5678901234567890123456789012345678901234",
];
```

**Important**: Use addresses you control so you can recover the funds!

### Adjust Parameters

You can modify these constants in the script:

```typescript
const DELAY_BETWEEN_TRANSACTIONS = 15000; // 15 seconds between tests
const MIN_AMOUNT = "0.01"; // Minimum cUSD per recipient
const MAX_AMOUNT = "0.1";  // Maximum cUSD per recipient
```

## Running Tests

### On Alfajores Testnet

```bash
npm run test-txs:alfajores
```

### On Celo Mainnet

```bash
npm run test-txs:celo
```

**⚠️ Warning**: Mainnet uses real money! Make sure:
- You have enough cUSD
- Recipient addresses are correct
- You understand the costs

## What the Script Does

For each test scenario:

1. ✅ Selects random recipients from the test list
2. ✅ Generates random amounts for each recipient
3. ✅ Approves the RemittanceSplitter contract to spend cUSD
4. ✅ Executes the split payment transaction
5. ✅ Verifies the transaction succeeded
6. ✅ Waits 15 seconds before the next test (to avoid rate limits)

## Expected Output

```
🚀 Starting RemittanceSplitter Test Transactions

📡 Network: alfajores (Chain ID: 44787)
👤 Signer: 0x208B2660e5F62CDca21869b389c5aF9E7f0faE89

📄 RemittanceSplitter: 0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88
💵 cUSD Token: 0x765DE816845861e75A25fCA122bb6898B8B1282a

💰 Initial cUSD Balance: 10.5000 cUSD

🧪 Running 8 test transactions...
================================================================================

📋 Test 1/8: 2-Way Split
--------------------------------------------------------------------------------
  Recipients (2):
    1. 0x1234567890123456789012345678901234567890 → 0.0543 cUSD
    2. 0x2345678901234567890123456789012345678901 → 0.0821 cUSD
  Total Amount: 0.1364 cUSD
  📝 Approving 0.1364 cUSD...
  ✅ Approved! TX: 0xabc...
  💸 Splitting payment to 2 recipients...
  ✅ Split successful! TX: 0xdef...
  ✅ Transaction verified

  ⏳ Waiting 15s before next transaction...

[... continues for all 8 tests ...]

================================================================================
💰 Final cUSD Balance: 9.4230 cUSD
💸 Total Spent: 1.0770 cUSD

================================================================================
📊 TRANSACTION SUMMARY
================================================================================

✅ Successful: 8/8
❌ Failed: 0/8

📝 Detailed Results:

✅ Test 1: 2-Way Split
   Recipients: 2
   Total: 0.1364 cUSD
   TX: 0xdef...
   Explorer: https://alfajores.celoscan.io/tx/0xdef...

[... all test results ...]

💾 Results saved to: test-results-alfajores-2025-01-15T10-30-45.json

🎉 Test transactions completed!
```

## Output Files

The script saves detailed results to a JSON file:
- **Filename**: `test-results-{network}-{timestamp}.json`
- **Contents**: All transaction data, hashes, amounts, and verification status

Example:
```json
{
  "network": "alfajores",
  "chainId": "44787",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "signer": "0x208B2660e5F62CDca21869b389c5aF9E7f0faE89",
  "splitterAddress": "0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88",
  "initialBalance": "10.5000",
  "finalBalance": "9.4230",
  "totalSpent": "1.0770",
  "results": [
    {
      "testNumber": 1,
      "scenario": "2-Way Split",
      "recipients": ["0x1234...", "0x2345..."],
      "amounts": ["0.0543", "0.0821"],
      "txHash": "0xdef...",
      "success": true
    }
  ]
}
```

## Estimated Costs

### Alfajores Testnet
- **cUSD Needed**: ~2-3 cUSD (free from faucet)
- **Gas Costs**: Minimal (testnet)
- **Total Time**: ~2-3 minutes

### Celo Mainnet
- **cUSD Needed**: ~2-3 cUSD ($2-3 USD)
- **Gas Costs**: ~$0.01-0.02 per transaction
- **Total Time**: ~2-3 minutes

## Troubleshooting

### "Insufficient funds"
- Check your cUSD balance: `npm run balance`
- Get more cUSD from faucet (testnet) or DEX (mainnet)

### "Transaction reverted"
- Ensure contract is deployed correctly
- Check recipient addresses are valid
- Verify you have enough cUSD + gas

### "Nonce too low/high"
- Wait a few seconds and try again
- Clear pending transactions in your wallet

### Rate Limiting
- The script has 15s delays to prevent rate limiting
- If you still hit limits, increase `DELAY_BETWEEN_TRANSACTIONS`

## Viewing Transactions

All transactions are viewable on CeloScan:

- **Alfajores**: https://alfajores.celoscan.io/
- **Mainnet**: https://celoscan.io/

Search by:
- Transaction hash
- Your wallet address
- Contract address

## Best Practices

1. **Test on Alfajores first** before mainnet
2. **Use small amounts** for testing (0.01-0.1 cUSD)
3. **Verify recipient addresses** are correct
4. **Monitor gas prices** on mainnet
5. **Keep transaction logs** for reference
6. **Review results JSON** for analysis

## Support

If you encounter issues:
1. Check the error messages in terminal
2. Review the saved JSON results file
3. Verify contract deployment
4. Check wallet balance and gas
5. Try with smaller amounts first

## Next Steps

After successful testing:
1. Review all transaction hashes on CeloScan
2. Verify contract functionality
3. Share results for scoring/evaluation
4. Consider deploying to mainnet (if not already)

---

**Happy Testing! 🎉**
