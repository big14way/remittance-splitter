# RemittanceSplitter Deployment Guide

This guide explains how to deploy the RemittanceSplitter contract to different networks using the deployment script.

## Overview

The deployment script ([scripts/deploy.js](scripts/deploy.js)) provides a comprehensive deployment solution that:

1. Deploys the RemittanceSplitter contract
2. Verifies the deployment was successful
3. Detects and displays network information (mainnet/testnet/local)
4. Logs the contract address prominently
5. Saves deployment information to `frontend/src/contracts/deployments.json`
6. Creates TypeScript type definitions

## Prerequisites

Before deploying, ensure you have:

- Node.js installed (v18 or higher recommended)
- Dependencies installed: `npm install`
- A `.env` file with your private key (for testnet/mainnet deployments)

## Environment Setup

Create a `.env` file in the project root:

```bash
PRIVATE_KEY=your_private_key_here
```

**  IMPORTANT:** Never commit your `.env` file to version control!

## Deployment Commands

### Local Network (Hardhat)

Deploy to a local Hardhat network for testing:

```bash
# Start local network in one terminal
npx hardhat node

# Deploy in another terminal
npx hardhat run scripts/deploy.js --network localhost
```

### Celo Alfajores Testnet

Deploy to the Celo testnet for public testing:

```bash
npx hardhat run scripts/deploy.js --network alfajores
```

**Get testnet tokens:** https://faucet.celo.org/alfajores

### Celo Mainnet

Deploy to production (  use with caution):

```bash
npx hardhat run scripts/deploy.js --network celo
```

## Deployment Process

The script performs the following steps:

### Step 1: Network Detection
- Detects the current network (mainnet/testnet/local)
- Displays network information (name, chain ID, type)
- Shows appropriate warnings based on network type

### Step 2: Deployer Account
- Retrieves the deployer's address
- Checks the deployer's balance
- Warns if balance is low (< 0.1 CELO)

### Step 3: Contract Deployment
- Compiles the RemittanceSplitter contract
- Deploys the contract to the selected network
- Waits for deployment confirmation
- Logs the deployed contract address

### Step 4: Deployment Verification
- Verifies the contract address is valid
- Tests contract functions (getTokenAddress, hasApproved, hasSufficientBalance)
- Confirms cUSD token address is correct
- Verifies contract bytecode exists

### Step 5: Save Deployment Info
- Creates `frontend/src/contracts/` directory if needed
- Saves deployment data to `deployments.json`
- Creates TypeScript type definitions in `types.ts`
- Stores both network-specific and latest deployment info

### Step 6: Display Results
- Shows a prominent banner with contract address
- Displays block explorer link (for testnet/mainnet)
- Provides next steps and usage examples

## Deployment Output

After successful deployment, you'll see:

```
======================================================================
  DEPLOYMENT SUCCESSFUL
======================================================================

CONTRACT INFORMATION:
   Contract Name:    RemittanceSplitter
   Contract Address: 0x1234567890abcdef...

NETWORK INFORMATION:
   Network Name:     Celo Alfajores Testnet
   Network Type:     TESTNET
   Chain ID:         44787
   RPC URL:          https://alfajores-forno.celo-testnet.org

BLOCK EXPLORER:
   View Contract:    https://alfajores.celoscan.io/address/0x1234...

======================================================================
```

## Deployment Files

### deployments.json

Location: `frontend/src/contracts/deployments.json`

Structure:
```json
{
  "alfajores": {
    "contractName": "RemittanceSplitter",
    "address": "0x...",
    "network": {
      "name": "Celo Alfajores Testnet",
      "chainId": 44787,
      "type": "testnet",
      "rpcUrl": "https://alfajores-forno.celo-testnet.org",
      "explorer": "https://alfajores.celoscan.io"
    },
    "deployer": "0x...",
    "deploymentDate": "2024-01-01T00:00:00.000Z",
    "timestamp": 1234567890,
    "cUSDTokenAddress": "0x765DE816845861e75A25fCA122bb6898B8B1282a"
  },
  "latest": {
    // Same structure as above, always points to most recent deployment
  }
}
```

