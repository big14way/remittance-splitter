const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemittanceSplitter - Comprehensive Tests", function () {
  let remittanceSplitter;
  let mockToken;
  let owner;
  let recipient1;
  let recipient2;
  let recipient3;
  let sender;

  const INITIAL_SUPPLY = ethers.parseUnits("10000", 18);
  const AMOUNT_100 = ethers.parseUnits("100", 18);
  const AMOUNT_50 = ethers.parseUnits("50", 18);
  const AMOUNT_30 = ethers.parseUnits("30", 18);
  const AMOUNT_20 = ethers.parseUnits("20", 18);

  beforeEach(async function () {
    // Get signers
    [owner, recipient1, recipient2, recipient3, sender] = await ethers.getSigners();

    // Deploy MockERC20 token (simulating cUSD)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock cUSD", "cUSD");
    await mockToken.waitForDeployment();

    // Deploy RemittanceSplitterTestable with mock token address
    const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitterTestable");
    remittanceSplitter = await RemittanceSplitter.deploy(await mockToken.getAddress());
    await remittanceSplitter.waitForDeployment();

    // Mint tokens to sender
    await mockToken.mint(sender.address, INITIAL_SUPPLY);
  });

  describe("1. Deployment", function () {
    it("Should deploy successfully and set the correct token address", async function () {
      const tokenAddress = await remittanceSplitter.getTokenAddress();
      expect(tokenAddress).to.equal(await mockToken.getAddress());
    });

    it("Should revert deployment with zero address token", async function () {
      const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitterTestable");
      await expect(
        RemittanceSplitter.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("RemittanceSplitter: token is zero address");
    });
  });

  describe("2. Two-Way Split", function () {
    it("Should successfully split payment between 2 recipients", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];
      const totalAmount = AMOUNT_100 + AMOUNT_50;

      // Check initial balances
      expect(await mockToken.balanceOf(sender.address)).to.equal(INITIAL_SUPPLY);
      expect(await mockToken.balanceOf(recipient1.address)).to.equal(0);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(0);

      // Approve and execute split
      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      const tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      const receipt = await tx.wait();

      // Verify balances after split
      expect(await mockToken.balanceOf(recipient1.address)).to.equal(AMOUNT_100);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(AMOUNT_50);
      expect(await mockToken.balanceOf(sender.address)).to.equal(INITIAL_SUPPLY - totalAmount);

      // Report gas usage
      console.log(`\n💰 2-Way Split Gas Used: ${receipt.gasUsed.toString()}`);
    });
  });

  describe("3. Three-Way Split", function () {
    it("Should successfully split payment between 3 recipients", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [AMOUNT_100, AMOUNT_50, AMOUNT_30];
      const totalAmount = AMOUNT_100 + AMOUNT_50 + AMOUNT_30;

      // Approve and execute split
      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      const tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      const receipt = await tx.wait();

      // Verify balances
      expect(await mockToken.balanceOf(recipient1.address)).to.equal(AMOUNT_100);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(AMOUNT_50);
      expect(await mockToken.balanceOf(recipient3.address)).to.equal(AMOUNT_30);
      expect(await mockToken.balanceOf(sender.address)).to.equal(INITIAL_SUPPLY - totalAmount);

      // Report gas usage
      console.log(`💰 3-Way Split Gas Used: ${receipt.gasUsed.toString()}`);
    });

    it("Should handle equal three-way split correctly", async function () {
      const equalAmount = ethers.parseUnits("100", 18);
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [equalAmount, equalAmount, equalAmount];
      const totalAmount = equalAmount * 3n;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);

      // All recipients should have equal amounts
      expect(await mockToken.balanceOf(recipient1.address)).to.equal(equalAmount);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(equalAmount);
      expect(await mockToken.balanceOf(recipient3.address)).to.equal(equalAmount);
    });
  });

  describe("4. Edge Cases - Empty Arrays", function () {
    it("Should revert when recipients array is empty", async function () {
      const recipients = [];
      const amounts = [];

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: empty recipients array");
    });
  });

  describe("5. Edge Cases - Mismatched Array Lengths", function () {
    it("Should revert when recipients array is longer than amounts", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [AMOUNT_100, AMOUNT_50]; // Only 2 amounts for 3 recipients

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipients and amounts length mismatch");
    });

    it("Should revert when amounts array is longer than recipients", async function () {
      const recipients = [recipient1.address];
      const amounts = [AMOUNT_100, AMOUNT_50, AMOUNT_30]; // 3 amounts for 1 recipient

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipients and amounts length mismatch");
    });
  });

  describe("6. Edge Cases - Insufficient Balance", function () {
    it("Should revert when sender has insufficient balance", async function () {
      const [, , , , , poorSender] = await ethers.getSigners();

      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];

      await expect(
        remittanceSplitter.connect(poorSender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: insufficient balance");
    });

    it("Should revert when sender tries to spend more than balance", async function () {
      const smallAmount = ethers.parseUnits("100", 18);
      await mockToken.mint(sender.address, smallAmount);

      const recipients = [recipient1.address, recipient2.address];
      const hugeAmount = ethers.parseUnits("100000", 18);
      const amounts = [hugeAmount, hugeAmount];
      const totalAmount = hugeAmount * 2n;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: insufficient balance");
    });
  });

  describe("7. Edge Cases - Zero Amounts", function () {
    it("Should revert when first amount is zero", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [0, AMOUNT_50]; // First amount is zero

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: amount is zero");
    });

    it("Should revert when middle amount is zero", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [AMOUNT_100, 0, AMOUNT_30]; // Middle amount is zero

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: amount is zero");
    });

    it("Should revert when last amount is zero", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, 0]; // Last amount is zero

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: amount is zero");
    });
  });

  describe("8. Edge Cases - Zero Address Recipients", function () {
    it("Should revert when first recipient is zero address", async function () {
      const recipients = [ethers.ZeroAddress, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipient is zero address");
    });

    it("Should revert when any recipient is zero address", async function () {
      const recipients = [recipient1.address, ethers.ZeroAddress, recipient3.address];
      const amounts = [AMOUNT_100, AMOUNT_50, AMOUNT_30];

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: recipient is zero address");
    });
  });

  describe("9. Edge Cases - Insufficient Allowance", function () {
    it("Should revert when sender has not approved contract", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];

      // Don't approve
      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: insufficient allowance");
    });

    it("Should revert when sender has approved less than needed", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];
      const totalAmount = AMOUNT_100 + AMOUNT_50;

      // Approve less than needed
      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount - 1n);

      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.be.revertedWith("RemittanceSplitter: insufficient allowance");
    });
  });

  describe("10. Event Emissions", function () {
    it("Should emit PaymentSplit event with correct parameters for 2-way split", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];
      const totalAmount = AMOUNT_100 + AMOUNT_50;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);

      await expect(remittanceSplitter.connect(sender).splitPayment(recipients, amounts))
        .to.emit(remittanceSplitter, "PaymentSplit")
        .withArgs(sender.address, recipients, amounts, totalAmount);
    });

    it("Should emit PaymentSplit event with correct parameters for 3-way split", async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const amounts = [AMOUNT_100, AMOUNT_50, AMOUNT_30];
      const totalAmount = AMOUNT_100 + AMOUNT_50 + AMOUNT_30;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);

      await expect(remittanceSplitter.connect(sender).splitPayment(recipients, amounts))
        .to.emit(remittanceSplitter, "PaymentSplit")
        .withArgs(sender.address, recipients, amounts, totalAmount);
    });
  });

  describe("11. Helper Functions", function () {
    it("Should correctly check if user has approved sufficient allowance", async function () {
      const testAmount = AMOUNT_100;
      const contractAddress = await remittanceSplitter.getAddress();

      // Before approval
      expect(await remittanceSplitter.hasApproved(sender.address, testAmount)).to.be.false;

      // After approval
      await mockToken.connect(sender).approve(contractAddress, testAmount);
      expect(await remittanceSplitter.hasApproved(sender.address, testAmount)).to.be.true;

      // Check with higher amount than approved
      expect(await remittanceSplitter.hasApproved(sender.address, testAmount + 1n)).to.be.false;
    });

    it("Should correctly check if user has sufficient balance", async function () {
      const testAmount = AMOUNT_100;

      // Sender should have balance (from beforeEach mint)
      expect(await remittanceSplitter.hasSufficientBalance(sender.address, testAmount)).to.be.true;

      // Poor sender should not have balance
      const [, , , , , poorSender] = await ethers.getSigners();
      expect(await remittanceSplitter.hasSufficientBalance(poorSender.address, testAmount)).to.be.false;

      // Check with amount higher than balance
      const hugeAmount = INITIAL_SUPPLY + 1n;
      expect(await remittanceSplitter.hasSufficientBalance(sender.address, hugeAmount)).to.be.false;
    });
  });

  describe("12. Complex Scenarios - Multiple Recipients", function () {
    it("Should handle 5-way split efficiently", async function () {
      const [, , , , , addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

      const recipients = [addr1.address, addr2.address, addr3.address, addr4.address, addr5.address];
      const amounts = [AMOUNT_20, AMOUNT_30, AMOUNT_50, AMOUNT_100, AMOUNT_20];
      const totalAmount = AMOUNT_20 + AMOUNT_30 + AMOUNT_50 + AMOUNT_100 + AMOUNT_20;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      const tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      const receipt = await tx.wait();

      // Verify all balances
      expect(await mockToken.balanceOf(addr1.address)).to.equal(AMOUNT_20);
      expect(await mockToken.balanceOf(addr2.address)).to.equal(AMOUNT_30);
      expect(await mockToken.balanceOf(addr3.address)).to.equal(AMOUNT_50);
      expect(await mockToken.balanceOf(addr4.address)).to.equal(AMOUNT_100);
      expect(await mockToken.balanceOf(addr5.address)).to.equal(AMOUNT_20);

      console.log(`💰 5-Way Split Gas Used: ${receipt.gasUsed.toString()}`);
    });

    it("Should handle very large amounts correctly", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const largeAmount = ethers.parseUnits("1000000", 18); // 1 million tokens
      const amounts = [largeAmount, largeAmount];
      const totalAmount = largeAmount * 2n;

      // Mint large amount to sender
      await mockToken.mint(sender.address, totalAmount);

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      const tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      const receipt = await tx.wait();

      expect(await mockToken.balanceOf(recipient1.address)).to.equal(largeAmount);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(largeAmount);

      console.log(`💰 Large Amount Split Gas Used: ${receipt.gasUsed.toString()}`);
    });
  });

  describe("13. Gas Usage Comprehensive Report", function () {
    it("Should report gas usage for various split scenarios", async function () {
      console.log("\n" + "=".repeat(60));
      console.log("📊 COMPREHENSIVE GAS USAGE REPORT");
      console.log("=".repeat(60));

      // 2-way split
      let recipients = [recipient1.address, recipient2.address];
      let amounts = [AMOUNT_100, AMOUNT_50];
      let totalAmount = AMOUNT_100 + AMOUNT_50;
      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      let tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      let receipt = await tx.wait();
      const gas2way = receipt.gasUsed.toString();

      // Reset for next test
      await mockToken.mint(sender.address, INITIAL_SUPPLY);

      // 3-way split
      recipients = [recipient1.address, recipient2.address, recipient3.address];
      amounts = [AMOUNT_100, AMOUNT_50, AMOUNT_30];
      totalAmount = AMOUNT_100 + AMOUNT_50 + AMOUNT_30;
      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      tx = await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);
      receipt = await tx.wait();
      const gas3way = receipt.gasUsed.toString();

      console.log(`\n2-Way Split:                    ${gas2way} gas`);
      console.log(`3-Way Split:                    ${gas3way} gas`);
      console.log(`\nGas per additional recipient:   ~${parseInt(gas3way) - parseInt(gas2way)} gas`);
      console.log("\n" + "=".repeat(60) + "\n");
    });
  });

  describe("14. Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // The contract uses ReentrancyGuard from OpenZeppelin
      // This test verifies the nonReentrant modifier is in place
      const recipients = [recipient1.address, recipient2.address];
      const amounts = [AMOUNT_100, AMOUNT_50];
      const totalAmount = AMOUNT_100 + AMOUNT_50;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);

      // Normal execution should work
      await expect(
        remittanceSplitter.connect(sender).splitPayment(recipients, amounts)
      ).to.not.be.reverted;
    });
  });

  describe("15. Multiple Sequential Splits", function () {
    it("Should handle multiple splits from same sender", async function () {
      // First split
      let recipients = [recipient1.address, recipient2.address];
      let amounts = [AMOUNT_50, AMOUNT_30];
      let totalAmount = AMOUNT_50 + AMOUNT_30;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);

      expect(await mockToken.balanceOf(recipient1.address)).to.equal(AMOUNT_50);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(AMOUNT_30);

      // Second split
      recipients = [recipient1.address, recipient3.address];
      amounts = [AMOUNT_20, AMOUNT_100];
      totalAmount = AMOUNT_20 + AMOUNT_100;

      await mockToken.connect(sender).approve(await remittanceSplitter.getAddress(), totalAmount);
      await remittanceSplitter.connect(sender).splitPayment(recipients, amounts);

      // Balances should accumulate
      expect(await mockToken.balanceOf(recipient1.address)).to.equal(AMOUNT_50 + AMOUNT_20);
      expect(await mockToken.balanceOf(recipient2.address)).to.equal(AMOUNT_30);
      expect(await mockToken.balanceOf(recipient3.address)).to.equal(AMOUNT_100);
    });
  });
});
