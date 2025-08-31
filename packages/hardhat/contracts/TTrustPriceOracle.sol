//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AggregatorV3Interface } from "./interfaces/AggregatorV3Interface.sol";

/**
 * @title TTrustPriceOracle
 * @notice Oracle contract to get TTrust price data from multiple sources
 * @dev Can integrate with DEX prices, external oracles, or manual price feeds
 */
contract TTrustPriceOracle is Ownable {
    
    /////////////////
    /// Errors //////
    /////////////////
    
    error TTrustPriceOracle__PriceStale();
    error TTrustPriceOracle__InvalidPrice();
    error TTrustPriceOracle__OnlyTrustedUpdater();
    error TTrustPriceOracle__InvalidDEXAddress();
    
    //////////////////////////
    /// State Variables //////
    //////////////////////////
    
    struct PriceData {
        uint256 price;          // Price in USD (18 decimals)
        uint256 timestamp;      // Last update timestamp
        uint256 marketCap;      // Market cap in USD (18 decimals)
        bool isValid;           // Is this price valid
    }
    
    PriceData public currentPrice;
    
    uint256 public constant PRICE_STALENESS_THRESHOLD = 1 hours;
    uint256 public constant PRECISION = 1e18;
    
    // Trusted price updaters (can be set to external oracles or bots)
    mapping(address => bool) public trustedUpdaters;
    
    // DEX contract address for getting prices from liquidity pools
    address public dexRouter;
    address public ttustIntuitPair;
    
    // Backup price feeds (Chainlink style)
    AggregatorV3Interface public backupPriceFeed;
    
    /////////////////////////
    /// Events //////
    /////////////////////////
    
    event PriceUpdated(uint256 indexed price, uint256 indexed marketCap, uint256 timestamp, address updater);
    event TrustedUpdaterSet(address indexed updater, bool trusted);
    event DEXRouterSet(address indexed router, address indexed pair);
    event BackupPriceFeedSet(address indexed priceFeed);
    
    /////////////////
    /// Modifiers ///
    /////////////////
    
    modifier onlyTrustedUpdater() {
        if (!trustedUpdaters[msg.sender] && msg.sender != owner()) {
            revert TTrustPriceOracle__OnlyTrustedUpdater();
        }
        _;
    }
    
    //////////////////
    ////Constructor///
    //////////////////
    
    constructor(
        address _owner,
        uint256 _initialPrice,
        uint256 _initialMarketCap
    ) Ownable(_owner) {
        // Set initial price data
        currentPrice = PriceData({
            price: _initialPrice,
            timestamp: block.timestamp,
            marketCap: _initialMarketCap,
            isValid: true
        });
        
        // Owner is automatically a trusted updater
        trustedUpdaters[_owner] = true;
        
        emit PriceUpdated(_initialPrice, _initialMarketCap, block.timestamp, msg.sender);
    }
    
    /////////////////
    /// Functions ///
    /////////////////
    
    /**
     * @notice Update TTrust price manually (for trusted updaters)
     * @param _price New price in USD (18 decimals)
     * @param _marketCap New market cap in USD (18 decimals)
     */
    function updatePrice(uint256 _price, uint256 _marketCap) 
        external 
        onlyTrustedUpdater 
    {
        if (_price == 0) {
            revert TTrustPriceOracle__InvalidPrice();
        }
        
        currentPrice = PriceData({
            price: _price,
            timestamp: block.timestamp,
            marketCap: _marketCap,
            isValid: true
        });
        
        emit PriceUpdated(_price, _marketCap, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Get current TTrust price
     * @return price Current price in USD (18 decimals)
     * @return timestamp Last update timestamp
     */
    function getPrice() external view returns (uint256 price, uint256 timestamp) {
        if (!isPriceValid()) {
            revert TTrustPriceOracle__PriceStale();
        }
        
        return (currentPrice.price, currentPrice.timestamp);
    }
    
    /**
     * @notice Get current TTrust market cap
     * @return marketCap Current market cap in USD (18 decimals)
     * @return timestamp Last update timestamp
     */
    function getMarketCap() external view returns (uint256 marketCap, uint256 timestamp) {
        if (!isPriceValid()) {
            revert TTrustPriceOracle__PriceStale();
        }
        
        return (currentPrice.marketCap, currentPrice.timestamp);
    }
    
    /**
     * @notice Check if current price is valid (not stale)
     * @return bool True if price is valid
     */
    function isPriceValid() public view returns (bool) {
        return currentPrice.isValid && 
               (block.timestamp - currentPrice.timestamp) <= PRICE_STALENESS_THRESHOLD;
    }
    
    /**
     * @notice Get price from DEX (if configured)
     * @return price Price from DEX
     */
    function getPriceFromDEX() external view returns (uint256 price) {
        // This would integrate with the existing DEX to get TTrust price
        // Implementation depends on the DEX structure
        if (dexRouter == address(0)) {
            return 0;
        }
        
        // TODO: Implement actual DEX price fetching
        // For now, return current price as fallback
        return currentPrice.price;
    }
    
    /////////////////////////
    /// Admin Functions ////
    /////////////////////////
    
    /**
     * @notice Set trusted updater status
     * @param _updater Address to set trust status for
     * @param _trusted Whether this address is trusted
     */
    function setTrustedUpdater(address _updater, bool _trusted) external onlyOwner {
        trustedUpdaters[_updater] = _trusted;
        emit TrustedUpdaterSet(_updater, _trusted);
    }
    
    /**
     * @notice Set DEX router and pair addresses for price fetching
     * @param _router DEX router address
     * @param _pair TTrust/INTUIT pair address
     */
    function setDEXAddresses(address _router, address _pair) external onlyOwner {
        if (_router == address(0) || _pair == address(0)) {
            revert TTrustPriceOracle__InvalidDEXAddress();
        }
        
        dexRouter = _router;
        ttustIntuitPair = _pair;
        
        emit DEXRouterSet(_router, _pair);
    }
    
    /**
     * @notice Set backup price feed (Chainlink style)
     * @param _priceFeed Chainlink price feed address
     */
    function setBackupPriceFeed(address _priceFeed) external onlyOwner {
        backupPriceFeed = AggregatorV3Interface(_priceFeed);
        emit BackupPriceFeedSet(_priceFeed);
    }
    
    /**
     * @notice Emergency function to invalidate current price
     */
    function invalidatePrice() external onlyOwner {
        currentPrice.isValid = false;
    }
    
    /////////////////////////
    /// Getter Functions ///
    /////////////////////////
    
    /**
     * @notice Get all price data
     */
    function getAllPriceData() 
        external 
        view 
        returns (
            uint256 price,
            uint256 timestamp,
            uint256 marketCap,
            bool isValid,
            bool isStale
        ) 
    {
        price = currentPrice.price;
        timestamp = currentPrice.timestamp;
        marketCap = currentPrice.marketCap;
        isValid = currentPrice.isValid;
        isStale = !isPriceValid();
    }
}