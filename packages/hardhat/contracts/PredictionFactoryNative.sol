//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { SimpleNativeMarket } from "./SimpleNativeMarket.sol";
import { TTrustPriceOracle } from "./TTrustPriceOracle.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionFactoryNative
 * @notice Factory contract for creating TTrust-based prediction markets using native TTRUST token
 */
contract PredictionFactoryNative is Ownable {
    
    enum PredictionType {
        MARKET_CAP_ABOVE,
        MARKET_CAP_BELOW,
        PRICE_ABOVE,
        PRICE_BELOW
    }
    
    // Oracle
    TTrustPriceOracle public ttustPriceOracle;
    
    // Market registry
    address[] public allMarkets;
    uint256 public marketCount;
    
    // Settings (in native TTRUST wei)
    uint256 public minimumLiquidity = 1e17; // 0.1 TTRUST minimum
    uint256 public creationFee = 1e15; // 0.001 TTRUST creation fee
    
    event TTrustMarketCreated(
        address indexed marketAddress,
        address indexed creator,
        PredictionType indexed predictionType,
        uint256 targetValue,
        uint256 deadline,
        string title,
        string question
    );
    
    modifier validLiquidity(uint256 _liquidity) {
        require(_liquidity >= minimumLiquidity, "Insufficient liquidity");
        _;
    }
    
    modifier validDeadline(uint256 _deadline) {
        require(_deadline > block.timestamp, "Invalid deadline");
        _;
    }
    
    constructor(
        address _owner,
        address _ttustPriceOracle
    ) Ownable(_owner) {
        if (_ttustPriceOracle != address(0)) {
            ttustPriceOracle = TTrustPriceOracle(_ttustPriceOracle);
        }
    }
    
    /**
     * @notice Create a new TTrust prediction market using native TTRUST
     */
    function createTTrustMarket(
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _title,
        string memory _predictionQuestion
    )
        external
        payable
        validLiquidity(msg.value)
        validDeadline(_deadline)
        returns (address marketAddress)
    {
        require(address(ttustPriceOracle) != address(0), "Oracle not set");
        require(_targetValue > 0, "Invalid target value");
        require(msg.value >= minimumLiquidity + creationFee, "Insufficient TTRUST sent");
        
        // Calculate actual liquidity (subtract creation fee)
        uint256 actualLiquidity = msg.value - creationFee;
        
        // Create the market with native TTRUST
        SimpleNativeMarket.PredictionType marketPredictionType = SimpleNativeMarket.PredictionType(uint8(_predictionType));
        
        SimpleNativeMarket market = new SimpleNativeMarket{value: actualLiquidity}(
            msg.sender,
            marketPredictionType,
            _targetValue,
            _deadline,
            _title,
            _predictionQuestion
        );
        
        marketAddress = address(market);
        
        // Register market
        allMarkets.push(marketAddress);
        marketCount++;
        
        emit TTrustMarketCreated(
            marketAddress,
            msg.sender,
            _predictionType,
            _targetValue,
            _deadline,
            _title,
            _predictionQuestion
        );
    }
    
    /**
     * @notice Get market count
     */
    function getMarketCount() external view returns (uint256) {
        return marketCount;
    }
    
    /**
     * @notice Get active markets (simple pagination)
     */
    function getActiveMarkets(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (address[] memory markets, uint256 total) 
    {
        total = marketCount;
        
        if (_offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        
        markets = new address[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            markets[i - _offset] = allMarkets[i];
        }
    }
    
    /**
     * @notice Set oracle address
     */
    function setTTrustPriceOracle(address _oracle) external onlyOwner {
        ttustPriceOracle = TTrustPriceOracle(_oracle);
    }
    
    /**
     * @notice Update fees
     */
    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
    }
    
    /**
     * @notice Withdraw collected fees (native TTRUST)
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @notice Emergency function to receive TTRUST
     */
    receive() external payable {}
}