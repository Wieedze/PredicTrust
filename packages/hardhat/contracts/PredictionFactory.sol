//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { TTrustMarketCapPrediction } from "./TTrustMarketCapPrediction.sol";
import { IntuitionMetricsPrediction } from "./IntuitionMetricsPrediction.sol";
import { TTrustPriceOracle } from "./TTrustPriceOracle.sol";
import { IntuitionMetricsOracle } from "./IntuitionMetricsOracle.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionFactory
 * @notice Factory contract for creating different types of prediction markets
 * @dev Manages creation and registry of TTrust and Intuition metrics prediction markets
 */
contract PredictionFactory is Ownable {
    
    /////////////////
    /// Errors //////
    /////////////////
    
    error PredictionFactory__OracleNotSet();
    error PredictionFactory__InvalidInitialValue();
    error PredictionFactory__InvalidProbability();
    error PredictionFactory__InvalidDeadline();
    error PredictionFactory__InsufficientLiquidity();
    error PredictionFactory__InvalidTargetValue();
    error PredictionFactory__MarketCreationFailed();
    
    //////////////////////////
    /// State Variables //////
    //////////////////////////
    
    enum MarketType {
        TTRUST_MARKET_CAP,
        TTRUST_PRICE,
        INTUITION_METRICS
    }
    
    struct MarketInfo {
        MarketType marketType;
        address marketAddress;
        address creator;
        uint256 creationTime;
        uint256 deadline;
        string description;
        bool isActive;
    }
    
    // Oracles
    TTrustPriceOracle public ttustPriceOracle;
    IntuitionMetricsOracle public intuitionMetricsOracle;
    
    // Market registry
    address[] public allMarkets;
    mapping(address => MarketInfo) public marketInfo;
    mapping(address => address[]) public creatorMarkets; // creator => market addresses
    mapping(MarketType => address[]) public marketsByType;
    
    // Default settings for market creation
    uint256 public defaultInitialTokenValue = 1e16; // 0.01 ETH per token
    uint8 public defaultInitialProbability = 50; // 50% initial probability
    uint8 public defaultPercentageLocked = 20; // 20% locked initially
    uint256 public minimumLiquidity = 1e17; // 0.1 ETH minimum
    uint256 public creationFee = 1e15; // 0.001 ETH creation fee
    
    // Factory settings
    bool public factoryPaused = false;
    
    /////////////////////////
    /// Events //////
    /////////////////////////
    
    event TTrustMarketCreated(
        address indexed marketAddress,
        address indexed creator,
        TTrustMarketCapPrediction.PredictionType indexed predictionType,
        uint256 targetValue,
        uint256 deadline,
        string description
    );
    
    event IntuitionMetricsMarketCreated(
        address indexed marketAddress,
        address indexed creator,
        IntuitionMetricsPrediction.MetricType indexed metricType,
        IntuitionMetricsPrediction.ComparisonType comparisonType,
        uint256 targetValue,
        uint256 deadline,
        string description
    );
    
    event OracleUpdated(
        string indexed oracleType,
        address indexed oldOracle,
        address indexed newOracle
    );
    
    event DefaultSettingsUpdated(
        uint256 initialTokenValue,
        uint8 initialProbability,
        uint8 percentageLocked
    );
    
    event FactoryPausedToggled(bool paused);
    event CreationFeeUpdated(uint256 newFee);
    event MinimumLiquidityUpdated(uint256 newMinimum);
    
    /////////////////
    /// Modifiers ///
    /////////////////
    
    modifier whenNotPaused() {
        require(!factoryPaused, "Factory is paused");
        _;
    }
    
    modifier validLiquidity() {
        if (msg.value < minimumLiquidity + creationFee) {
            revert PredictionFactory__InsufficientLiquidity();
        }
        _;
    }
    
    modifier validDeadline(uint256 _deadline) {
        if (_deadline <= block.timestamp + 1 hours) {
            revert PredictionFactory__InvalidDeadline();
        }
        _;
    }
    
    //////////////////
    ////Constructor///
    //////////////////
    
    constructor(
        address _owner,
        address _ttustPriceOracle,
        address _intuitionMetricsOracle
    ) Ownable(_owner) {
        if (_ttustPriceOracle != address(0)) {
            ttustPriceOracle = TTrustPriceOracle(_ttustPriceOracle);
        }
        if (_intuitionMetricsOracle != address(0)) {
            intuitionMetricsOracle = IntuitionMetricsOracle(_intuitionMetricsOracle);
        }
    }
    
    /////////////////
    /// Functions ///
    /////////////////
    
    /**
     * @notice Create a new TTrust market cap prediction market
     * @param _predictionType Type of TTrust prediction (market cap above/below, price above/below)
     * @param _targetValue Target market cap or price value (18 decimals)
     * @param _deadline When prediction expires
     * @param _description Human readable description
     * @param _customTokenValue Custom initial token value (0 to use default)
     * @param _customProbability Custom initial probability (0 to use default)
     * @return marketAddress Address of created market
     */
    function createTTrustMarket(
        TTrustMarketCapPrediction.PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _description,
        uint256 _customTokenValue,
        uint8 _customProbability
    ) 
        external 
        payable 
        whenNotPaused
        validLiquidity
        validDeadline(_deadline)
        returns (address marketAddress)
    {
        if (address(ttustPriceOracle) == address(0)) {
            revert PredictionFactory__OracleNotSet();
        }
        
        if (_targetValue == 0) {
            revert PredictionFactory__InvalidTargetValue();
        }
        
        // Use custom values or defaults
        uint256 tokenValue = _customTokenValue > 0 ? _customTokenValue : defaultInitialTokenValue;
        uint8 probability = _customProbability > 0 ? _customProbability : defaultInitialProbability;
        
        // Validate probability
        if (probability >= 100) {
            revert PredictionFactory__InvalidProbability();
        }
        
        // Calculate liquidity (total value minus creation fee)
        uint256 liquidityAmount = msg.value - creationFee;
        
        try new TTrustMarketCapPrediction{value: liquidityAmount}(
            msg.sender,
            address(ttustPriceOracle),
            _predictionType,
            _targetValue,
            _deadline,
            _description,
            tokenValue,
            probability,
            defaultPercentageLocked
        ) returns (TTrustMarketCapPrediction market) {
            marketAddress = address(market);
        } catch {
            revert PredictionFactory__MarketCreationFailed();
        }
        
        // Register market
        _registerMarket(
            marketAddress,
            MarketType.TTRUST_MARKET_CAP,
            msg.sender,
            _deadline,
            _description
        );
        
        emit TTrustMarketCreated(
            marketAddress,
            msg.sender,
            _predictionType,
            _targetValue,
            _deadline,
            _description
        );
    }
    
    /**
     * @notice Create a new Intuition metrics prediction market
     * @param _metricType Type of metric (atoms, triplets, signals, or growth)
     * @param _comparisonType How to compare (above, below, exact)
     * @param _targetValue Target metric value
     * @param _tolerance Tolerance for exact comparisons
     * @param _deadline When prediction expires
     * @param _description Human readable description
     * @return marketAddress Address of created market
     */
    function createIntuitionMetricsMarket(
        IntuitionMetricsPrediction.MetricType _metricType,
        IntuitionMetricsPrediction.ComparisonType _comparisonType,
        uint256 _targetValue,
        uint256 _tolerance,
        uint256 _deadline,
        string memory _description
    )
        external
        payable
        whenNotPaused
        validLiquidity
        validDeadline(_deadline)
        returns (address marketAddress)
    {
        if (address(intuitionMetricsOracle) == address(0)) {
            revert PredictionFactory__OracleNotSet();
        }
        
        if (_targetValue == 0) {
            revert PredictionFactory__InvalidTargetValue();
        }
        
        // Calculate liquidity
        uint256 liquidityAmount = msg.value - creationFee;
        
        try new IntuitionMetricsPrediction{value: liquidityAmount}(
            msg.sender,
            address(intuitionMetricsOracle),
            _metricType,
            _comparisonType,
            _targetValue,
            _tolerance,
            _deadline,
            _description,
            defaultInitialTokenValue,
            defaultInitialProbability,
            defaultPercentageLocked
        ) returns (IntuitionMetricsPrediction market) {
            marketAddress = address(market);
        } catch {
            revert PredictionFactory__MarketCreationFailed();
        }
        
        // Register market
        _registerMarket(
            marketAddress,
            MarketType.INTUITION_METRICS,
            msg.sender,
            _deadline,
            _description
        );
        
        emit IntuitionMetricsMarketCreated(
            marketAddress,
            msg.sender,
            _metricType,
            _comparisonType,
            _targetValue,
            _deadline,
            _description
        );
    }
    
    /////////////////////////
    /// Internal Functions //
    /////////////////////////
    
    /**
     * @dev Register a newly created market
     */
    function _registerMarket(
        address _marketAddress,
        MarketType _marketType,
        address _creator,
        uint256 _deadline,
        string memory _description
    ) internal {
        allMarkets.push(_marketAddress);
        
        marketInfo[_marketAddress] = MarketInfo({
            marketType: _marketType,
            marketAddress: _marketAddress,
            creator: _creator,
            creationTime: block.timestamp,
            deadline: _deadline,
            description: _description,
            isActive: true
        });
        
        creatorMarkets[_creator].push(_marketAddress);
        marketsByType[_marketType].push(_marketAddress);
    }
    
    /////////////////////////
    /// Admin Functions ////
    /////////////////////////
    
    /**
     * @notice Set TTrust price oracle address
     */
    function setTTrustPriceOracle(address _oracle) external onlyOwner {
        address oldOracle = address(ttustPriceOracle);
        ttustPriceOracle = TTrustPriceOracle(_oracle);
        emit OracleUpdated("TTrust", oldOracle, _oracle);
    }
    
    /**
     * @notice Set Intuition metrics oracle address
     */
    function setIntuitionMetricsOracle(address _oracle) external onlyOwner {
        address oldOracle = address(intuitionMetricsOracle);
        intuitionMetricsOracle = IntuitionMetricsOracle(_oracle);
        emit OracleUpdated("Intuition", oldOracle, _oracle);
    }
    
    /**
     * @notice Update default market creation settings
     */
    function setDefaultSettings(
        uint256 _initialTokenValue,
        uint8 _initialProbability,
        uint8 _percentageLocked
    ) external onlyOwner {
        if (_initialProbability >= 100 || _percentageLocked >= 100) {
            revert PredictionFactory__InvalidProbability();
        }
        
        defaultInitialTokenValue = _initialTokenValue;
        defaultInitialProbability = _initialProbability;
        defaultPercentageLocked = _percentageLocked;
        
        emit DefaultSettingsUpdated(_initialTokenValue, _initialProbability, _percentageLocked);
    }
    
    /**
     * @notice Set creation fee
     */
    function setCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
        emit CreationFeeUpdated(_fee);
    }
    
    /**
     * @notice Set minimum liquidity requirement
     */
    function setMinimumLiquidity(uint256 _minimum) external onlyOwner {
        minimumLiquidity = _minimum;
        emit MinimumLiquidityUpdated(_minimum);
    }
    
    /**
     * @notice Pause/unpause factory
     */
    function toggleFactoryPause() external onlyOwner {
        factoryPaused = !factoryPaused;
        emit FactoryPausedToggled(factoryPaused);
    }
    
    /**
     * @notice Withdraw accumulated creation fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success,) = owner().call{value: balance}("");
        require(success, "Fee withdrawal failed");
    }
    
    /**
     * @notice Mark a market as inactive (for cleanup)
     */
    function deactivateMarket(address _market) external onlyOwner {
        require(marketInfo[_market].marketAddress != address(0), "Market not found");
        marketInfo[_market].isActive = false;
    }
    
    /////////////////////////
    /// View Functions //////
    /////////////////////////
    
    /**
     * @notice Get total number of markets created
     */
    function getTotalMarketsCount() external view returns (uint256) {
        return allMarkets.length;
    }
    
    /**
     * @notice Get markets by type
     */
    function getMarketsByType(MarketType _marketType) external view returns (address[] memory) {
        return marketsByType[_marketType];
    }
    
    /**
     * @notice Get markets created by a specific address
     */
    function getCreatorMarkets(address _creator) external view returns (address[] memory) {
        return creatorMarkets[_creator];
    }
    
    /**
     * @notice Get active markets (paginated)
     */
    function getActiveMarkets(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (address[] memory markets, uint256 total) 
    {
        uint256 activeCount = 0;
        
        // Count active markets
        for (uint256 i = 0; i < allMarkets.length; i++) {
            if (marketInfo[allMarkets[i]].isActive) {
                activeCount++;
            }
        }
        
        total = activeCount;
        
        if (_offset >= activeCount) {
            return (new address[](0), total);
        }
        
        uint256 end = _offset + _limit;
        if (end > activeCount) {
            end = activeCount;
        }
        
        markets = new address[](end - _offset);
        uint256 activeIndex = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < allMarkets.length && resultIndex < markets.length; i++) {
            if (marketInfo[allMarkets[i]].isActive) {
                if (activeIndex >= _offset) {
                    markets[resultIndex] = allMarkets[i];
                    resultIndex++;
                }
                activeIndex++;
            }
        }
    }
    
    /**
     * @notice Get market details
     */
    function getMarketDetails(address _market) 
        external 
        view 
        returns (
            MarketType marketType,
            address creator,
            uint256 creationTime,
            uint256 deadline,
            string memory description,
            bool isActive,
            bool isExpired
        ) 
    {
        MarketInfo memory info = marketInfo[_market];
        return (
            info.marketType,
            info.creator,
            info.creationTime,
            info.deadline,
            info.description,
            info.isActive,
            block.timestamp > info.deadline
        );
    }
    
    /**
     * @notice Get factory statistics
     */
    function getFactoryStats()
        external
        view
        returns (
            uint256 totalMarkets,
            uint256 activeMarkets,
            uint256 ttustMarkets,
            uint256 metricsMarkets,
            uint256 totalFeesCollected
        )
    {
        totalMarkets = allMarkets.length;
        ttustMarkets = marketsByType[MarketType.TTRUST_MARKET_CAP].length;
        metricsMarkets = marketsByType[MarketType.INTUITION_METRICS].length;
        totalFeesCollected = address(this).balance;
        
        for (uint256 i = 0; i < allMarkets.length; i++) {
            if (marketInfo[allMarkets[i]].isActive) {
                activeMarkets++;
            }
        }
    }
}