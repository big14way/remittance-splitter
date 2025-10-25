import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying RemittanceSplitter to ${network.name}...`);

  const signers = await ethers.getSigners();

  if (!signers || signers.length === 0) {
    console.error("\n❌ ERROR: No accounts configured!");
    console.error("Please check your .env file has a valid PRIVATE_KEY");
    process.exit(1);
  }

  const [deployer] = signers;
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} CELO`);

  if (balance === 0n) {
    console.error(`\n⚠️  WARNING: Account has 0 balance!`);
    console.error(`Fund this address: ${deployer.address}`);
    console.error(`Faucet: https://faucet.celo.org\n`);
  }

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
