import { expect } from "chai";
import { ethers } from "hardhat";
import { RemittanceSplitter } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RemittanceSplitter", function () {
  let splitter: RemittanceSplitter;
  let owner: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let recipient3: SignerWithAddress;

  const splitId = ethers.id("test-split");

  beforeEach(async function () {
    [owner, recipient1, recipient2, recipient3] = await ethers.getSigners();

    const RemittanceSplitter = await ethers.getContractFactory("RemittanceSplitter");
    splitter = await RemittanceSplitter.deploy();
    await splitter.waitForDeployment();
  });

  describe("createSplit", function () {
    it("should create a valid split", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const shares = [6000, 4000]; // 60%, 40%

      await expect(splitter.createSplit(splitId, recipients, shares))
        .to.emit(splitter, "SplitCreated")
        .withArgs(splitId, recipients, shares);

      const split = await splitter.getSplit(splitId);
      expect(split.recipients).to.deep.equal(recipients);
      expect(split.shares).to.deep.equal(shares);
      expect(split.active).to.be.true;
    });

    it("should reject if shares don't sum to 10000", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const shares = [5000, 4000]; // Only 90%

      await expect(
        splitter.createSplit(splitId, recipients, shares)
      ).to.be.revertedWith("Shares must sum to 10000");
    });

    it("should reject if lengths don't match", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const shares = [10000]; // Length mismatch

      await expect(
        splitter.createSplit(splitId, recipients, shares)
      ).to.be.revertedWith("Length mismatch");
    });
  });

  describe("executeSplit", function () {
    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address, recipient3.address];
      const shares = [5000, 3000, 2000]; // 50%, 30%, 20%
      await splitter.createSplit(splitId, recipients, shares);
    });

    it("should split payment correctly", async function () {
      const amount = ethers.parseEther("1.0");

      const balanceBefore1 = await ethers.provider.getBalance(recipient1.address);
      const balanceBefore2 = await ethers.provider.getBalance(recipient2.address);
      const balanceBefore3 = await ethers.provider.getBalance(recipient3.address);

      await expect(
        splitter.executeSplit(splitId, { value: amount })
      ).to.emit(splitter, "SplitExecuted")
        .withArgs(splitId, amount);

      const balanceAfter1 = await ethers.provider.getBalance(recipient1.address);
      const balanceAfter2 = await ethers.provider.getBalance(recipient2.address);
      const balanceAfter3 = await ethers.provider.getBalance(recipient3.address);

      expect(balanceAfter1 - balanceBefore1).to.equal(ethers.parseEther("0.5"));
      expect(balanceAfter2 - balanceBefore2).to.equal(ethers.parseEther("0.3"));
      expect(balanceAfter3 - balanceBefore3).to.equal(ethers.parseEther("0.2"));
    });

    it("should reject if no payment sent", async function () {
      await expect(
        splitter.executeSplit(splitId)
      ).to.be.revertedWith("No payment sent");
    });

    it("should reject if split is not active", async function () {
      const invalidSplitId = ethers.id("invalid-split");
      await expect(
        splitter.executeSplit(invalidSplitId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Split not active");
    });
  });

  describe("deactivateSplit", function () {
    beforeEach(async function () {
      const recipients = [recipient1.address, recipient2.address];
      const shares = [6000, 4000];
      await splitter.createSplit(splitId, recipients, shares);
    });

    it("should deactivate a split", async function () {
      await expect(splitter.deactivateSplit(splitId))
        .to.emit(splitter, "SplitDeactivated")
        .withArgs(splitId);

      const split = await splitter.getSplit(splitId);
      expect(split.active).to.be.false;
    });
  });
});
