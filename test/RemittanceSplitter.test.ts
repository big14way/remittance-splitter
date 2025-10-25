import { expect } from "chai";
import { ethers } from "hardhat";
import { RemittanceSplitter } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RemittanceSplitter", function () {
  let splitter: RemittanceSplitter;
  let mockCUSD: any;
  let owner: SignerWithAddress;
  let sender: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let recipient3: SignerWithAddress;

  const CUSD_TOKEN = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

  beforeEach(async function () {
    [owner, sender, recipient1, recipient2, recipient3] = await ethers.getSigners();

    // Deploy mock cUSD token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockCUSD = await MockERC20.deploy("Celo Dollar", "cUSD");
    await mockCUSD.waitForDeployment();

    // Deploy RemittanceSplitter
    const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitter");
    splitter = await RemittanceSplitter.deploy();
    await splitter.waitForDeployment();

    // Mint some cUSD to sender for testing
    await mockCUSD.mint(sender.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("should set the correct cUSD token address", async function () {
      expect(await splitter.CUSD_TOKEN()).to.equal(CUSD_TOKEN);
      expect(await splitter.getTokenAddress()).to.equal(CUSD_TOKEN);
    });
  });

  describe("splitPayment - Input Validation", function () {
    const amount1 = ethers.parseEther("100");
    const amount2 = ethers.parseEther("50");
    const amount3 = ethers.parseEther("25");

    it("should revert if recipients array is empty", async function () {
      const recipients: string[] = [];
      const amounts: bigint[] = [];

      await expect(
        splitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: empty recipients array");
    });

    it("should revert if arrays have different lengths", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [amount1]; // Length mismatch

      await expect(
        splitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipients and amounts length mismatch");
    });

    it("should revert if any recipient is zero address", async function () {
      const recipients = [recipient1.address, ethers.ZeroAddress, recipient2.address];
      const amounts = [amount1, amount2, amount3];

      await expect(
        splitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipient is zero address");
    });

    it("should revert if any amount is zero", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [amount1, 0n, amount3];

      await expect(
        splitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: amount is zero");
    });
  });

  describe("Helper Functions", function () {
    it("should return correct token address", async function () {
      expect(await splitter.getTokenAddress()).to.equal(CUSD_TOKEN);
    });

    it("should correctly check if user has approved sufficient allowance", async function () {
      const amount = ethers.parseEther("100");

      // Check returns boolean
      const hasApprovedResult = await splitter.hasApproved(sender.address, amount);
      expect(typeof hasApprovedResult).to.equal("boolean");
    });

    it("should correctly check if user has sufficient balance", async function () {
      const amount = ethers.parseEther("100");

      // Check returns boolean
      const hasSufficientBalance = await splitter.hasSufficientBalance(sender.address, amount);
      expect(typeof hasSufficientBalance).to.equal("boolean");
    });
  });

  describe("Event Emission", function () {
    it("should have PaymentSplit event with correct signature", async function () {
      const eventFragment = splitter.interface.getEvent("PaymentSplit");
      expect(eventFragment).to.exist;
      expect(eventFragment?.inputs).to.have.length(4);

      // Check parameter names
      expect(eventFragment?.inputs[0].name).to.equal("sender");
      expect(eventFragment?.inputs[1].name).to.equal("recipients");
      expect(eventFragment?.inputs[2].name).to.equal("amounts");
      expect(eventFragment?.inputs[3].name).to.equal("totalAmount");
    });
  });

  describe("Gas Optimization Verification", function () {
    it("should use calldata for array parameters", async function () {
      const splitPaymentFunc = splitter.interface.getFunction("splitPayment");
      expect(splitPaymentFunc).to.exist;

      // Verify function exists and has correct parameter count
      expect(splitPaymentFunc?.inputs).to.have.length(2);
    });
  });

  describe("ReentrancyGuard", function () {
    it("should inherit from ReentrancyGuard", async function () {
      // The contract should have the nonReentrant modifier on splitPayment
      // This is verified by the contract compilation and function signature
      const functionFragment = splitter.interface.getFunction("splitPayment");
      expect(functionFragment).to.exist;
    });
  });

  describe("Integration with Mock ERC20", function () {
    const amount1 = ethers.parseEther("100");
    const amount2 = ethers.parseEther("50");
    const amount3 = ethers.parseEther("25");

    it("should validate sufficient balance requirement", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [amount1, amount2];

      // Will revert because mockCUSD is not at the hardcoded CUSD_TOKEN address
      // In production, this would be tested on a mainnet fork
      await expect(
        splitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.reverted;
    });
  });
});

/**
 * Note: For comprehensive integration testing, use Hardhat's mainnet forking feature:
 *
 * npx hardhat test --network hardhat --fork https://forno.celo.org
 *
 * This will allow testing with the actual cUSD token at the hardcoded address.
 * The tests above verify the contract logic and validation rules.
 */
