//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockTTrustToken
 * @notice Mock ERC20 token for testing TTrust prediction markets
 * @dev Simple ERC20 implementation with minting capabilities for testing
 */
contract MockTTrustToken is IERC20, Ownable {
    
    /////////////////
    /// Events //////
    /////////////////
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    //////////////////////////
    /// State Variables //////
    //////////////////////////

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    //////////////////
    ////Constructor///
    //////////////////

    constructor(
        string memory _name,
        string memory _symbol, 
        uint256 _initialSupply
    ) Ownable(msg.sender) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        totalSupply = _initialSupply;
        _balances[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    /////////////////
    /// Functions ///
    /////////////////

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockTTrustToken: mint to the zero address");
        
        totalSupply += amount;
        unchecked {
            _balances[to] += amount;
        }
        
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Burn tokens from sender
     */
    function burn(uint256 amount) external {
        address account = msg.sender;
        require(_balances[account] >= amount, "MockTTrustToken: burn amount exceeds balance");
        
        unchecked {
            _balances[account] -= amount;
            totalSupply -= amount;
        }
        
        emit Burn(account, amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @notice Airdrop tokens to multiple addresses (testing utility)
     */
    function airdrop(address[] calldata recipients, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0)) {
                totalSupply += amount;
                unchecked {
                    _balances[recipients[i]] += amount;
                }
                emit Transfer(address(0), recipients[i], amount);
            }
        }
    }

    /////////////////////////
    /// Internal Functions //
    /////////////////////////

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "MockTTrustToken: transfer from the zero address");
        require(to != address(0), "MockTTrustToken: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "MockTTrustToken: transfer amount exceeds balance");
        
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "MockTTrustToken: approve from the zero address");
        require(spender != address(0), "MockTTrustToken: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "MockTTrustToken: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}