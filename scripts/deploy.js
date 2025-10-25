const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment Script for RemittanceSplitter Contract
 *
 * This script handles:
 * 1. Contract deployment
 * 2. Deployment verification
 * 3. Network detection (mainnet/testnet)
 * 4. Saving deployment info to frontend
 * 5. Detailed logging
 */

// Network configuration with chain IDs and explorer URLs
const NETWORKS = {
  celo: {
    chainId: 42220,
    name: "Celo Mainnet",
    type: "mainnet",
    explorer: "https://explorer.celo.org",
    rpcUrl: "https://forno.celo.org"
  },
  alfajores: {
    chainId: 44787,
    name: "Celo Alfajores Testnet",
    type: "testnet",
    explorer: "https://alfajores.celoscan.io",
    rpcUrl: "https://alfajores-forno.celo-testnet.org"
  },
  hardhat: {
    chainId: 31337,
    name: "Hardhat Local Network",
    type: "local",
    explorer: null,
    rpcUrl: "http://127.0.0.1:8545"
  },
  localhost: {
    chainId: 31337,
    name: "Localhost Network",
    type: "local",
    explorer: null,
    rpcUrl: "http://127.0.0.1:8545"
  }
};

/**
 * Get network information based on current network
 * @param {string} networkName - Name of the network from Hardhat config
 * @param {bigint} chainId - Chain ID from provider
 * @returns {object} Network information
 */
function getNetworkInfo(networkName, chainId) {
  const networkInfo = NETWORKS[networkName] || {
    chainId: Number(chainId),
    name: networkName,
    type: "unknown",
    explorer: null,
    rpcUrl: null
  };

  return networkInfo;
}

/**
 * Display a prominent banner with deployment information
 * @param {string} contractAddress - Deployed contract address
 * @param {object} networkInfo - Network information object
 */
function displayDeploymentBanner(contractAddress, networkInfo) {
  const bannerWidth = 70;
  const border = "=".repeat(bannerWidth);

  console.log("\n" + border);
  console.log("  DEPLOYMENT SUCCESSFUL  ".padStart(45));
  console.log(border);
  console.log("");
  console.log("CONTRACT INFORMATION:");
  console.log("   Contract Name:    RemittanceSplitter");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log("");
  console.log("NETWORK INFORMATION:");
  console.log(`   Network Name:     ${networkInfo.name}`);
  console.log(`   Network Type:     ${networkInfo.type.toUpperCase()}`);
  console.log(`   Chain ID:         ${networkInfo.chainId}`);
  console.log(`   RPC URL:          ${networkInfo.rpcUrl || "N/A"}`);

  if (networkInfo.explorer) {
    console.log("");
    console.log("BLOCK EXPLORER:");
    console.log(`   View Contract:    ${networkInfo.explorer}/address/${contractAddress}`);
  }

  console.log("");
  console.log(border + "\n");
}

/**
 * Save deployment information to frontend directory
 * @param {string} contractAddress - Deployed contract address
 * @param {object} networkInfo - Network information object
 * @param {string} deployerAddress - Address of the deployer
 */
