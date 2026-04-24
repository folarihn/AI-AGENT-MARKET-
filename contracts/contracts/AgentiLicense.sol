// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC1155 } from "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import { Ownable } from "openzeppelin-contracts/contracts/access/Ownable.sol";
import { IERC165 } from "openzeppelin-contracts/contracts/utils/introspection/IERC165.sol";

interface IAgentiLicense is IERC165 {
    function mint(address to, uint256 agentId, uint256 amount) external;
    function mintedPerAgent(uint256 agentId) external view returns (uint256);
}

contract AgentiLicense is ERC1155, Ownable {
    mapping(uint256 => uint256) public mintedPerAgent;
    mapping(uint256 => address) public agentCreators;
    mapping(uint256 => uint256) public agentPrices;

    mapping(uint256 => mapping(address => bool)) public creators;

    uint256 public constant ROYALTY_PERCENT = 10;
    address public marketplace;

    string public constant name = "Agenti License";
    string public constant symbol = "AGENTIL";

    uint256 private constant ROYALTY_DENOMINATOR = 100;

    event AgentRegistered(uint256 indexed agentId, address indexed creator, uint256 price);

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {
        marketplace = initialOwner;
    }

    function setMarketplace(address newMarketplace) external onlyOwner {
        marketplace = newMarketplace;
    }

    function registerAgent(uint256 agentId, address creator, uint256 price) external onlyOwner {
        require(agentCreators[agentId] == address(0), "Already registered");
        agentCreators[agentId] = creator;
        agentPrices[agentId] = price;
        emit AgentRegistered(agentId, creator, price);
    }

    function mint(address to, uint256 agentId, uint256 amount) external {
        require(msg.sender == marketplace, "Only marketplace");
        mintedPerAgent[agentId] += amount;
        _mint(to, agentId, amount, "");
    }

    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256) {
        address creator = agentCreators[tokenId];
        uint256 royalty = (salePrice * ROYALTY_PERCENT) / ROYALTY_DENOMINATOR;
        return (creator, royalty);
    }

    function supportsInterface(bytes4 interfaceId) public pure override(ERC1155, IERC165) returns (bool) {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("ipfs://QmLicense/", _toString(tokenId)));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        temp = value;
        while (temp != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (temp % 10)));
            temp /= 10;
        }
        return string(buffer);
    }
}