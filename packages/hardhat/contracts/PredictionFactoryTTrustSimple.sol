//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarket } from "./PredictionMarket.sol";
import { TTrustPriceOracle } from "./TTrustPriceOracle.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionFactoryTTrustSimple
 * @notice Simplified factory contract for creating TTrust-based prediction markets
 */
contract PredictionFactoryTTrustSimple is Ownable {
    
    enum PredictionType {
        MARKET_CAP_ABOVE,
        MARKET_CAP_BELOW,
        PRICE_ABOVE,
        PRICE_BELOW
    }
    
    // TTrust token contract
    IERC20 public immutable ttrustToken;
    
    // Oracle
    TTrustPriceOracle public ttustPriceOracle;
    
    // Simple market registry
    address[] public allMarkets;
    uint256 public marketCount;
    
    // Settings
    uint256 public minimumLiquidity = 1e17; // 0.1 TTrust minimum
    uint256 public creationFee = 1e15; // 0.001 TTrust creation fee
    
    event TTrustMarketCreated(
        address indexed marketAddress,
        address indexed creator,
        PredictionType indexed predictionType,
        uint256 targetValue,
        uint256 deadline,
        string description
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
        address _ttrustToken,
        address _ttustPriceOracle
    ) Ownable(_owner) {
        ttrustToken = IERC20(_ttrustToken);
        
        if (_ttustPriceOracle != address(0)) {
            ttustPriceOracle = TTrustPriceOracle(_ttustPriceOracle);
        }
    }
    
    /**
     * @notice Create a new TTrust prediction market
     */
    function createTTrustMarket(
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _title,
        string memory _predictionQuestion,
        uint256 _liquidityAmount
    )
        external
        validLiquidity(_liquidityAmount)
        validDeadline(_deadline)
        returns (address marketAddress)
    {
        require(address(ttustPriceOracle) != address(0), "Oracle not set");
        require(_targetValue > 0, "Invalid target value");
        
        // Check TTrust allowance and transfer tokens
        require(ttrustToken.allowance(msg.sender, address(this)) >= _liquidityAmount, "Insufficient allowance");
        require(ttrustToken.transferFrom(msg.sender, address(this), _liquidityAmount), "Transfer failed");
        
        // Calculate liquidity
        uint256 actualLiquidity = _liquidityAmount - creationFee;
        
        // Create the market  
        PredictionMarket.PredictionType marketPredictionType = PredictionMarket.PredictionType(uint8(_predictionType));
        
        PredictionMarket market = new PredictionMarket(
            msg.sender,
            address(ttrustToken),
            marketPredictionType,
            _targetValue,
            _deadline,
            _title,
            _predictionQuestion,
            actualLiquidity
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
            _title
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
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}