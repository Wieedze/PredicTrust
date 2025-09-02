//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleNativeMarket
 * @notice Simple prediction market using native TTRUST
 */
contract SimpleNativeMarket is Ownable {
    
    enum PredictionType {
        MARKET_CAP_ABOVE,
        MARKET_CAP_BELOW,
        PRICE_ABOVE,
        PRICE_BELOW
    }
    
    // Market details
    PredictionType public predictionType;
    uint256 public targetValue;
    uint256 public deadline;
    string public title;
    string public predictionQuestion;
    address public creator;
    
    // Market state
    uint256 public totalLiquidity;
    uint256 public yesPool;
    uint256 public noPool;
    bool public isResolved;
    bool public targetReached;
    
    // User positions (in TTRUST wei)
    mapping(address => uint256) public yesPositions;
    mapping(address => uint256) public noPositions;
    
    // Events
    event YesPurchased(address indexed buyer, uint256 amount, uint256 ttrust);
    event NoPurchased(address indexed buyer, uint256 amount, uint256 ttrust);
    event MarketResolved(bool targetReached);
    event Redeemed(address indexed user, uint256 ttrust);
    
    constructor(
        address _creator,
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _title,
        string memory _predictionQuestion
    ) payable Ownable(_creator) {
        creator = _creator;
        predictionType = _predictionType;
        targetValue = _targetValue;
        deadline = _deadline;
        title = _title;
        predictionQuestion = _predictionQuestion;
        
        // Initialize pools with sent TTRUST
        totalLiquidity = msg.value;
        yesPool = msg.value / 2;  // 50/50 initial split
        noPool = msg.value / 2;
        
        require(msg.value > 0, "Must provide initial liquidity");
    }
    
    /**
     * @notice Buy YES tokens with native TTRUST
     */
    function buyYes() external payable {
        require(msg.value > 0, "Must send TTRUST");
        require(block.timestamp < deadline, "Market expired");
        require(!isResolved, "Market resolved");
        
        uint256 yesToBuy = calculateYesToBuy(msg.value);
        require(yesToBuy > 0, "Invalid purchase amount");
        
        yesPositions[msg.sender] += yesToBuy;
        yesPool += msg.value;
        
        emit YesPurchased(msg.sender, yesToBuy, msg.value);
    }
    
    /**
     * @notice Buy NO tokens with native TTRUST  
     */
    function buyNo() external payable {
        require(msg.value > 0, "Must send TTRUST");
        require(block.timestamp < deadline, "Market expired");
        require(!isResolved, "Market resolved");
        
        uint256 noToBuy = calculateNoToBuy(msg.value);
        require(noToBuy > 0, "Invalid purchase amount");
        
        noPositions[msg.sender] += noToBuy;
        noPool += msg.value;
        
        emit NoPurchased(msg.sender, noToBuy, msg.value);
    }
    
    /**
     * @notice Simple AMM pricing for YES tokens
     */
    function calculateYesToBuy(uint256 ttrust) public view returns (uint256) {
        if (yesPool == 0) return ttrust;
        // Simple formula: more expensive as pool grows
        return (ttrust * 1e18) / (1e18 + yesPool * 1e18 / (yesPool + noPool));
    }
    
    /**
     * @notice Simple AMM pricing for NO tokens  
     */
    function calculateNoToBuy(uint256 ttrust) public view returns (uint256) {
        if (noPool == 0) return ttrust;
        // Simple formula: more expensive as pool grows
        return (ttrust * 1e18) / (1e18 + noPool * 1e18 / (yesPool + noPool));
    }
    
    /**
     * @notice Get current YES price (TTRUST per YES token)
     */
    function getYesPrice() external view returns (uint256) {
        if (yesPool == 0) return 1e18; // 1 TTRUST
        return (yesPool * 1e18) / (yesPool + noPool);
    }
    
    /**
     * @notice Get current NO price (TTRUST per NO token)
     */
    function getNoPrice() external view returns (uint256) {
        if (noPool == 0) return 1e18; // 1 TTRUST  
        return (noPool * 1e18) / (yesPool + noPool);
    }
    
    /**
     * @notice Resolve market (only owner/oracle)
     */
    function resolveMarket(bool _targetReached) external onlyOwner {
        require(block.timestamp >= deadline, "Market not expired");
        require(!isResolved, "Already resolved");
        
        isResolved = true;
        targetReached = _targetReached;
        
        emit MarketResolved(_targetReached);
    }
    
    /**
     * @notice Redeem winning positions
     */
    function redeem() external {
        require(isResolved, "Market not resolved");
        
        uint256 payout = 0;
        
        if (targetReached && yesPositions[msg.sender] > 0) {
            // YES won - calculate payout from total pool
            payout = (yesPositions[msg.sender] * (yesPool + noPool)) / getTotalYesTokens();
            yesPositions[msg.sender] = 0;
        } else if (!targetReached && noPositions[msg.sender] > 0) {
            // NO won - calculate payout from total pool
            payout = (noPositions[msg.sender] * (yesPool + noPool)) / getTotalNoTokens();
            noPositions[msg.sender] = 0;
        }
        
        require(payout > 0, "No payout available");
        
        payable(msg.sender).transfer(payout);
        emit Redeemed(msg.sender, payout);
    }
    
    /**
     * @notice Get total YES tokens issued (placeholder)
     */
    function getTotalYesTokens() public view returns (uint256) {
        return yesPool; // Simplified for now
    }
    
    /**
     * @notice Get total NO tokens issued (placeholder)  
     */
    function getTotalNoTokens() public view returns (uint256) {
        return noPool; // Simplified for now
    }
    
    /**
     * @notice Get market info
     */
    function getMarketInfo() external view returns (
        string memory,
        string memory, 
        uint256,
        uint256,
        uint256,
        uint256,
        bool,
        bool
    ) {
        return (
            title,
            predictionQuestion,
            targetValue,
            deadline, 
            yesPool,
            noPool,
            isResolved,
            targetReached
        );
    }
    
    /**
     * @notice Emergency receive function
     */
    receive() external payable {
        // Allow contract to receive TTRUST
    }
}