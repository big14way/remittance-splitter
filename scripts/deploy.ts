import { ethers } from "hardhat";

async function main() {
  console.log("Deploying RemittanceSplitter...");

  const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitter");
  const splitter = await RemittanceSplitter.deploy();

  await splitter.waitForDeployment();

  const address = await splitter.getAddress();
  console.log(`RemittanceSplitter deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
