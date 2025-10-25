# QuickStart Guide - Celo Remittance Splitter

Get your RemittanceSplitter dApp running in minutes!

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install --legacy-peer-deps && cd ..
```

### 2. Configure Environment

Create `.env` file in project root:

```env
PRIVATE_KEY=your_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here
```

Create `frontend/.env`:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

### 3. Deploy Contract

**Alfajores Testnet (Recommended for testing):**
```bash
npm run deploy:alfajores
```

**Celo Mainnet:**
```bash
npm run deploy:celo
```

### 4. Update Frontend

After deployment, update `frontend/src/constants.ts` with your deployed contract address.

### 5. Run Frontend

```bash
npm run frontend
```

Visit http://localhost:5173

## 📱 Using the dApp

1. **Connect Wallet** - Click "Connect Wallet" button
2. **Add Recipients** - Enter 2-5 wallet addresses
3. **Set Amounts** - Enter cUSD amount for each (or use MAX button)
4. **Split Payment** - Click "Approve & Split Payment"
5. **Confirm Transactions** - Approve in your wallet (2 transactions: approve + split)

## 🧪 Testing On-Chain Activity

Run automated test transactions to generate on-chain activity:

**Before running on mainnet**, update recipient addresses in `scripts/testTransactions.ts`!

```bash
# Test on Alfajores (free testnet cUSD)
npm run test-txs:alfajores

# Test on Mainnet (uses real cUSD)
npm run test-txs:celo
```

This will:
- Execute 8 different split payment scenarios
- Generate transaction hashes
- Save results to JSON file
- Verify all transactions succeeded

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## 📋 Available Commands

### Contract Management
```bash
npm run compile          # Compile smart contracts
npm run test            # Run contract tests
npm run deploy:alfajores # Deploy to Alfajores testnet
npm run deploy:celo     # Deploy to Celo mainnet
```

### Testing
```bash
npm run test-txs:alfajores  # Run test transactions on Alfajores
npm run test-txs:celo       # Run test transactions on Mainnet
```

### Frontend
```bash
npm run frontend         # Start development server
npm run frontend:build   # Build for production
```

## 🔗 Important Links

### Deployed Contracts

**Alfajores Testnet:**
- Contract: `0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88`
- Explorer: https://alfajores.celoscan.io/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88

**Celo Mainnet:**
- Contract: Deploy and update here
- Explorer: https://celoscan.io

### Resources

- **Celo Faucet** (Testnet cUSD): https://faucet.celo.org
- **Celo Explorer**: https://celoscan.io
- **Alfajores Explorer**: https://alfajores.celoscan.io
- **Ubeswap** (Buy cUSD on Mainnet): https://app.ubeswap.org
- **WalletConnect**: https://cloud.walletconnect.com

## 🎯 Key Addresses

- **cUSD Token**: `0x765DE816845861e75A25fCA122bb6898B8B1282a` (same on mainnet and testnet)
- **Celo Mainnet Chain ID**: `42220`
- **Alfajores Chain ID**: `44787`

## 💡 Tips

1. **Get Test Funds**: Visit https://faucet.celo.org for free testnet tokens
2. **Use Alfajores First**: Always test on testnet before mainnet
3. **Small Amounts**: Start with small amounts (0.01-0.1 cUSD)
4. **Check Balances**: Ensure you have enough cUSD + gas
5. **Monitor Transactions**: Check CeloScan for transaction status

## 🆘 Troubleshooting

### "Insufficient funds"
- Get cUSD from faucet (testnet) or DEX (mainnet)
- Check balance covers amount + gas fees

### "Transaction failed"
- Verify recipient addresses are valid
- Ensure contract is deployed correctly
- Check you approved enough cUSD

### Frontend won't connect
- Verify WalletConnect Project ID is set
- Clear browser cache/cookies
- Try different wallet (MetaMask, Valora, etc.)

### Contract deployment fails
- Check private key is set in `.env`
- Verify you have CELO for gas
- Ensure you're on correct network

## 📚 Documentation

- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [README.md](./README.md) - Full project documentation

## 🎉 You're Ready!

Your Celo Remittance Splitter is now set up and ready to use. Start splitting payments on Celo! 🚀
