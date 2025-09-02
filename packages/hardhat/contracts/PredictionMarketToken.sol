//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarketToken
 * @notice Simple ERC20 token for YES/NO prediction outcomes
 */
contract PredictionMarketToken is ERC20, Ownable {
    
    constructor(
        string memory name,
        string memory symbol,
        address owner,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(owner) {
        _mint(owner, initialSupply);
    }
    
    /**
     * @notice Mint tokens (only owner can mint)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens (only owner can burn)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}