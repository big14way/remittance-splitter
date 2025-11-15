# Self Protocol Integration Guide

## Overview

This document describes the integration of **Self Protocol** into the Celo Remittance Splitter dApp to enable privacy-preserving identity verification. Self Protocol uses zero-knowledge proofs to verify user attributes (age, nationality, uniqueness) without revealing personal data.

## Table of Contents

1. [What is Self Protocol?](#what-is-self-protocol)
2. [Architecture](#architecture)
3. [Frontend Integration](#frontend-integration)
4. [Smart Contract Integration](#smart-contract-integration)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## What is Self Protocol?

**Self Protocol** is a privacy-first, open-source identity protocol that enables:

- ✅ **Sybil Resistance**: Prove uniqueness without revealing identity
- ✅ **Age Verification**: Prove age > X without revealing date of birth
- ✅ **Nationality Verification**: Prove/disprove nationality without revealing passport details
- ✅ **Zero-Knowledge Proofs**: Uses zk-SNARKs for privacy-preserving verification
- ✅ **Biometric Passport Support**: Supports 129 countries' passports via NFC

### Why Self Protocol for Remittances?

Remittance applications often require:
- **Compliance**: Age and nationality verification for regulatory requirements
- **Security**: Prevent Sybil attacks and fraudulent accounts
- **Privacy**: Protect user personal information
- **Trust**: Ensure real people are using the service

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SelfVerificationModal.tsx                        │  │
│  │  - Displays QR code for Self app                  │  │
│  │  - Handles verification flow                      │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  useSelfVerification.ts (Hook)                    │  │
│  │  - Manages verification state                     │  │
│  │  - Configures disclosure requirements             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  SelfVerificationContext.tsx                      │  │
│  │  - Global verification state                      │  │
│  │  - Expiry tracking (24 hours)                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
                    User scans QR code
                    with Self mobile app
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Self Protocol (Off-chain)                   │
│  - User proves identity via biometric passport          │
│  - Zero-knowledge proof generated                       │
│  - Proof sent back to dApp                              │
└─────────────────────────────────────────────────────────┘
                            ↓
                 Frontend validates proof
                            ↓
┌─────────────────────────────────────────────────────────┐
│         Smart Contract (RemittanceSplitterWithSelf)     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  onlyVerified modifier                            │  │
│  │  - Checks if user is verified                     │  │
│  │  - Checks verification hasn't expired             │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  verifyUser() function                            │  │
│  │  - Called by backend/owner after proof validation │  │
│  │  - Stores verification expiry timestamp           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Integration

### Components Created

#### 1. **useSelfVerification.ts** - Custom Hook

Located: `frontend/src/hooks/useSelfVerification.ts`

**Purpose**: Manages Self Protocol verification state and configuration

**Key Features**:
- Initializes SelfAppBuilder with disclosure requirements
- Tracks verification status and expiry
- Handles verification success/error callbacks

**Configuration Options**:
```typescript
interface SelfVerificationConfig {
  minimumAge?: number;          // Minimum age requirement (e.g., 18)
  nationality?: boolean;         // Verify nationality
  gender?: boolean;              // Verify gender
  uniqueness?: boolean;          // Sybil-resistance check
  excludedCountries?: string[]; // ISO country codes to exclude
}
```

**Usage Example**:
```typescript
const {
  selfApp,
  isVerified,
  verificationResult,
  startVerification,
  handleVerificationSuccess,
} = useSelfVerification({
  minimumAge: 18,
  nationality: true,
  uniqueness: true,
  excludedCountries: ['IRN', 'PRK'],
});
```

#### 2. **SelfVerificationModal.tsx** - UI Component

Located: `frontend/src/components/SelfVerificationModal.tsx`

**Purpose**: Display QR code and guide users through verification

**Features**:
- QR code display using `@selfxyz/qrcode`
- Requirements list (age, uniqueness, etc.)
- Privacy information panel
- Loading states
- Error handling
- Download link for Self app

**Props**:
```typescript
interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (result: any) => void;
  minimumAge?: number;
  excludedCountries?: string[];
}
```

#### 3. **SelfVerificationContext.tsx** - Global State

Located: `frontend/src/contexts/SelfVerificationContext.tsx`

**Purpose**: Manage verification state across the application

**Features**:
- Stores verification data (attestationId, proof, publicSignals)
- Tracks verification expiry (24 hours default)
- Provides global verification status
- Context provider for React tree

**API**:
```typescript
const {
  verificationData,
  setVerificationData,
  isVerified,
  isVerificationValid,
  clearVerification,
  requireVerification,
  setRequireVerification,
} = useSelfVerificationContext();
```

### Integration into App.tsx

The main App component was updated with:

1. **Verification Status Display**:
   - Green badge when verified
   - Yellow warning when verification required
   - "Verify Now" button

2. **Verification Requirement Check**:
   - Added to `validateInputs()` function
   - Prevents payment splitting if not verified
   - Shows toast notification

3. **Verification Modal**:
   - Triggered by "Verify Now" button
   - Shown automatically if verification required but missing

---

## Smart Contract Integration

### RemittanceSplitterWithSelf.sol

Located: `contracts/RemittanceSplitterWithSelf.sol`

#### Key Features

1. **Verification Tracking**:
```solidity
mapping(address => uint256) public verifiedUsers;
uint256 public constant VERIFICATION_VALIDITY = 24 hours;
```

2. **onlyVerified Modifier**:
```solidity
modifier onlyVerified() {
    if (verificationRequired) {
        require(isVerified(msg.sender), "RemittanceSplitter: user not verified");
    }
    _;
}
```

3. **Verification Functions**:

**Manual Verification** (Owner only):
```solidity
function verifyUser(address user) external onlyOwner {
    uint256 expiryTimestamp = block.timestamp + VERIFICATION_VALIDITY;
    verifiedUsers[user] = expiryTimestamp;
    emit UserVerified(user, expiryTimestamp);
}
```

**Batch Verification**:
```solidity
function verifyUsers(address[] calldata users) external onlyOwner
```

**Check Verification Status**:
```solidity
function isVerified(address user) public view returns (bool) {
    if (!verificationRequired) return true;
    return verifiedUsers[user] > block.timestamp;
}
```

4. **Configuration Management**:
```solidity
function setVerificationRequired(bool _required) external onlyOwner
function setSelfVerificationHub(address _hub) external onlyOwner
```

#### Events

```solidity
event UserVerified(address indexed user, uint256 expiryTimestamp);
event VerificationRequirementChanged(bool enabled);
event PaymentSplit(..., bool verified);
```

---

## Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install @selfxyz/qrcode @selfxyz/core --legacy-peer-deps
```

### 2. Install Smart Contract Dependencies

Already included via OpenZeppelin:
```bash
npm install @openzeppelin/contracts
```

### 3. Verify Installation

Check that these files exist:
- `frontend/src/hooks/useSelfVerification.ts`
- `frontend/src/components/SelfVerificationModal.tsx`
- `frontend/src/contexts/SelfVerificationContext.tsx`
- `contracts/RemittanceSplitterWithSelf.sol`
- `scripts/deploySelfVersion.ts`

---

## Configuration

### Frontend Configuration

#### 1. Environment Variables

Create/update `frontend/.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_SELF_VERIFICATION_REQUIRED=true
VITE_SELF_MIN_AGE=18
VITE_SELF_EXCLUDED_COUNTRIES=IRN,PRK,SYR
```

#### 2. Update Constants

Edit `frontend/src/constants.ts`:
```typescript
export const SELF_CONFIG = {
  minimumAge: 18,
  requireUniqueness: true,
  excludedCountries: ['IRN', 'PRK', 'SYR'],
  verificationValidity: 24 * 60 * 60 * 1000, // 24 hours in ms
};
```

#### 3. Toggle Verification Requirement

In `SelfVerificationContext.tsx`, set default:
```typescript
const [requireVerification, setRequireVerification] = useState(true);
```

### Smart Contract Configuration

#### 1. Deploy Contract

**Alfajores Testnet**:
```bash
npx hardhat run scripts/deploySelfVersion.ts --network alfajores
```

**Celo Mainnet**:
```bash
npx hardhat run scripts/deploySelfVersion.ts --network celo
```

#### 2. Enable Verification (Optional)

After deployment, enable verification:
```bash
npx hardhat console --network alfajores
```

```javascript
const contract = await ethers.getContractAt(
  "RemittanceSplitterWithSelf",
  "YOUR_CONTRACT_ADDRESS"
);

// Enable verification requirement
await contract.setVerificationRequired(true);

// Set Self Protocol hub address (when available on Celo)
await contract.setSelfVerificationHub("SELF_HUB_ADDRESS");
```

#### 3. Update Frontend Contract Address

Edit `frontend/src/constants.ts`:
```typescript
export const CONTRACT_ADDRESS = "0xYourNewContractAddress";
```

---

## Usage

### User Flow

#### Step 1: Connect Wallet
User connects their Celo wallet (MetaMask, Valora, etc.)

#### Step 2: Identity Verification
1. User sees "Identity Verification Required" banner
2. Clicks "Verify Now" button
3. Modal opens with QR code
4. User downloads Self app (if needed)
5. User scans QR code with Self app
6. User proves identity using biometric passport (NFC scan)
7. Self app generates zero-knowledge proof
8. Proof sent to dApp
9. Frontend validates proof
10. User marked as verified (24-hour expiry)

#### Step 3: Use Remittance Splitter
Once verified:
- Green "Identity Verified ✓" badge shows
- User can add recipients and split payments
- Smart contract allows `splitPayment()` calls

#### Step 4: Re-verification
After 24 hours:
- Verification expires
- User sees "Verification Required" again
- Must re-verify to continue using service

### Backend Verification Flow (Advanced)

For production deployments with backend validation:

1. **Frontend** → User completes Self Protocol verification
2. **Frontend** → Sends proof to backend API
3. **Backend** → Validates proof using `@selfxyz/core`
4. **Backend** → Calls contract's `verifyUser(address)` function
5. **Smart Contract** → Updates `verifiedUsers` mapping
6. **User** → Can now call `splitPayment()`

Example backend code:
```typescript
import { SelfBackendVerifier } from '@selfxyz/core';

const verifier = new SelfBackendVerifier(/* config */);

app.post('/api/verify', async (req, res) => {
  const { attestationId, proof, publicSignals, userAddress } = req.body;

  const result = await verifier.verify(
    attestationId,
    proof,
    publicSignals
  );

  if (result.isValidDetails.isValid) {
    // Call smart contract to mark user as verified
    await contract.verifyUser(userAddress);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid proof' });
  }
});
```

---

## Security Considerations

### Frontend Security

1. **Verification Expiry**: 24-hour validity prevents stale verifications
2. **Client-side Validation**: Checks before blockchain interaction
3. **Proof Storage**: Only store necessary data (no PII)
4. **HTTPS Required**: All Self Protocol operations require secure connection

### Smart Contract Security

1. **Owner-only Functions**: Only owner can verify users
2. **Reentrancy Protection**: `nonReentrant` modifier on `splitPayment`
3. **Expiry Checks**: Verification automatically expires after 24 hours
4. **Toggle Capability**: Can disable verification requirement if needed
5. **Event Logging**: All verifications logged on-chain

### Privacy Guarantees

- ✅ **Zero-knowledge proofs**: No personal data revealed
- ✅ **Selective disclosure**: Only required attributes checked
- ✅ **No passport storage**: Passport data never leaves Self app
- ✅ **No blockchain PII**: No personal info stored on-chain

---

## Testing

### Frontend Testing

1. **Test Verification Modal**:
```bash
cd frontend
npm run dev
```
- Click "Verify Now"
- Check QR code displays
- Verify requirements list shows

2. **Test Context**:
- Check verification state persists across page navigation
- Verify expiry after 24 hours (adjust constant for testing)

3. **Test Integration**:
- Try splitting payment without verification → should block
- Complete verification → should allow payment

### Smart Contract Testing

Create test file: `test/RemittanceSplitterWithSelf.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("RemittanceSplitterWithSelf", function () {
  it("Should block unverified users when verification required", async function () {
    const [owner, user1] = await ethers.getSigners();

    const contract = await ethers.deployContract("RemittanceSplitterWithSelf", [
      ethers.ZeroAddress,
      true // verification required
    ]);

    await expect(
      contract.connect(user1).splitPayment(
        [owner.address],
        [ethers.parseUnits("1", 18)]
      )
    ).to.be.revertedWith("user not verified");
  });

  it("Should allow verified users to split payment", async function () {
    // ... test implementation
  });
});
```

Run tests:
```bash
npx hardhat test
```

---

## Troubleshooting

### Common Issues

#### 1. "Module not found: @selfxyz/qrcode"

**Solution**:
```bash
cd frontend
npm install @selfxyz/qrcode @selfxyz/core --legacy-peer-deps
```

#### 2. QR Code Not Displaying

**Checks**:
- Ensure `selfApp` is initialized in `useSelfVerification` hook
- Check browser console for errors
- Verify network connection (HTTPS required)

#### 3. "User not verified" Contract Error

**Solutions**:
- Check if verification has expired (24 hours)
- Verify `verificationRequired` is set correctly
- Call `contract.verifyUser(address)` as owner
- Check `isVerified(user)` returns true

#### 4. Verification Not Persisting

**Checks**:
- Verify `SelfVerificationProvider` wraps App component
- Check browser local storage (if implemented)
- Verify context state management

#### 5. Contract Deployment Fails

**Solutions**:
- Check PRIVATE_KEY in root `.env`
- Verify sufficient CELO balance for gas
- Check network configuration in `hardhat.config.ts`

---

## Additional Resources

- **Self Protocol Docs**: https://docs.self.xyz
- **Self Protocol GitHub**: https://github.com/selfxyz
- **Celo Documentation**: https://docs.celo.org
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts

---

## Future Enhancements

### Planned Features

1. **On-chain Verification**: Integrate directly with Self Protocol's verification hub
2. **Backend API**: Add dedicated verification backend service
3. **Multi-factor Verification**: Combine Self Protocol with additional checks
4. **Compliance Reports**: Generate verification audit trails
5. **Custom Verification Configs**: Per-user verification requirements
6. **Grace Period**: Allow limited transactions during re-verification
7. **Verification NFT**: Issue NFT upon successful verification

### Integration Roadmap

- **Q1 2025**: ✅ Frontend integration complete
- **Q1 2025**: ✅ Smart contract integration complete
- **Q2 2025**: Backend verification service
- **Q2 2025**: Self Protocol hub integration on Celo
- **Q3 2025**: Advanced compliance features
- **Q4 2025**: Multi-chain support

---

## Support

For issues related to:

- **Self Protocol**: https://discord.gg/self (or Self Protocol support channels)
- **Celo Remittance Splitter**: Open an issue on GitHub
- **Celo Network**: https://discord.gg/celo

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
**Author**: Celo Remittance Splitter Team