async function saveDeploymentInfo(contractAddress, networkInfo, deployerAddress) {
  // Step 1: Create the contracts directory if it doesn't exist
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    console.log("Creating contracts directory...");
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Step 2: Prepare deployment data
  const deploymentData = {
    contractName: "RemittanceSplitter",
    address: contractAddress,
    network: {
      name: networkInfo.name,
      chainId: networkInfo.chainId,
      type: networkInfo.type,
      rpcUrl: networkInfo.rpcUrl,
      explorer: networkInfo.explorer
    },
    deployer: deployerAddress,
    deploymentDate: new Date().toISOString(),
    timestamp: Date.now(),
    cUSDTokenAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a" // Celo cUSD address
  };

  // Step 3: Load existing deployments or create new object
  const deploymentsPath = path.join(contractsDir, "deployments.json");
  let allDeployments = {};

  if (fs.existsSync(deploymentsPath)) {
    try {
      const existingData = fs.readFileSync(deploymentsPath, "utf8");
      allDeployments = JSON.parse(existingData);
      console.log("Found existing deployments.json, updating...");
    } catch (error) {
      console.log("Warning: Could not parse existing deployments.json, creating new file...");
    }
  } else {
    console.log("Creating new deployments.json...");
  }

  // Step 4: Update deployments with new deployment
  // Store deployment by network name for easy access
  allDeployments[network.name] = deploymentData;

  // Also store the latest deployment regardless of network
  allDeployments.latest = deploymentData;

  // Step 5: Write the updated deployments to file
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(allDeployments, null, 2),
    "utf8"
  );

  console.log(`Deployment info saved to: ${deploymentsPath}`);

  // Step 6: Create a TypeScript interface file for the frontend (optional but helpful)
  const interfacePath = path.join(contractsDir, "types.ts");
  const interfaceContent = `/**
 * Auto-generated deployment types
 * Generated on: ${new Date().toISOString()}
 */

export interface NetworkInfo {
  name: string;
  chainId: number;
  type: string;
  rpcUrl: string | null;
  explorer: string | null;
}

export interface DeploymentInfo {
  contractName: string;
  address: string;
  network: NetworkInfo;
  deployer: string;
  deploymentDate: string;
  timestamp: number;
  cUSDTokenAddress: string;
}

export interface Deployments {
  [networkName: string]: DeploymentInfo;
  latest: DeploymentInfo;
}
`;

  fs.writeFileSync(interfacePath, interfaceContent, "utf8");
  console.log(`TypeScript types saved to: ${interfacePath}`);

  return deploymentsPath;
}

/**
 * Verify the deployment by calling contract functions
 * @param {object} contract - Deployed contract instance
 * @returns {boolean} True if verification passed
 */
