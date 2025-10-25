import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying RemittanceSplitter to ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} CELO`);

  const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitter");
  const splitter = await RemittanceSplitter.deploy();

  await splitter.waitForDeployment();

  const address = await splitter.getAddress();
  console.log(`\n✅ RemittanceSplitter deployed to: ${address}`);

  // Verify the cUSD token address
  const cUSDAddress = await splitter.CUSD_TOKEN();
  console.log(`   Using cUSD token at: ${cUSDAddress}`);

  // Display network information
  console.log(`\n📝 Network Details:`);
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

  console.log(`\n🎉 Deployment complete!`);
  console.log(`\nNext steps:`);
  console.log(`1. Verify contract on explorer (if on mainnet/testnet)`);
  console.log(`2. Test splitPayment function with cUSD`);
  console.log(`3. Update frontend with contract address\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
