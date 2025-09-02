//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketToken } from "./PredictionMarketToken.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarket
 * @notice Complete prediction market with YES/NO trading
 */
contract PredictionMarket is Ownable {
    
    enum PredictionType {
        MARKET_CAP_ABOVE,
        MARKET_CAP_BELOW,
        PRICE_ABOVE,
        PRICE_BELOW
    }
    
    struct MarketDetails {
        PredictionType predictionType;
        uint256 targetValue;
        uint256 deadline;
        string title;
        string predictionQuestion;
        address creator;
        bool isResolved;
        bool targetReached;
        uint256 liquidityAmount;
        uint256 createdAt;
    }
    
    MarketDetails public marketDetails;
    IERC20 public ttrustToken;
    
    // YES/NO tokens
    PredictionMarketToken public yesToken;
    PredictionMarketToken public noToken;
    
    // Trading
    uint256 public yesTokens;
    uint256 public noTokens;
    uint256 public totalLiquidity;
    
    mapping(address => uint256) public yesBalances;
    mapping(address => uint256) public noBalances;
    
    event TokensBought(address indexed buyer, bool isYes, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, bool isYes, uint256 amount, uint256 payout);
    
    constructor(
        address _creator,
        address _ttrustToken,
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _title,
        string memory _predictionQuestion,
        uint256 _liquidityAmount
    ) Ownable(_creator) {
        marketDetails = MarketDetails({
            predictionType: _predictionType,
            targetValue: _targetValue,
            deadline: _deadline,
            title: _title,
            predictionQuestion: _predictionQuestion,
            creator: _creator,
            isResolved: false,
            targetReached: false,
            liquidityAmount: _liquidityAmount,
            createdAt: block.timestamp
        });
        
        ttrustToken = IERC20(_ttrustToken);
        
        // Create YES/NO tokens
        yesToken = new PredictionMarketToken("YES", "YES", address(this), 1000000 * 1e18);
        noToken = new PredictionMarketToken("NO", "NO", address(this), 1000000 * 1e18);
        
        // Initialize with some liquidity
        yesTokens = _liquidityAmount / 2;
        noTokens = _liquidityAmount / 2;
        totalLiquidity = _liquidityAmount;
    }
    
    /**
     * @notice Buy YES or NO tokens
     */
    function buyTokens(bool _isYes, uint256 _ttrustAmount) external {
        require(_ttrustAmount > 0, "Amount must be > 0");
        require(block.timestamp < marketDetails.deadline, "Market ended");
        require(!marketDetails.isResolved, "Market resolved");
        
        // Transfer TTRUST from user
        require(ttrustToken.transferFrom(msg.sender, address(this), _ttrustAmount), "Transfer failed");
        
        // Simple AMM pricing: tokens = amount
        uint256 tokensToMint = _ttrustAmount;
        
        if (_isYes) {
            yesToken.mint(msg.sender, tokensToMint);
            yesBalances[msg.sender] += tokensToMint;
            yesTokens += tokensToMint;
        } else {
            noToken.mint(msg.sender, tokensToMint);
            noBalances[msg.sender] += tokensToMint;
            noTokens += tokensToMint;
        }
        
        totalLiquidity += _ttrustAmount;
        
        emit TokensBought(msg.sender, _isYes, tokensToMint, _ttrustAmount);
    }
    
    /**
     * @notice Get current YES/NO token amounts
     */
    function getTokenAmounts() external view returns (uint256 yes, uint256 no) {
        return (yesTokens, noTokens);
    }
    
    /**
     * @notice Get user's position
     */
    function getUserPosition(address _user) external view returns (uint256 yesAmount, uint256 noAmount) {
        return (yesBalances[_user], noBalances[_user]);
    }
    
    /**
     * @notice Get market info for display
     */
    function getMarketInfo() external view returns (MarketDetails memory) {
        return marketDetails;
    }
    
    /**
     * @notice Get current prices (simplified)
     */
    function getCurrentPrices() external view returns (uint256 yesPrice, uint256 noPrice) {
        if (yesTokens + noTokens == 0) {
            return (1e18, 1e18); // 1 TRUST per token initially
        }
        
        // Simple pricing based on token ratio
        uint256 total = yesTokens + noTokens;
        yesPrice = (noTokens * 2e18) / total; // Price inversely related to supply
        noPrice = (yesTokens * 2e18) / total;
        
        return (yesPrice, noPrice);
    }
}