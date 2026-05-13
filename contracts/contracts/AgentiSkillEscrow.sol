// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgentiSkillEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdcToken;

    uint256 public constant PLATFORM_FEE_PERCENT = 15;
    uint256 public constant FEE_DENOMINATOR = 100;
    uint256 public constant MIN_WITHDRAWAL_AMOUNT = 1e6; // $1.00 USDC (6 decimals)

    mapping(address => bool) public operators;
    mapping(bytes32 => mapping(address => uint256)) public userBalances;
    mapping(address => mapping(bytes32 => uint256)) public creatorPendingWithdrawals;

    struct SkillConfig {
        bytes32 skillId;
        uint256 pricePerCall;
        address creator;
        bool active;
        uint256 totalDeposited;
        uint256 totalCreatorEarnings;
    }

    mapping(bytes32 => SkillConfig) public skillConfigs;

    event OperatorUpdated(address indexed operator, bool status);
    event Deposited(address indexed user, bytes32 indexed skillId, uint256 amount);
    event CallDeducted(address indexed user, bytes32 indexed skillId, uint256 amount, bytes32 callId);
    event Withdrawn(address indexed user, bytes32 indexed skillId, uint256 amount);
    event EarningsWithdrawn(bytes32 indexed skillId, address indexed creator, uint256 amount);
    event SkillRegistered(bytes32 indexed skillId, address indexed creator, uint256 pricePerCall);
    event SkillDeactivated(bytes32 indexed skillId);

    error ZeroAddress();
    error NotOperator();
    error InsufficientBalance();
    error ZeroAmount();
    error SkillNotRegistered();
    error SkillNotActive();
    error BelowMinimumWithdrawal();
    error NoEarningsToWithdraw();

    constructor(address _usdcToken, address initialOwner) Ownable(initialOwner) {
        if (_usdcToken == address(0)) revert ZeroAddress();
        if (initialOwner == address(0)) revert ZeroAddress();
        
        usdcToken = IERC20(_usdcToken);
    }

    modifier onlyOperator() {
        if (!operators[msg.sender]) revert NotOperator();
        _;
    }

    function setOperator(address operator, bool status) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    function registerSkill(bytes32 skillId, address creator, uint256 pricePerCall) external onlyOwner whenNotPaused {
        if (skillConfigs[skillId].skillId != bytes32(0)) revert SkillNotRegistered();
        if (creator == address(0)) revert ZeroAddress();
        if (pricePerCall == 0) revert ZeroAmount();

        skillConfigs[skillId] = SkillConfig({
            skillId: skillId,
            pricePerCall: pricePerCall,
            creator: creator,
            active: true,
            totalDeposited: 0,
            totalCreatorEarnings: 0
        });

        emit SkillRegistered(skillId, creator, pricePerCall);
    }

    function deactivateSkill(bytes32 skillId) external onlyOwner {
        if (skillConfigs[skillId].skillId == bytes32(0)) revert SkillNotRegistered();
        skillConfigs[skillId].active = false;
        emit SkillDeactivated(skillId);
    }

    function getBalance(address user, bytes32 skillId) external view returns (uint256) {
        return userBalances[skillId][user];
    }

    function getSkillConfig(bytes32 skillId) external view returns (
        bytes32,
        uint256,
        address,
        bool,
        uint256,
        uint256
    ) {
        SkillConfig memory config = skillConfigs[skillId];
        return (
            config.skillId,
            config.pricePerCall,
            config.creator,
            config.active,
            config.totalDeposited,
            config.totalCreatorEarnings
        );
    }

    function getPendingEarnings(address creator, bytes32 skillId) external view returns (uint256) {
        return creatorPendingWithdrawals[creator][skillId];
    }

    function deposit(bytes32 skillId, uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (skillConfigs[skillId].skillId == bytes32(0)) revert SkillNotRegistered();
        if (!skillConfigs[skillId].active) revert SkillNotActive();

        userBalances[skillId][msg.sender] += amount;
        skillConfigs[skillId].totalDeposited += amount;

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, skillId, amount);
    }

    function deductCall(
        address user,
        bytes32 skillId,
        uint256 amount,
        bytes32 callId
    ) external onlyOperator whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        SkillConfig storage config = skillConfigs[skillId];
        if (config.skillId == bytes32(0)) revert SkillNotRegistered();
        if (!config.active) revert SkillNotActive();

        uint256 balance = userBalances[skillId][user];
        if (balance < amount) revert InsufficientBalance();

        // Effects before interactions (reentrancy protection)
        userBalances[skillId][user] = balance - amount;

        uint256 platformFee = (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 creatorAmount = amount - platformFee;

        creatorPendingWithdrawals[config.creator][skillId] += creatorAmount;
        config.totalCreatorEarnings += creatorAmount;

        emit CallDeducted(user, skillId, amount, callId);
    }

    function withdraw(bytes32 skillId) external whenNotPaused nonReentrant {
        if (skillConfigs[skillId].skillId == bytes32(0)) revert SkillNotRegistered();

        uint256 balance = userBalances[skillId][msg.sender];
        if (balance < MIN_WITHDRAWAL_AMOUNT) revert BelowMinimumWithdrawal();

        // Effects before interactions
        userBalances[skillId][msg.sender] = 0;
        skillConfigs[skillId].totalDeposited -= balance;

        // Interaction
        usdcToken.safeTransfer(msg.sender, balance);

        emit Withdrawn(msg.sender, skillId, balance);
    }

    function withdrawCreatorEarnings(bytes32 skillId) external whenNotPaused nonReentrant {
        SkillConfig storage config = skillConfigs[skillId];
        if (config.skillId == bytes32(0)) revert SkillNotRegistered();
        if (msg.sender != config.creator) revert NotOperator();

        uint256 earnings = creatorPendingWithdrawals[config.creator][skillId];
        if (earnings < MIN_WITHDRAWAL_AMOUNT) revert BelowMinimumWithdrawal();

        // Effects before interactions
        creatorPendingWithdrawals[config.creator][skillId] = 0;

        // Interaction
        usdcToken.safeTransfer(config.creator, earnings);

        emit EarningsWithdrawn(skillId, config.creator, earnings);
    }

    function canCallSkill(address user, bytes32 skillId) external view returns (bool canCall, uint256 maxCalls) {
        SkillConfig memory config = skillConfigs[skillId];
        if (config.skillId == bytes32(0) || !config.active) {
            return (false, 0);
        }
        
        uint256 balance = userBalances[skillId][user];
        if (balance < config.pricePerCall) {
            return (false, 0);
        }
        
        maxCalls = balance / config.pricePerCall;
        return (true, maxCalls);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}