async function verifyDeployment(contract) {
  console.log("\nVerifying deployment...");

  try {
    // Step 1: Verify contract address is valid
    const contractAddress = await contract.getAddress();
    if (!contractAddress || contractAddress === ethers.ZeroAddress) {
      throw new Error("Invalid contract address");
    }
    console.log("   Contract address is valid");

    // Step 2: Verify we can call the getTokenAddress function
    const tokenAddress = await contract.getTokenAddress();
    console.log(`   Token address accessible: ${tokenAddress}`);

    // Step 3: Verify the token address is the correct cUSD address
    const expectedCUSDAddress = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
    if (tokenAddress.toLowerCase() !== expectedCUSDAddress.toLowerCase()) {
      throw new Error(`Token address mismatch. Expected: ${expectedCUSDAddress}, Got: ${tokenAddress}`);
    }
    console.log("   cUSD token address is correct");

    // Step 4: Verify contract bytecode exists
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error("No bytecode found at contract address");
    }
    console.log("   Contract bytecode verified");

    // Step 5: Test helper functions
    const testAddress = "0x0000000000000000000000000000000000000001";
    const testAmount = ethers.parseUnits("100", 18);

    await contract.hasSufficientBalance(testAddress, testAmount);
    console.log("   hasSufficientBalance() function works");

    await contract.hasApproved(testAddress, testAmount);
    console.log("   hasApproved() function works");

    console.log("\nAll verification checks passed!");
    return true;

  } catch (error) {
    console.error("\nVerification failed:");
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Display deployment warnings based on network type
 * @param {object} networkInfo - Network information object
 */
function displayNetworkWarnings(networkInfo) {
  console.log("\nIMPORTANT NOTES:\n");

  if (networkInfo.type === "mainnet") {
    console.log("   [MAINNET] You are deploying to MAINNET!");
    console.log("   [MAINNET] This will use real CELO and the deployment is permanent!");
    console.log("   [MAINNET] Make sure you have verified the contract code!");
    console.log("   [MAINNET] Double-check all addresses and configurations!");
  } else if (networkInfo.type === "testnet") {
    console.log("   [TESTNET] You are deploying to a TESTNET");
    console.log("   [TESTNET] This is safe for testing, but use testnet tokens only");
    console.log("   [TESTNET] Consider verifying the contract on the block explorer");
  } else if (networkInfo.type === "local") {
    console.log("   [LOCAL] You are deploying to a LOCAL network");
    console.log("   [LOCAL] This is for development and testing only");
    console.log("   [LOCAL] The deployment will be lost when you restart the network");
  }

  console.log("");
}

/**
 * Main deployment function
 */
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("  RemittanceSplitter Deployment Script  ".padStart(47));
  console.log("=".repeat(70) + "\n");

  // STEP 1: Get network information
  console.log("Step 1: Detecting network...");
  const networkData = await ethers.provider.getNetwork();
  const chainId = networkData.chainId;
  const networkInfo = getNetworkInfo(network.name, chainId);

  console.log(`   Network: ${networkInfo.name}`);
  console.log(`   Type: ${networkInfo.type}`);
  console.log(`   Chain ID: ${networkInfo.chainId}`);

  // Display warnings based on network type
  displayNetworkWarnings(networkInfo);

  // STEP 2: Get deployer account information
  console.log("Step 2: Getting deployer account...");
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`   Deployer address: ${deployerAddress}`);

  // Get and display deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceInCelo = ethers.formatEther(balance);
  console.log(`   Balance: ${balanceInCelo} CELO`);

  // Check if deployer has enough balance (warn if less than 0.1 CELO)
  if (parseFloat(balanceInCelo) < 0.1 && networkInfo.type !== "local") {
    console.log("   Warning: Low balance! You may need more CELO for deployment.");
  }

  // STEP 3: Deploy the contract
  console.log("\nStep 3: Deploying RemittanceSplitter contract...");
  console.log("   Compiling contract...");

  const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitter");

  console.log("   Sending deployment transaction...");
  const splitter = await RemittanceSplitter.deploy();

  console.log("   Waiting for deployment confirmation...");
  await splitter.waitForDeployment();

  const contractAddress = await splitter.getAddress();
  console.log(`   Contract deployed at: ${contractAddress}`);

  // STEP 4: Verify the deployment
  console.log("\nStep 4: Verifying deployment...");
  const verificationPassed = await verifyDeployment(splitter);

  if (!verificationPassed) {
    throw new Error("Deployment verification failed!");
  }

  // STEP 5: Save deployment information to frontend
  console.log("\nStep 5: Saving deployment information...");
  const deploymentsPath = await saveDeploymentInfo(
    contractAddress,
    networkInfo,
    deployerAddress
  );

  // STEP 6: Display prominent deployment information
  displayDeploymentBanner(contractAddress, networkInfo);

  // STEP 7: Display next steps
  console.log("NEXT STEPS:\n");
  console.log("   1. Verify contract on block explorer (if on mainnet/testnet)");
  console.log(`      ${networkInfo.explorer ? networkInfo.explorer + "/address/" + contractAddress : "N/A"}`);
  console.log("");
  console.log("   2. Test the contract:");
  console.log("      - Approve cUSD tokens for the contract");
  console.log("      - Call splitPayment() with recipient addresses and amounts");
  console.log("");
  console.log("   3. Update your frontend:");
  console.log(`      - Deployment info saved to: ${path.relative(process.cwd(), deploymentsPath)}`);
  console.log("      - Import the address in your React components");
  console.log("");
  console.log("   4. Security considerations:");
  console.log("      - Audit the contract before mainnet deployment");
  console.log("      - Test thoroughly on testnet first");
  console.log("      - Consider getting a professional audit for mainnet");
  console.log("");

  // STEP 8: Display contract usage example
  console.log("USAGE EXAMPLE:\n");
  console.log("   // In your frontend:");
  console.log("   import deployments from './contracts/deployments.json';");
  console.log(`   const contractAddress = deployments['${network.name}'].address;`);
  console.log("   // or use the latest deployment:");
  console.log("   const contractAddress = deployments.latest.address;");
  console.log("");
  console.log("=".repeat(70) + "\n");
}

// Execute the deployment
main()
  .then(() => {
    console.log("Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed!\n");
    console.error("Error details:");
    console.error(error);
    console.log("");
    process.exit(1);
  });
