// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "openzeppelin-contracts/contracts/token/ERC20/SafeERC20.sol";
import { Ownable } from "openzeppelin-contracts/contracts/access/Ownable.sol";
import { Pausable } from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

interface IAgentiLicense {
    function mint(address to, uint256 agentId, uint256 amount) external;
    function agentPrices(uint256 agentId) external view returns (uint256);
    function agentCreators(uint256 agentId) external view returns (address);
}

contract AgentiMarketplace is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IAgentiLicense public licenseContract;
    IERC20 public usdcToken;

    uint256 public constant PLATFORM_FEE_PERCENT = 15;
    uint256 public constant ROYALTY_PERCENT = 10;
    uint256 public constant FEE_DENOMINATOR = 100;

    struct Agent {
        bytes32 agentId;
        uint256 priceUSDC;
        address creatorAddress;
        bool active;
    }

    mapping(bytes32 => Agent) public agents;

    event AgentRegistered(bytes32 indexed agentId, uint256 priceUSDC, address indexed creator);
    event AgentPurchased(
        bytes32 indexed agentId,
        address indexed buyer,
        address indexed creator,
        uint256 priceUSDC,
        uint256 platformFee,
        uint256 royaltyFee
    );
    event AgentDeactivated(bytes32 indexed agentId);

    constructor(address _usdcToken, address _licenseContract, address initialOwner) Ownable(initialOwner) {
        usdcToken = IERC20(_usdcToken);
        licenseContract = IAgentiLicense(_licenseContract);
    }

    function setLicenseContract(address _licenseContract) external onlyOwner {
        licenseContract = IAgentiLicense(_licenseContract);
    }

    function registerAgent(
        bytes32 agentId,
        uint256 priceUSDC,
        address creatorAddress
    ) external onlyOwner whenNotPaused {
        require(agents[agentId].agentId == bytes32(0), "Already registered");
        require(creatorAddress != address(0), "Invalid creator");
        
        agents[agentId] = Agent({
            agentId: agentId,
            priceUSDC: priceUSDC,
            creatorAddress: creatorAddress,
            active: true
        });

        licenseContract.registerAgent(uint256(agentId), creatorAddress, priceUSDC);

        emit AgentRegistered(agentId, priceUSDC, creatorAddress);
    }

    function deactivateAgent(bytes32 agentId) external onlyOwner {
        require(agents[agentId].agentId != bytes32(0), "Not registered");
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function purchaseAgent(bytes32 agentId) external whenNotPaused nonReentrant {
        Agent memory agent = agents[agentId];
        require(agent.agentId != bytes32(0), "Agent not found");
        require(agent.active, "Agent not active");

        uint256 priceUSDC = agent.priceUSDC;
        uint256 platformFee = (priceUSDC * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 creatorAmount = priceUSDC - platformFee;

        usdcToken.safeTransferFrom(msg.sender, owner(), platformFee);
        usdcToken.safeTransferFrom(msg.sender, agent.creatorAddress, creatorAmount);

        licenseContract.mint(msg.sender, uint256(agentId), 1);

        emit AgentPurchased({
            agentId: agentId,
            buyer: msg.sender,
            creator: agent.creatorAddress,
            priceUSDC: priceUSDC,
            platformFee: platformFee,
            royaltyFee: 0
        });
    }

    function getAgent(bytes32 agentId) external view returns (
        bytes32,
        uint256,
        address,
        bool
    ) {
        Agent memory agent = agents[agentId];
        return (agent.agentId, agent.priceUSDC, agent.creatorAddress, agent.active);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}