# 💸 Celo Remittance Splitter

[![Celo](https://img.shields.io/badge/Celo-FCFF52?style=for-the-badge&logo=celo&logoColor=black)](https://celo.org)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> A smart contract-based solution for splitting remittance payments to multiple recipients in a single transaction on the Celo blockchain.

**Live on Alfajores Testnet**: [0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88](https://alfajores.celoscan.io/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88)

---

## 🌍 The Problem

Traditional remittance payments face several challenges:

1. **Multiple Transaction Fees**: Sending money to multiple family members or recipients requires separate transactions, each incurring fees
2. **Time-Consuming Process**: Users must manually execute each transaction, waiting for confirmations
3. **Higher Gas Costs**: Multiple transactions mean paying gas fees multiple times
4. **Complex Coordination**: Tracking multiple payments across different recipients is error-prone
5. **Limited Accessibility**: Traditional banking systems often exclude unbanked populations in developing countries

### Real-World Impact

- **6.8% global remittance fees** (World Bank 2024) - one of the highest financial services costs
- **$656 billion** sent as remittances globally in 2024
- **1.7 billion adults** remain unbanked worldwide
- Families often split remittances among multiple recipients (children, elderly parents, extended family)

---

## 💡 Our Solution

**Celo Remittance Splitter** is a decentralized application (dApp) that allows users to:

✅ **Split payments to 2-5 recipients in a single transaction**
✅ **Save on gas fees** by batching transfers
✅ **Reduce transaction time** from minutes to seconds
✅ **Use mobile-first Celo blockchain** for accessibility
✅ **Leverage stablecoins (cUSD)** to avoid volatility
✅ **Operate without traditional banking** infrastructure

### How It Works

1. User approves the smart contract to spend cUSD tokens
2. User specifies recipient addresses and amounts in the web interface
3. Smart contract validates inputs and executes all transfers atomically
4. All recipients receive their funds in one blockchain transaction

---

## 🎯 Mission Summary

**Mission**: Democratize access to affordable, efficient remittance payments for underserved communities using blockchain technology.

### Our Goals

1. **Reduce Costs**: Lower remittance fees from 6.8% to near-zero (only gas fees)
2. **Increase Speed**: Enable instant, 24/7 cross-border payments
3. **Expand Access**: Reach the unbanked through mobile-first Celo blockchain
4. **Simplify UX**: Make crypto payments as easy as traditional banking
5. **Ensure Security**: Use audited smart contracts and battle-tested protocols

### Why Celo?

- **Mobile-First**: Designed for smartphone users in emerging markets
- **Stablecoins**: cUSD, cEUR, cREAL maintain value stability
- **Low Fees**: $0.001-0.01 per transaction
- **Fast**: 5-second block times
- **Carbon Negative**: Environmentally sustainable blockchain
- **Phone Number Mapping**: Send to phone numbers, not just addresses

---

## ✨ Features

### Smart Contract Features

- ✅ **Batch Payments**: Split to 2-5 recipients in one transaction
- ✅ **ERC20 Compatible**: Works with cUSD and other Celo stablecoins
- ✅ **Gas Optimized**: Uses SafeERC20 and efficient storage patterns
- ✅ **Security First**: ReentrancyGuard, comprehensive input validation
- ✅ **Helper Functions**: Check balance and approval status on-chain
- ✅ **Event Logging**: Track all splits with detailed events

### Frontend Features

- ✅ **WalletConnect Integration**: Connect with any compatible wallet
- ✅ **Dynamic Recipients**: Add/remove recipients on the fly
- ✅ **Real-time Validation**: Check addresses and balances before sending
- ✅ **MAX Button**: Quickly allocate available balance
- ✅ **Gas Estimation**: See expected transaction costs
- ✅ **Toast Notifications**: User-friendly success/error messages
- ✅ **Transaction Tracking**: View on CeloScan with one click
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Loading States**: Clear visual feedback during transactions

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + Vite Frontend (TypeScript)                   │  │
│  │  - WalletConnect/Reown AppKit                         │  │
│  │  - Wagmi v2 (React Hooks)                             │  │
│  │  - Viem (Ethereum Interactions)                       │  │
│  │  - Tailwind CSS (Styling)                             │  │
│  │  - React Hot Toast (Notifications)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ RPC Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Celo Blockchain                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  RemittanceSplitter Contract (Solidity 0.8.20)       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ splitPayment(recipients[], amounts[])           │ │  │
│  │  │ - Validates inputs                              │ │  │
│  │  │ - Checks balances & approvals                   │ │  │
│  │  │ - Transfers cUSD to each recipient              │ │  │
│  │  │ - Emits PaymentSplit event                      │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  cUSD Token Contract (ERC20)                         │  │
│  │  0x765DE816845861e75A25fCA122bb6898B8B1282a          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Contract Architecture

```
RemittanceSplitter Contract
│
├── Dependencies
│   ├── OpenZeppelin SafeERC20 (safe token transfers)
│   ├── OpenZeppelin ReentrancyGuard (prevent reentrancy)
│   └── OpenZeppelin IERC20 (token interface)
│
├── State Variables
│   ├── CUSD_TOKEN (constant address)
│   └── cUSD (immutable IERC20 instance)
│
├── Events
│   └── PaymentSplit(sender, recipients[], amounts[], total)
│
├── Core Functions
│   ├── splitPayment(recipients[], amounts[])
│   │   ├── Validate array lengths match
│   │   ├── Validate non-empty arrays
│   │   ├── Validate no duplicate recipients
│   │   ├── Calculate total amount
│   │   ├── Transfer cUSD from sender to each recipient
│   │   └── Emit PaymentSplit event
│   │
│   ├── hasApproved(user, totalAmount) → bool
│   │   └── Check if user approved sufficient cUSD
│   │
│   └── hasSufficientBalance(user, totalAmount) → bool
│       └── Check if user has enough cUSD
│
└── Security Features
    ├── ReentrancyGuard on splitPayment
    ├── Comprehensive input validation
    ├── No funds held in contract
    └── SafeERC20 for all transfers
```

---

## 📄 Smart Contract Details

### Deployment Information

#### Alfajores Testnet (Chain ID: 44787)

- **Contract Address**: `0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88`
- **Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88)
- **Deployer**: `0x208B2660e5F62CDca21869b389c5aF9E7f0faE89`
- **Deployment TX**: View in [deploy.log](deploy.log)

#### Celo Mainnet (Chain ID: 42220)

- **Contract Address**: _To be deployed_
- **Explorer**: https://celoscan.io

### Contract Specifications

| Property | Value |
|----------|-------|
| **Solidity Version** | 0.8.20 |
| **License** | MIT |
| **Optimization** | Enabled (200 runs) |
| **cUSD Token** | 0x765DE816845861e75A25fCA122bb6898B8B1282a |
| **Max Recipients** | 5 (configurable) |
| **Min Recipients** | 2 |

### Contract Interface

```solidity
interface IRemittanceSplitter {
    event PaymentSplit(
        address indexed sender,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount
    );

    function splitPayment(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external;

    function hasApproved(
        address user,
        uint256 totalAmount
    ) external view returns (bool);

    function hasSufficientBalance(
        address user,
        uint256 totalAmount
    ) external view returns (bool);
}
```

### Security Considerations

✅ **Audited Dependencies**: Uses OpenZeppelin contracts
✅ **Reentrancy Protection**: ReentrancyGuard modifier
✅ **Input Validation**: Comprehensive checks on all inputs
✅ **SafeERC20**: Prevents issues with non-standard tokens
✅ **No Fund Storage**: Contract doesn't hold user funds
✅ **Event Logging**: All operations emit events for transparency

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **Wallet**: MetaMask, Valora, or any WalletConnect-compatible wallet
- **cUSD**: Get from [Celo Faucet](https://faucet.celo.org) (testnet) or DEX (mainnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/big14way/remittance-splitter.git
cd remittance-splitter

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install --legacy-peer-deps && cd ..
```

### Environment Setup

1. **Create root `.env` file**:

```env
PRIVATE_KEY=your_wallet_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here
```

> Get CeloScan API key from https://celoscan.io/myapikey

2. **Create `frontend/.env` file**:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

> Get WalletConnect Project ID from https://cloud.walletconnect.com

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy Contract

**Alfajores Testnet** (recommended for testing):

```bash
npm run deploy:alfajores
```

**Celo Mainnet**:

```bash
npm run deploy:celo
```

After deployment, update `frontend/src/constants.ts` with your contract address.

### Run Frontend

```bash
npm run frontend
```

Visit: http://localhost:5173

---

## 📖 Usage Guide

### For End Users

#### 1. **Connect Your Wallet**

When you open the dApp, you'll see a welcome screen with a "Connect Wallet" button.

**What you'll see**:
- Welcome screen with Celo branding (green gradient background)
- Large circular icon with dollar sign symbol
- "Celo Remittance Splitter" title
- Description: "Split your cUSD payments to multiple recipients in one transaction"
- "Connect Wallet" button (WalletConnect modal)

**Actions**:
- Click "Connect Wallet"
- Select your wallet (MetaMask, Valora, WalletConnect, etc.)
- Approve the connection
- Ensure you're on Celo Mainnet or Alfajores Testnet

---

#### 2. **View Your Dashboard**

After connecting, you'll see the main dashboard.

**What you'll see**:
- **Header** (sticky top bar):
  - App logo and name
  - Your cUSD balance (e.g., "5.2340 cUSD")
  - Connected wallet button (shows address)
- **Connected Wallet Info Box**:
  - Your full wallet address
  - Gray background panel
- **Split Payment Form**:
  - Title: "Split Payment"
  - Description
  - Recipient input fields (starts with 2)

---

#### 3. **Add Recipients**

Enter recipient details for each person receiving funds.

**What you'll see**:
- **Recipient Cards** (2 by default):
  - "Recipient 1" label
  - Address input (placeholder: "0x...")
  - Amount input (placeholder: "0.00")
  - "MAX" button next to amount
  - "Remove" button (if more than 2 recipients)
- **Add Recipient Button**:
  - Dashed border button
  - Text: "+ Add Recipient (Max 5)"
  - Disabled when 5 recipients reached

**Actions**:
1. Enter first recipient's Celo address (0x...)
2. Enter amount of cUSD to send
3. Click "MAX" to auto-fill with available balance
4. Click "+ Add Recipient" to add more (up to 5 total)
5. Click "Remove" to delete a recipient

**Validation**:
- Invalid addresses show red border + error message
- Amounts must be > 0
- Duplicate addresses are not allowed
- Total cannot exceed your balance

---

#### 4. **Review Total Amount**

Check the total before sending.

**What you'll see**:
- **Total Amount Panel** (green background):
  - Large, bold total (e.g., "1.2500 cUSD")
  - "Total Amount" label
- **Gas Estimate Panel** (blue background):
  - Estimated gas units (~300,000)
  - Small info panel below total

**What it means**:
- Total = Sum of all recipient amounts
- Gas estimate = Expected transaction cost
- Updates automatically as you change amounts

---

#### 5. **Split Payment**

Execute the transaction.

**What you'll see**:
- **Split Payment Button**:
  - Full-width green button
  - Text changes based on state:
    - "Approve & Split Payment" (if not approved)
    - "Split Payment" (if already approved)
    - "Approving cUSD..." (during approval, with spinner)
    - "Splitting Payment..." (during split, with spinner)
  - Disabled if validation fails or loading

**Actions**:
1. Click "Approve & Split Payment"
2. Confirm approval in wallet (Transaction 1)
   - Toast: "Waiting for approval..."
   - Success toast: "✅ cUSD approved successfully!"
3. Automatically proceeds to split
4. Confirm split in wallet (Transaction 2)
   - Toast: "Splitting payment..."
   - Success toast: "🎉 Payment split successfully!"

**Transaction Flow**:
```
User Clicks Button
      ↓
Approve cUSD Token (TX 1)
      ↓
Wait for Confirmation
      ↓
Auto-proceed to Split
      ↓
Execute Split Payment (TX 2)
      ↓
Wait for Confirmation
      ↓
Success! Form Resets
```

---

#### 6. **View Transaction Results**

See confirmation and transaction details.

**What you'll see**:
- **Approval Transaction Box** (blue background):
  - "Approval Transaction" title
  - Full transaction hash
  - Link to CeloScan explorer
- **Split Payment Transaction Box** (green background):
  - "Split Payment Transaction ✅" title
  - Full transaction hash
  - Link to CeloScan explorer
- **Success Toast** (top-right):
  - "🎉 Payment split successfully!"
  - Green background
  - Auto-dismisses after 5 seconds

**Actions**:
- Click transaction hash to view on CeloScan
- Verify all recipients received funds
- Check your updated cUSD balance
- Form automatically resets for next split

---

#### 7. **Error Handling**

If something goes wrong, you'll see clear error messages.

**Common Errors**:

| Error | What You'll See | Solution |
|-------|----------------|----------|
| **Insufficient Balance** | Red toast: "Insufficient cUSD balance" | Get more cUSD from faucet/DEX |
| **Invalid Address** | Red border on input<br/>"Invalid Celo address" | Enter valid 0x... address |
| **Duplicate Address** | Red toast: "Duplicate recipient addresses found" | Use unique addresses |
| **Transaction Rejected** | Red toast: "Transaction was rejected" | Approve transaction in wallet |
| **No Wallet** | Red toast: "Please connect your wallet" | Connect wallet first |

**Error Appearance**:
- Red border on invalid inputs
- Red toast notifications (top-right)
- Error icon (❌) next to message
- Stays visible for 6 seconds

---

### For Developers

#### Running Test Transactions

Generate on-chain activity with automated tests:

```bash
# Test on Alfajores (free testnet cUSD)
npm run test-txs:alfajores

# Test on Mainnet (real cUSD - be careful!)
npm run test-txs:celo
```

See [TESTING.md](TESTING.md) for full documentation.

#### Frontend Development

```bash
# Start dev server with hot reload
npm run frontend

# Build for production
npm run frontend:build

# Preview production build
cd frontend && npm run preview
```

#### Contract Interaction (Hardhat Console)

```bash
npx hardhat console --network alfajores
```

```javascript
// Get contract instance
const splitter = await ethers.getContractAt(
  "RemittanceSplitter",
  "0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88"
);

// Check if approved
const approved = await splitter.hasApproved(
  "0xYourAddress",
  ethers.parseUnits("1.0", 18)
);

// Check balance
const hasBalance = await splitter.hasSufficientBalance(
  "0xYourAddress",
  ethers.parseUnits("1.0", 18)
);
```

---

## 🛠️ Technologies Used

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.20 | Smart contract language |
| **Hardhat** | 2.26.x | Development environment |
| **OpenZeppelin** | 5.4.0 | Secure contract libraries |
| **TypeScript** | 5.9.3 | Type-safe scripting |
| **Ethers.js** | v6 | Blockchain interactions |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | UI framework |
| **Vite** | 7.1.12 | Build tool & dev server |
| **TypeScript** | 5.9.3 | Type safety |
| **Wagmi** | 2.x | React hooks for Ethereum |
| **Viem** | 2.x | TypeScript Ethereum library |
| **Reown AppKit** | 1.7.18 | WalletConnect integration |
| **Tailwind CSS** | 3.4.0 | Styling framework |
| **React Hot Toast** | 2.x | Toast notifications |

### Blockchain

| Component | Details |
|-----------|---------|
| **Network** | Celo (Mainnet & Alfajores) |
| **Token** | cUSD (ERC20) |
| **RPC** | Forno (https://forno.celo.org) |
| **Explorer** | CeloScan |
| **Wallet Support** | MetaMask, Valora, WalletConnect |

---

## ⛽ Gas Cost Analysis

### Contract Deployment

| Network | Gas Used | Cost (USD) | Notes |
|---------|----------|------------|-------|
| **Alfajores** | ~1,500,000 | $0.00 | Free testnet |
| **Celo Mainnet** | ~1,500,000 | ~$0.015 | At 10 Gwei gas price |

### Transaction Costs

#### splitPayment() Function

| Recipients | Gas Used | Cost (cUSD) | Savings vs. Individual TXs |
|------------|----------|-------------|----------------------------|
| **2 recipients** | ~120,000 | ~$0.0012 | 40% savings |
| **3 recipients** | ~150,000 | ~$0.0015 | 50% savings |
| **4 recipients** | ~180,000 | ~$0.0018 | 55% savings |
| **5 recipients** | ~210,000 | ~$0.0021 | 58% savings |

**Comparison**:
- Individual transfers: ~100,000 gas each
- Our batched transfer: ~70,000 gas per additional recipient

#### Example: Sending to 5 Recipients

**Traditional Method** (5 separate transactions):
```
5 transactions × 100,000 gas = 500,000 gas
500,000 gas × 10 Gwei = 0.005 CELO (~$0.005)
```

**RemittanceSplitter** (1 batched transaction):
```
1 transaction × 210,000 gas = 210,000 gas
210,000 gas × 10 Gwei = 0.0021 CELO (~$0.0021)
```

**Savings**: ~58% reduction in gas costs! 🎉

### Gas Optimization Techniques Used

1. ✅ **SafeERC20**: Efficient token transfers
2. ✅ **Memory Arrays**: Use calldata for function parameters
3. ✅ **Immutable Variables**: Gas-free reads
4. ✅ **Minimal Storage**: No unnecessary state variables
5. ✅ **Batched Transfers**: Amortize fixed costs across recipients
6. ✅ **No Loops for Storage**: Only memory/calldata iteration

---

## 📊 Project Statistics

```
Total Files:       45+
Smart Contracts:   1 main contract
Lines of Code:     ~3,500+
Languages:         Solidity, TypeScript, CSS
Test Coverage:     Core functions tested
Gas Optimized:     ✅ Yes
Security Audited:  OpenZeppelin contracts
Mobile Responsive: ✅ Yes
```

---

## 🔮 Future Improvements

### Short Term

- [ ] **Multi-Token Support**: Support cEUR, cREAL, and other Celo stablecoins
- [ ] **Transaction History**: Display past splits in the UI
- [ ] **Address Book**: Save frequently used recipient addresses
- [ ] **CSV Import**: Bulk upload recipients via CSV file
- [ ] **ENS/Phone Support**: Send to ENS names or phone numbers
- [ ] **Scheduled Payments**: Set up recurring splits

### Medium Term

- [ ] **Multi-Chain**: Deploy to other EVM chains (Polygon, Arbitrum, etc.)
- [ ] **Smart Savings**: Auto-split between spending and savings
- [ ] **Group Pools**: Multiple senders contribute to shared pool
- [ ] **Payment Requests**: Recipients can request specific amounts
- [ ] **Mobile App**: Native iOS/Android apps using React Native
- [ ] **Notification System**: Email/SMS alerts for received payments

### Long Term

- [ ] **DeFi Integration**: Auto-invest split amounts into yield protocols
- [ ] **DAO Governance**: Community-driven feature development
- [ ] **KYC/Compliance**: Optional identity verification for institutions
- [ ] **Fiat On/Off Ramps**: Direct bank integration
- [ ] **AI Recommendations**: Smart budgeting and split suggestions
- [ ] **Cross-Chain Bridge**: Send between different blockchains

### Community Requests

Have an idea? [Open an issue](https://github.com/big14way/remittance-splitter/issues) or submit a PR!

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Add comments for complex logic
- Optimize gas usage
- Ensure mobile responsiveness

---

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/big14way/remittance-splitter/issues) with:

- Clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (browser, wallet, network)

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide
- **[TESTING.md](TESTING.md)** - Comprehensive testing documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment instructions
- **[contracts/README.md](contracts/)** - Smart contract details

---

## 🔐 Security

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Email: security@example.com (replace with your email)

We'll respond within 48 hours.

### Security Best Practices

- Never share your private key
- Always verify recipient addresses
- Start with small test amounts
- Use hardware wallets for large amounts
- Verify contract addresses on CeloScan
- Keep your wallet software updated

---

## 📄 License

This project is licensed under the **MIT License** - see below for details.

```
MIT License

Copyright (c) 2025 Celo Remittance Splitter Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Celo Foundation** - For building an amazing mobile-first blockchain
- **OpenZeppelin** - For secure, audited smart contract libraries
- **WalletConnect/Reown** - For seamless wallet integration
- **Wagmi Team** - For excellent React hooks for Ethereum
- **Tailwind CSS** - For rapid UI development
- **Community Contributors** - For feedback and support

---

## 📞 Contact & Support

- **GitHub**: [github.com/big14way/remittance-splitter](https://github.com/big14way/remittance-splitter)
- **Issues**: [Report bugs or request features](https://github.com/big14way/remittance-splitter/issues)
- **Twitter**: [@YourTwitter](https://twitter.com/yourhandle) (replace with actual)
- **Discord**: [Join our community](https://discord.gg/yourserver) (replace with actual)
- **Email**: contact@example.com (replace with actual)

---

## 🌟 Show Your Support

If this project helped you, please consider:

- ⭐ **Star this repository**
- 🐦 **Share on Twitter**
- 🔀 **Fork and contribute**
- 💬 **Spread the word**

---

## 📈 Project Roadmap

### Q1 2025
- ✅ MVP Launch on Alfajores
- ✅ Smart contract deployment
- ✅ Frontend dApp release
- [ ] Mainnet deployment
- [ ] User testing & feedback

### Q2 2025
- [ ] Multi-token support
- [ ] Mobile app development
- [ ] Address book feature
- [ ] Transaction history
- [ ] Marketing campaign

### Q3 2025
- [ ] Multi-chain expansion
- [ ] DeFi integrations
- [ ] DAO formation
- [ ] Token launch (maybe)
- [ ] Partnerships with remittance companies

### Q4 2025
- [ ] Fiat on/off ramps
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] Mobile app launch
- [ ] 100,000+ users goal

---

<div align="center">

### Built with ❤️ for the Celo ecosystem

**Making remittances accessible, affordable, and instant for everyone.**

[![Celo](https://img.shields.io/badge/Built_on-Celo-FCFF52?style=for-the-badge&logo=celo&logoColor=black)](https://celo.org)

[Website](https://example.com) • [Docs](./QUICKSTART.md) • [Demo](https://demo.example.com) • [Twitter](https://twitter.com)

</div>

---

**Happy Splitting! 💸🚀**