### types.ts

Location: `frontend/src/contracts/types.ts`

Auto-generated TypeScript interfaces for type-safe frontend integration.

## Using Deployment Info in Frontend

### JavaScript/React

```javascript
import deployments from './contracts/deployments.json';

// Get deployment for specific network
const alfajoresAddress = deployments.alfajores.address;

// Or use the latest deployment
const latestAddress = deployments.latest.address;
const latestNetwork = deployments.latest.network.name;

console.log(`Contract deployed at: ${latestAddress} on ${latestNetwork}`);
```

### TypeScript/React

```typescript
import deployments from './contracts/deployments.json';
import { Deployments, DeploymentInfo } from './contracts/types';

const typedDeployments: Deployments = deployments;
const latest: DeploymentInfo = typedDeployments.latest;

console.log(`Contract: ${latest.address}`);
console.log(`Network: ${latest.network.name}`);
console.log(`Explorer: ${latest.network.explorer}/address/${latest.address}`);
```

## Network Configuration

The script supports the following networks:

| Network | Chain ID | Type | RPC URL |
|---------|----------|------|---------|
| Celo Mainnet | 42220 | mainnet | https://forno.celo.org |
| Celo Alfajores | 44787 | testnet | https://alfajores-forno.celo-testnet.org |
| Hardhat | 31337 | local | http://127.0.0.1:8545 |
| Localhost | 31337 | local | http://127.0.0.1:8545 |

## Verification

### Automatic Verification

The script automatically verifies:
- Contract address validity
- Token address configuration
- Contract bytecode presence
- Helper function accessibility

### Manual Verification on Block Explorer

For testnet/mainnet deployments, verify your contract on the block explorer:

1. Go to the explorer URL provided in the deployment output
2. Navigate to the "Contract" tab
3. Click "Verify and Publish"
4. Enter your contract details and source code

## Troubleshooting

### "Insufficient balance" error
- Ensure your wallet has enough CELO for gas fees
- Get testnet tokens from the faucet for Alfajores

### "Network not found" error
- Check your `hardhat.config.ts` has the network configured
- Verify your `.env` file contains the correct private key

### "Deployment verification failed"
- Check that the contract compiled successfully
- Ensure you're deploying to the correct network
- Try deploying again

### Contract not appearing in deployments.json
- Check the `frontend/src/contracts/` directory was created
- Verify file write permissions
- Check console for error messages

## Security Best Practices

### For Testnet Deployments
- Use a dedicated testnet wallet
- Never use mainnet private keys on testnet
- Test thoroughly before moving to mainnet

### For Mainnet Deployments
- Audit your contract code
- Test extensively on testnet first
- Use a hardware wallet for mainnet deployments
- Consider professional security audits
- Double-check all addresses and configurations
- Start with a small test transaction

## Next Steps After Deployment

1. **Verify on Block Explorer** (recommended for testnet/mainnet)
   - Submit contract source code for verification
   - This allows others to interact with your contract

2. **Test the Contract**
   - Approve cUSD tokens for the contract
   - Test with small amounts first
   - Try splitPayment() with 2-3 recipients

3. **Update Frontend**
   - Import the deployment address from `deployments.json`
   - Configure your web3 provider
   - Test the UI with the deployed contract

4. **Monitor**
   - Watch for transactions on the block explorer
   - Monitor gas usage
   - Check for any errors or issues

## Support

If you encounter issues:

1. Check the error messages in the console output
2. Verify your network configuration
3. Ensure you have sufficient balance
4. Review the [Hardhat documentation](https://hardhat.org/docs)
5. Check [Celo documentation](https://docs.celo.org/)

## Additional Resources

- [Hardhat Deployment Guide](https://hardhat.org/guides/deploying.html)
- [Celo Developer Documentation](https://docs.celo.org/)
- [Celo Explorer (Mainnet)](https://explorer.celo.org/)
- [Celo Explorer (Alfajores)](https://alfajores.celoscan.io/)
- [Celo Testnet Faucet](https://faucet.celo.org/alfajores)
