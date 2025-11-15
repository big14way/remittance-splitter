// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RemittanceSplitterWithSelf
 * @dev Smart contract for splitting cUSD remittance payments with Self Protocol identity verification
 * @notice This contract allows verified users to split a single cUSD payment to multiple recipients in one transaction
 * @custom:security-contact security@example.com
 */
contract RemittanceSplitterWithSelf is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @dev cUSD token address on Celo mainnet and Alfajores testnet (same address)
    address public constant CUSD_TOKEN = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    /// @dev Reference to the cUSD token contract
    IERC20 private immutable cUSD;

    /// @dev Self Protocol Identity Verification Hub V2 address
    /// Note: This should be set to the actual Self Protocol contract address on Celo
    address public selfVerificationHub;

    /// @dev Verification configuration ID for Self Protocol
    bytes32 public verificationConfigId;

    /// @dev Mapping to track verified users and their verification expiry
    mapping(address => uint256) public verifiedUsers;

    /// @dev Default verification validity period (24 hours)
    uint256 public constant VERIFICATION_VALIDITY = 24 hours;

    /// @dev Flag to enable/disable verification requirement
    bool public verificationRequired;

    /**
     * @dev Emitted when a payment is successfully split among recipients
     * @param sender Address that initiated the split payment
     * @param recipients Array of addresses that received payments
     * @param amounts Array of amounts received by each recipient
     * @param totalAmount Total amount that was split
     * @param verified Whether the sender was verified via Self Protocol
     */
    event PaymentSplit(
        address indexed sender,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount,
        bool verified
    );

    /**
     * @dev Emitted when a user is verified through Self Protocol
     * @param user Address of the verified user
     * @param expiryTimestamp Timestamp when verification expires
     */
    event UserVerified(address indexed user, uint256 expiryTimestamp);

    /**
     * @dev Emitted when verification requirement is toggled
     * @param enabled Whether verification is now required
     */
    event VerificationRequirementChanged(bool enabled);

    /**
     * @dev Constructor initializes the cUSD token reference
     * @param _selfVerificationHub Address of Self Protocol verification hub (can be zero to disable)
     * @param _verificationRequired Whether to require verification initially
     */
    constructor(address _selfVerificationHub, bool _verificationRequired) Ownable(msg.sender) {
        cUSD = IERC20(CUSD_TOKEN);
        selfVerificationHub = _selfVerificationHub;
        verificationRequired = _verificationRequired;
    }

    /**
     * @dev Modifier to check if user is verified (if verification is required)
     */
    modifier onlyVerified() {
        if (verificationRequired) {
            require(isVerified(msg.sender), "RemittanceSplitter: user not verified");
        }
        _;
    }

    /**
     * @dev Splits a cUSD payment among multiple recipients
     * @notice Caller must first approve this contract to spend the total amount of cUSD
     * @notice If verification is required, caller must be verified through Self Protocol
     * @param recipients Array of recipient addresses to receive payments
     * @param amounts Array of amounts (in cUSD wei) corresponding to each recipient
     *
     * Requirements:
     * - If verification is enabled, caller must be verified and verification must not be expired
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
    ) external nonReentrant onlyVerified {
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
        emit PaymentSplit(
            msg.sender,
            recipients,
            amounts,
            totalAmount,
            verificationRequired && isVerified(msg.sender)
        );
    }

    /**
     * @dev Manually verify a user (called by backend or owner)
     * @param user Address of the user to verify
     * @notice This allows backend verification after Self Protocol proof validation
     */
    function verifyUser(address user) external onlyOwner {
        require(user != address(0), "RemittanceSplitter: zero address");
        uint256 expiryTimestamp = block.timestamp + VERIFICATION_VALIDITY;
        verifiedUsers[user] = expiryTimestamp;
        emit UserVerified(user, expiryTimestamp);
    }

    /**
     * @dev Batch verify multiple users
     * @param users Array of user addresses to verify
     */
    function verifyUsers(address[] calldata users) external onlyOwner {
        uint256 expiryTimestamp = block.timestamp + VERIFICATION_VALIDITY;
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "RemittanceSplitter: zero address");
            verifiedUsers[users[i]] = expiryTimestamp;
            emit UserVerified(users[i], expiryTimestamp);
        }
    }

    /**
     * @dev Check if a user is verified and verification hasn't expired
     * @param user Address to check
     * @return bool True if user is verified and verification is valid
     */
    function isVerified(address user) public view returns (bool) {
        if (!verificationRequired) {
            return true; // If verification not required, all users are "verified"
        }
        return verifiedUsers[user] > block.timestamp;
    }

    /**
     * @dev Get verification expiry timestamp for a user
     * @param user Address to check
     * @return uint256 Expiry timestamp (0 if not verified)
     */
    function getVerificationExpiry(address user) external view returns (uint256) {
        return verifiedUsers[user];
    }

    /**
     * @dev Toggle verification requirement
     * @param _required Whether to require verification
     */
    function setVerificationRequired(bool _required) external onlyOwner {
        verificationRequired = _required;
        emit VerificationRequirementChanged(_required);
    }

    /**
     * @dev Update Self Protocol verification hub address
     * @param _selfVerificationHub New verification hub address
     */
    function setSelfVerificationHub(address _selfVerificationHub) external onlyOwner {
        selfVerificationHub = _selfVerificationHub;
    }

    /**
     * @dev Update verification config ID
     * @param _configId New verification configuration ID
     */
    function setVerificationConfigId(bytes32 _configId) external onlyOwner {
        verificationConfigId = _configId;
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

    /**
     * @dev Checks if user can perform split payment (verified if required, has balance, and has approval)
     * @param user Address of the user to check
     * @param totalAmount Total amount needed for the split
     * @return bool True if user can perform split payment
     */
    function canSplitPayment(address user, uint256 totalAmount) external view returns (bool) {
        return isVerified(user) &&
               cUSD.balanceOf(user) >= totalAmount &&
               cUSD.allowance(user, address(this)) >= totalAmount;
    }
}
