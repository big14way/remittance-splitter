import { ethers } from "hardhat";

async function main() {
  console.log("Deploying RemittanceSplitterWithSelf contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  // Constructor parameters
  // Self Protocol Verification Hub address (set to zero address initially, can be updated later)
  const selfVerificationHub = ethers.ZeroAddress;

  // Start with verification disabled to allow testing
  const verificationRequired = false;

  console.log("\nDeployment parameters:");
  console.log("- Self Verification Hub:", selfVerificationHub);
  console.log("- Verification Required:", verificationRequired);

  // Deploy the contract
  const RemittanceSplitterWithSelf = await ethers.getContractFactory("RemittanceSplitterWithSelf");
  const splitter = await RemittanceSplitterWithSelf.deploy(
    selfVerificationHub,
    verificationRequired
  );

  await splitter.waitForDeployment();

  const contractAddress = await splitter.getAddress();
  console.log("\n✅ RemittanceSplitterWithSelf deployed to:", contractAddress);

  // Display contract info
  const tokenAddress = await splitter.getTokenAddress();
  const isVerificationRequired = await splitter.verificationRequired();
  const owner = await splitter.owner();

  console.log("\nContract Information:");
  console.log("- Contract Address:", contractAddress);
  console.log("- cUSD Token Address:", tokenAddress);
  console.log("- Verification Required:", isVerificationRequired);
  console.log("- Contract Owner:", owner);

  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend/src/constants.ts with the new contract address");
  console.log("2. If using Self Protocol, call setSelfVerificationHub() with the correct address");
  console.log("3. Enable verification by calling setVerificationRequired(true) when ready");
  console.log("4. Verify the contract on CeloScan:");
  console.log(`   npx hardhat verify --network <network> ${contractAddress} "${selfVerificationHub}" ${verificationRequired}`);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contract: "RemittanceSplitterWithSelf",
    address: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    constructorArgs: {
      selfVerificationHub,
      verificationRequired,
    },
    tokenAddress,
    owner,
  };

  console.log("\n📄 Deployment Details:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
