// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemittanceSplitterTestable
 * @dev Testable version of RemittanceSplitter that accepts any ERC20 token
 * @notice FOR TESTING PURPOSES ONLY - Production version uses hardcoded cUSD
 */
contract RemittanceSplitterTestable is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev ERC20 token for testing
    IERC20 private immutable token;

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
     * @dev Constructor accepts token address for testing
     * @param _token Address of the ERC20 token to use
     */
    constructor(address _token) {
        require(_token != address(0), "RemittanceSplitter: token is zero address");
        token = IERC20(_token);
    }

    /**
     * @dev Splits a token payment among multiple recipients
     * @notice Caller must first approve this contract to spend the total amount
     * @param recipients Array of recipient addresses to receive payments
     * @param amounts Array of amounts corresponding to each recipient
     *
     * Requirements:
     * - `recipients` and `amounts` arrays must have the same length
     * - Arrays must not be empty
     * - No recipient address can be zero address
     * - No amount can be zero
     * - Caller must have sufficient balance
     * - Caller must have approved this contract for at least the total amount
     *
     * Emits a {PaymentSplit} event
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
            token.balanceOf(msg.sender) >= totalAmount,
            "RemittanceSplitter: insufficient balance"
        );

        // Check sender has approved sufficient allowance
        require(
            token.allowance(msg.sender, address(this)) >= totalAmount,
            "RemittanceSplitter: insufficient allowance"
        );

        // Execute transfers to all recipients
        for (uint256 i = 0; i < recipientsLength; ) {
            token.safeTransferFrom(msg.sender, recipients[i], amounts[i]);

            unchecked {
                ++i;
            }
        }

        // Emit event for off-chain tracking
        emit PaymentSplit(msg.sender, recipients, amounts, totalAmount);
    }

    /**
     * @dev Returns the token address used by this contract
     * @return address The token contract address
     */
    function getTokenAddress() external view returns (address) {
        return address(token);
    }

    /**
     * @dev Checks if a user has approved sufficient allowance for a split payment
     * @param user Address of the user to check
     * @param totalAmount Total amount needed for the split
     * @return bool True if user has sufficient allowance, false otherwise
     */
    function hasApproved(address user, uint256 totalAmount) external view returns (bool) {
        return token.allowance(user, address(this)) >= totalAmount;
    }

    /**
     * @dev Checks if a user has sufficient balance for a split payment
     * @param user Address of the user to check
     * @param totalAmount Total amount needed for the split
     * @return bool True if user has sufficient balance, false otherwise
     */
    function hasSufficientBalance(address user, uint256 totalAmount) external view returns (bool) {
        return token.balanceOf(user) >= totalAmount;
    }
}
