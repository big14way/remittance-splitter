# Celo Remittance Splitter

A smart contract and dApp for splitting remittance payments on the Celo blockchain.

## Project Structure

```
celo-remittance-splitter/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment scripts
├── test/              # Contract tests
├── frontend/          # React frontend application
├── hardhat.config.ts  # Hardhat configuration
└── .env.example       # Environment variables template
```

## Setup

### Prerequisites

- Node.js v16 or higher
- npm or yarn

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install --legacy-peer-deps
```

**Note**: The frontend dependencies may require `--legacy-peer-deps` flag due to peer dependency conflicts with the latest React 19.

3. Create `.env` file from template:
```bash
cp .env.example .env
```

Add your private key to the `.env` file.

## Smart Contract Development

### Compile contracts
```bash
npm run compile
```

### Run tests
```bash
npm test
```

### Deploy to Alfajores (testnet)
```bash
npm run deploy:alfajores
```

### Deploy to Celo Mainnet
```bash
npm run deploy:celo
```

## Frontend Development

### Run development server
```bash
npm run frontend
```

### Build for production
```bash
npm run frontend:build
```

## Networks

- **Celo Mainnet**: Chain ID 42220
- **Alfajores Testnet**: Chain ID 44787

## Technologies

- **Smart Contracts**: Hardhat, Solidity, OpenZeppelin
- **Frontend**: React, Vite, TypeScript, Wagmi, RainbowKit, Viem
- **Blockchain**: Celo
