# Self Protocol - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install @selfxyz/qrcode @selfxyz/core --legacy-peer-deps
cd ..
```

### Step 2: Deploy Enhanced Smart Contract

```bash
# Alfajores Testnet
npx hardhat run scripts/deploySelfVersion.ts --network alfajores

# OR Celo Mainnet
npx hardhat run scripts/deploySelfVersion.ts --network celo
```

Copy the deployed contract address from the output.

### Step 3: Update Frontend Configuration

Edit `frontend/src/constants.ts`:

```typescript
// Add this to your constants file
export const CONTRACT_ADDRESS_WITH_SELF = "0xYOUR_NEW_CONTRACT_ADDRESS";

export const SELF_CONFIG = {
  minimumAge: 18,
  requireUniqueness: true,
  excludedCountries: [], // Add country codes if needed, e.g., ['IRN', 'PRK']
  verificationValidity: 24 * 60 * 60 * 1000, // 24 hours
};
```

### Step 4: Test the Integration

```bash
# Start frontend
npm run frontend
```

1. Navigate to http://localhost:5173
2. Connect your wallet
3. Click "Verify Now" button
4. A QR code should appear
5. Download Self app from https://self.xyz (if you haven't already)
6. Scan QR code with Self app
7. Complete identity verification
8. Use the remittance splitter!

### Step 5: Enable Verification (Optional)

By default, verification is **disabled** for easy testing. To enable:

```bash
npx hardhat console --network alfajores
```

Then run:
```javascript
const contract = await ethers.getContractAt(
  "RemittanceSplitterWithSelf",
  "YOUR_CONTRACT_ADDRESS"
);

await contract.setVerificationRequired(true);
console.log("Verification now required!");
```

---

## ⚙️ Configuration Options

### Frontend: Toggle Verification Requirement

In `frontend/src/contexts/SelfVerificationContext.tsx` (line 24):

```typescript
// Change this to false to disable verification
const [requireVerification, setRequireVerification] = useState(true);
```

### Verification Requirements

In `frontend/src/components/SelfVerificationModal.tsx`, customize:

```typescript
<SelfVerificationModal
  minimumAge={18}           // Change minimum age
  excludedCountries={[]}    // Add excluded country codes
  onVerificationComplete={...}
/>
```

### Smart Contract: Verification Settings

```javascript
// Enable/disable verification
await contract.setVerificationRequired(true);

// Set Self Protocol hub address (when available on Celo)
await contract.setSelfVerificationHub("SELF_HUB_ADDRESS");
```

---

## 📋 Files Created

The integration added these files to your project:

### Frontend
- ✅ `frontend/src/hooks/useSelfVerification.ts` - Verification hook
- ✅ `frontend/src/components/SelfVerificationModal.tsx` - UI component
- ✅ `frontend/src/contexts/SelfVerificationContext.tsx` - Global state

### Smart Contracts
- ✅ `contracts/RemittanceSplitterWithSelf.sol` - Enhanced contract

### Scripts
- ✅ `scripts/deploySelfVersion.ts` - Deployment script

### Documentation
- ✅ `SELF_PROTOCOL_INTEGRATION.md` - Full guide
- ✅ `SELF_SETUP_QUICKSTART.md` - This file

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run dev
```

Test verification flow:
1. ✅ QR code displays
2. ✅ Verification status updates
3. ✅ Payment blocked when not verified
4. ✅ Payment allowed after verification

### Smart Contract Testing

Create test:
```bash
npx hardhat test
```

---

## 🐛 Troubleshooting

### "User not verified" error
- Verification may have expired (24 hours)
- Check: `await contract.isVerified(yourAddress)`
- Re-verify using the QR code

### QR Code not showing
- Check console for errors
- Verify `@selfxyz/qrcode` is installed
- Ensure HTTPS (required for Self Protocol)

### Dependencies won't install
- Use `--legacy-peer-deps` flag:
  ```bash
  npm install @selfxyz/qrcode @selfxyz/core --legacy-peer-deps
  ```

---

## 📚 Learn More

- **Full Documentation**: See `SELF_PROTOCOL_INTEGRATION.md`
- **Self Protocol Docs**: https://docs.self.xyz
- **Self Protocol Website**: https://self.xyz

---

## ✨ What You Get

### Privacy-Preserving Features
- ✅ Age verification without revealing date of birth
- ✅ Nationality check without storing passport data
- ✅ Sybil resistance (uniqueness proof)
- ✅ Zero-knowledge proofs (no PII on blockchain)

### User Experience
- ✅ Simple QR code verification
- ✅ 24-hour verification validity
- ✅ Clear verification status badges
- ✅ Mobile-first design (Self app)

### Compliance & Security
- ✅ Regulatory compliance (age, nationality)
- ✅ Fraud prevention (Sybil resistance)
- ✅ Smart contract access control
- ✅ Audit trail (on-chain events)

---

**Ready to go!** 🎉

For detailed information, see [SELF_PROTOCOL_INTEGRATION.md](./SELF_PROTOCOL_INTEGRATION.md)
