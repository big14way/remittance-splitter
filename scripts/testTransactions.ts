import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Configuration
const CUSD_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const DELAY_BETWEEN_TRANSACTIONS = 15000; // 15 seconds
const MIN_AMOUNT = "0.01"; // Minimum cUSD per recipient
const MAX_AMOUNT = "0.1"; // Maximum cUSD per recipient

// Test recipient addresses (replace with actual addresses you control for mainnet)
const TEST_RECIPIENTS = [
  "0x1234567890123456789012345678901234567890", // Replace with actual addresses
  "0x2345678901234567890123456789012345678901",
  "0x3456789012345678901234567890123456789012",
  "0x4567890123456789012345678901234567890123",
  "0x5678901234567890123456789012345678901234",
];

interface TransactionResult {
  testNumber: number;
  scenario: string;
  recipients: string[];
  amounts: string[];
  txHash: string;
  success: boolean;
  error?: string;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random amount between min and max
 */
function getRandomAmount(): string {
  const min = parseFloat(MIN_AMOUNT);
  const max = parseFloat(MAX_AMOUNT);
  const amount = Math.random() * (max - min) + min;
  return amount.toFixed(4);
}

/**
 * Get random subset of recipients
 */
function getRandomRecipients(count: number): string[] {
  const shuffled = [...TEST_RECIPIENTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Approve cUSD for spending
 */
async function approveCUSD(
  tokenContract: any,
  spenderAddress: string,
  amount: string,
  signer: any
): Promise<string> {
  console.log(`  📝 Approving ${amount} cUSD...`);

  const amountWei = ethers.parseUnits(amount, 18);
  const tx = await tokenContract.connect(signer).approve(spenderAddress, amountWei);
  const receipt = await tx.wait();

  console.log(`  ✅ Approved! TX: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Execute a split payment transaction
 */
async function executeSplitPayment(
  splitterContract: any,
  recipients: string[],
  amounts: string[],
  signer: any
): Promise<{ txHash: string; success: boolean; error?: string }> {
  try {
    const amountsWei = amounts.map(amt => ethers.parseUnits(amt, 18));

    console.log(`  💸 Splitting payment to ${recipients.length} recipients...`);

    const tx = await splitterContract.connect(signer).splitPayment(recipients, amountsWei);
    const receipt = await tx.wait();

    console.log(`  ✅ Split successful! TX: ${receipt.hash}`);

    return {
      txHash: receipt.hash,
      success: true,
    };
  } catch (error: any) {
    console.error(`  ❌ Split failed:`, error.message);
    return {
      txHash: "",
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify transaction on blockchain
 */
async function verifyTransaction(
  provider: any,
  txHash: string
): Promise<boolean> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt && receipt.status === 1;
  } catch (error) {
    console.error(`  ⚠️  Error verifying transaction:`, error);
    return false;
  }
}

/**
 * Get cUSD balance
 */
async function getCUSDBalance(
  tokenContract: any,
  address: string
): Promise<string> {
  const balance = await tokenContract.balanceOf(address);
  return ethers.formatUnits(balance, 18);
}

/**
 * Main test function
 */
async function main() {
  console.log("🚀 Starting RemittanceSplitter Test Transactions\n");

  // Get network
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Validate network
  if (network.chainId !== 42220n && network.chainId !== 44787n) {
    throw new Error("This script only works on Celo Mainnet (42220) or Alfajores (44787)");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`👤 Signer: ${signerAddress}\n`);

  // Get deployed contract address
  let splitterAddress: string;
  if (network.chainId === 42220n) {
    // Mainnet - Update with actual deployed address
    splitterAddress = "0x0000000000000000000000000000000000000000";
    if (splitterAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Please deploy to mainnet first and update the address in this script");
    }
  } else {
    // Alfajores
    splitterAddress = "0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88";
  }

  console.log(`📄 RemittanceSplitter: ${splitterAddress}`);
  console.log(`💵 cUSD Token: ${CUSD_TOKEN_ADDRESS}\n`);

  // Connect to contracts
  const splitterContract = await ethers.getContractAt("RemittanceSplitter", splitterAddress);
  const tokenContract = await ethers.getContractAt(
    ["function approve(address spender, uint256 amount) returns (bool)", "function balanceOf(address account) view returns (uint256)"],
    CUSD_TOKEN_ADDRESS
  );

  // Check initial balance
  const initialBalance = await getCUSDBalance(tokenContract, signerAddress);
  console.log(`💰 Initial cUSD Balance: ${initialBalance} cUSD`);

  if (parseFloat(initialBalance) < 1) {
    console.log("\n⚠️  Warning: Low cUSD balance. Get some from https://faucet.celo.org (testnet)");
    console.log("or swap for cUSD on a DEX (mainnet)\n");
  }

  // Define test scenarios
  const testScenarios = [
    { name: "2-Way Split", recipientCount: 2 },
    { name: "3-Way Split", recipientCount: 3 },
    { name: "2-Way Split (Variation)", recipientCount: 2 },
    { name: "4-Way Split", recipientCount: 4 },
    { name: "3-Way Split (Variation)", recipientCount: 3 },
    { name: "2-Way Split (Final)", recipientCount: 2 },
    { name: "5-Way Split", recipientCount: 5 },
    { name: "3-Way Split (Large)", recipientCount: 3 },
  ];

  const results: TransactionResult[] = [];

  console.log(`\n🧪 Running ${testScenarios.length} test transactions...\n`);
  console.log("=" .repeat(80));

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    const testNumber = i + 1;

    console.log(`\n📋 Test ${testNumber}/${testScenarios.length}: ${scenario.name}`);
    console.log("-".repeat(80));

    // Get random recipients
    const recipients = getRandomRecipients(scenario.recipientCount);
    const amounts = recipients.map(() => getRandomAmount());

    console.log(`  Recipients (${recipients.length}):`);
    recipients.forEach((addr, idx) => {
      console.log(`    ${idx + 1}. ${addr} → ${amounts[idx]} cUSD`);
    });

    const totalAmount = amounts.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4);
    console.log(`  Total Amount: ${totalAmount} cUSD`);

    try {
      // Approve cUSD
      await approveCUSD(tokenContract, splitterAddress, totalAmount, signer);

      // Wait a bit
      await sleep(3000);

      // Execute split payment
      const result = await executeSplitPayment(splitterContract, recipients, amounts, signer);

      // Verify transaction
      if (result.success) {
        await sleep(3000);
        const verified = await verifyTransaction(ethers.provider, result.txHash);
        console.log(`  ${verified ? "✅" : "⚠️"} Transaction ${verified ? "verified" : "pending verification"}`);
      }

      // Store result
      results.push({
        testNumber,
        scenario: scenario.name,
        recipients,
        amounts,
        txHash: result.txHash,
        success: result.success,
        error: result.error,
      });

      // Delay before next transaction (except last one)
      if (i < testScenarios.length - 1) {
        console.log(`\n  ⏳ Waiting ${DELAY_BETWEEN_TRANSACTIONS / 1000}s before next transaction...`);
        await sleep(DELAY_BETWEEN_TRANSACTIONS);
      }
    } catch (error: any) {
      console.error(`  ❌ Test failed:`, error.message);
      results.push({
        testNumber,
        scenario: scenario.name,
        recipients,
        amounts,
        txHash: "",
        success: false,
        error: error.message,
      });
    }
  }

  // Final balance check
  console.log("\n" + "=".repeat(80));
  const finalBalance = await getCUSDBalance(tokenContract, signerAddress);
  console.log(`\n💰 Final cUSD Balance: ${finalBalance} cUSD`);
  console.log(`💸 Total Spent: ${(parseFloat(initialBalance) - parseFloat(finalBalance)).toFixed(4)} cUSD`);

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 TRANSACTION SUMMARY");
  console.log("=".repeat(80));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);

  console.log("\n📝 Detailed Results:\n");

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(`${status} Test ${result.testNumber}: ${result.scenario}`);
    console.log(`   Recipients: ${result.recipients.length}`);
    console.log(`   Total: ${result.amounts.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4)} cUSD`);

    if (result.success) {
      console.log(`   TX: ${result.txHash}`);

      // Generate explorer link
      const explorerUrl = network.chainId === 42220n
        ? `https://celoscan.io/tx/${result.txHash}`
        : `https://alfajores.celoscan.io/tx/${result.txHash}`;
      console.log(`   Explorer: ${explorerUrl}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  });

  // Save results to file
  const fs = require("fs");
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const filename = `test-results-${network.name}-${timestamp}.json`;

  fs.writeFileSync(
    filename,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.chainId.toString(),
        timestamp: new Date().toISOString(),
        signer: signerAddress,
        splitterAddress,
        initialBalance,
        finalBalance,
        totalSpent: (parseFloat(initialBalance) - parseFloat(finalBalance)).toFixed(4),
        results,
      },
      null,
      2
    )
  );

  console.log(`\n💾 Results saved to: ${filename}`);
  console.log("\n🎉 Test transactions completed!\n");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
