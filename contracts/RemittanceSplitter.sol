// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemittanceSplitter
 * @dev Smart contract for splitting remittance payments among multiple recipients
 */
contract RemittanceSplitter is Ownable, ReentrancyGuard {
    struct Split {
        address[] recipients;
        uint256[] shares; // in basis points (1/100th of a percent)
        bool active;
    }

    mapping(bytes32 => Split) public splits;

    event SplitCreated(bytes32 indexed splitId, address[] recipients, uint256[] shares);
    event SplitExecuted(bytes32 indexed splitId, uint256 totalAmount);
    event SplitDeactivated(bytes32 indexed splitId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new split configuration
     * @param splitId Unique identifier for the split
     * @param recipients Array of recipient addresses
     * @param shares Array of shares in basis points (must sum to 10000)
     */
    function createSplit(
        bytes32 splitId,
        address[] memory recipients,
        uint256[] memory shares
    ) external onlyOwner {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == shares.length, "Length mismatch");
        require(!splits[splitId].active, "Split already exists");

        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(shares[i] > 0, "Share must be > 0");
            totalShares += shares[i];
        }
        require(totalShares == 10000, "Shares must sum to 10000");

        splits[splitId] = Split({
            recipients: recipients,
            shares: shares,
            active: true
        });

        emit SplitCreated(splitId, recipients, shares);
    }

    /**
     * @dev Execute a split payment
     * @param splitId The split configuration to use
     */
    function executeSplit(bytes32 splitId) external payable nonReentrant {
        require(msg.value > 0, "No payment sent");
        require(splits[splitId].active, "Split not active");

        Split memory split = splits[splitId];
        uint256 totalAmount = msg.value;

        for (uint256 i = 0; i < split.recipients.length; i++) {
            uint256 amount = (totalAmount * split.shares[i]) / 10000;
            (bool success, ) = split.recipients[i].call{value: amount}("");
            require(success, "Transfer failed");
        }

        emit SplitExecuted(splitId, totalAmount);
    }

    /**
     * @dev Deactivate a split configuration
     * @param splitId The split to deactivate
     */
    function deactivateSplit(bytes32 splitId) external onlyOwner {
        require(splits[splitId].active, "Split not active");
        splits[splitId].active = false;
        emit SplitDeactivated(splitId);
    }

    /**
     * @dev Get split details
     * @param splitId The split to query
     */
    function getSplit(bytes32 splitId) external view returns (
        address[] memory recipients,
        uint256[] memory shares,
        bool active
    ) {
        Split memory split = splits[splitId];
        return (split.recipients, split.shares, split.active);
    }
}
