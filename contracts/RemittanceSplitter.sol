// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemittanceSplitter
 * @dev Smart contract for splitting cUSD remittance payments among multiple recipients
 * @notice This contract allows users to split a single cUSD payment to multiple recipients in one transaction
 * @custom:security-contact security@example.com
 */
contract RemittanceSplitter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev cUSD token address on Celo mainnet
    address public constant CUSD_TOKEN = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    /// @dev Reference to the cUSD token contract
    IERC20 private immutable cUSD;

    /**
     * @dev Emitted when a payment is successfully split among recipients
     * @param sender Address that initiated the split payment
     * @param recipients Array of addresses that received payments
     * @param amounts Array of amounts received by each recipient
     * @param totalAmount Total amount that was split
     */
    event PaymentSplit(
        address indexed sender,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount
    );

    /**
     * @dev Constructor initializes the cUSD token reference
     */
    constructor() {
        cUSD = IERC20(CUSD_TOKEN);
    }

    /**
     * @dev Splits a cUSD payment among multiple recipients
     * @notice Caller must first approve this contract to spend the total amount of cUSD
     * @param recipients Array of recipient addresses to receive payments
     * @param amounts Array of amounts (in cUSD wei) corresponding to each recipient
     *
     * Requirements:
     * - `recipients` and `amounts` arrays must have the same length
     * - Arrays must not be empty
     * - No recipient address can be zero address
     * - No amount can be zero
     * - Caller must have sufficient cUSD balance
     * - Caller must have approved this contract for at least the total amount
     *
     * Emits a {PaymentSplit} event
     *
     * @custom:security Uses SafeERC20 to prevent reentrancy and handle token transfer failures
     * @custom:gas-optimization Caches array length and uses unchecked arithmetic where safe
     */
    function splitPayment(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        // Input validation
        uint256 recipientsLength = recipients.length;
        require(recipientsLength > 0, "RemittanceSplitter: empty recipients array");
        require(
            recipientsLength == amounts.length,
            "RemittanceSplitter: recipients and amounts length mismatch"
        );

        // Calculate total amount and validate inputs
        uint256 totalAmount;
        for (uint256 i = 0; i < recipientsLength; ) {
            require(
                recipients[i] != address(0),
                "RemittanceSplitter: recipient is zero address"
            );
            require(amounts[i] > 0, "RemittanceSplitter: amount is zero");

            totalAmount += amounts[i];

            unchecked {
                ++i;
            }
        }

        // Check sender has sufficient balance
        require(
            cUSD.balanceOf(msg.sender) >= totalAmount,
            "RemittanceSplitter: insufficient cUSD balance"
        );

        // Check sender has approved sufficient allowance
        require(
            cUSD.allowance(msg.sender, address(this)) >= totalAmount,
            "RemittanceSplitter: insufficient allowance"
        );

        // Execute transfers to all recipients
        for (uint256 i = 0; i < recipientsLength; ) {
            cUSD.safeTransferFrom(msg.sender, recipients[i], amounts[i]);

            unchecked {
                ++i;
            }
        }

        // Emit event for off-chain tracking
        emit PaymentSplit(msg.sender, recipients, amounts, totalAmount);
    }

    /**
     * @dev Returns the cUSD token address used by this contract
     * @return address The cUSD token contract address
     */
    function getTokenAddress() external pure returns (address) {
        return CUSD_TOKEN;
    }

    /**
     * @dev Checks if a user has approved sufficient allowance for a split payment
     * @param user Address of the user to check
     * @param totalAmount Total amount needed for the split
     * @return bool True if user has sufficient allowance, false otherwise
     */
    function hasApproved(address user, uint256 totalAmount) external view returns (bool) {
        return cUSD.allowance(user, address(this)) >= totalAmount;
    }

    /**
     * @dev Checks if a user has sufficient balance for a split payment
     * @param user Address of the user to check
     * @param totalAmount Total amount needed for the split
     * @return bool True if user has sufficient balance, false otherwise
     */
    function hasSufficientBalance(address user, uint256 totalAmount) external view returns (bool) {
        return cUSD.balanceOf(user) >= totalAmount;
    }
}
