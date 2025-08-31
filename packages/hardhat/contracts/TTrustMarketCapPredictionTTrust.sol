//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketTTrust } from "./PredictionMarketTTrust.sol";
import { TTrustPriceOracle } from "./TTrustPriceOracle.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TTrustMarketCapPredictionTTrust
 * @notice Prediction market for TTrust token predictions using TTrust as currency
 * @dev Extends functionality with TTrust-specific logic and uses TTrust token for all transactions
 */
contract TTrustMarketCapPredictionTTrust is Ownable {
    
    /////////////////
    /// Errors //////
    /////////////////
    
    error TTrustMarketCapPredictionTTrust__MarketNotResolved();
    error TTrustMarketCapPredictionTTrust__MarketAlreadyResolved();
    error TTrustMarketCapPredictionTTrust__DeadlinePassed();
    error TTrustMarketCapPredictionTTrust__DeadlineNotReached();
    error TTrustMarketCapPredictionTTrust__InvalidTargetValue();
    error TTrustMarketCapPredictionTTrust__OracleDataStale();
    error TTrustMarketCapPredictionTTrust__InvalidPredictionType();

    //////////////////////////
    /// State Variables //////
    //////////////////////////

    enum PredictionType {
        MARKET_CAP_ABOVE,     // Market cap will be above target
        MARKET_CAP_BELOW,     // Market cap will be below target
        PRICE_ABOVE,          // Price will be above target
        PRICE_BELOW           // Price will be below target
    }

    struct PredictionDetails {
        PredictionType predictionType;
        uint256 targetValue;        // Target market cap or price (18 decimals)
        uint256 deadline;           // When prediction expires
        string description;         // Human readable description
        bool isResolved;           // Has this prediction been resolved
        bool targetReached;        // Did target get reached
        uint256 resolutionValue;   // Actual value at resolution time
        uint256 resolutionTime;    // When it was resolved
    }

    // Core prediction market contract (handles token trading with TTrust)
    PredictionMarketTTrust public immutable predictionMarket;

    // Oracle for TTrust price/market cap data
    TTrustPriceOracle public immutable priceOracle;

    // TTrust token contract
    IERC20 public immutable ttrustToken;

    // Prediction details
    PredictionDetails public prediction;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant RESOLUTION_BUFFER = 1 hours; // Grace period after deadline

    /////////////////////////
    /// Events //////
    /////////////////////////

    event PredictionCreated(
        PredictionType indexed predictionType,
        uint256 indexed targetValue,
        uint256 indexed deadline,
        string description
    );

    event PredictionResolved(
        bool indexed targetReached,
        uint256 actualValue,
        uint256 targetValue,
        uint256 resolutionTime
    );

    event EmergencyResolution(
        bool targetReached,
        string reason
    );

    /////////////////
    /// Modifiers ///
    /////////////////

    modifier beforeDeadline() {
        if (block.timestamp >= prediction.deadline) {
            revert TTrustMarketCapPredictionTTrust__DeadlinePassed();
        }
        _;
    }

    modifier afterDeadline() {
        if (block.timestamp < prediction.deadline + RESOLUTION_BUFFER) {
            revert TTrustMarketCapPredictionTTrust__DeadlineNotReached();
        }
        _;
    }

    modifier notResolved() {
        if (prediction.isResolved) {
            revert TTrustMarketCapPredictionTTrust__MarketAlreadyResolved();
        }
        _;
    }

    modifier resolved() {
        if (!prediction.isResolved) {
            revert TTrustMarketCapPredictionTTrust__MarketNotResolved();
        }
        _;
    }

    //////////////////
    ////Constructor///
    //////////////////

    constructor(
        address _liquidityProvider,
        address _priceOracle,
        address _ttrustToken,
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _description,
        uint256 _initialTokenValue,
        uint8 _initialYesProbability,
        uint8 _percentageToLock,
        uint256 _initialTTrustLiquidity
    ) Ownable(_liquidityProvider) {
        
        if (_targetValue == 0) {
            revert TTrustMarketCapPredictionTTrust__InvalidTargetValue();
        }

        if (_deadline <= block.timestamp) {
            revert TTrustMarketCapPredictionTTrust__DeadlinePassed();
        }

        // Set oracle and TTrust token
        priceOracle = TTrustPriceOracle(_priceOracle);
        ttrustToken = IERC20(_ttrustToken);

        // Store prediction details
        prediction = PredictionDetails({
            predictionType: _predictionType,
            targetValue: _targetValue,
            deadline: _deadline,
            description: _description,
            isResolved: false,
            targetReached: false,
            resolutionValue: 0,
            resolutionTime: 0
        });

        // Create underlying prediction market with TTrust
        string memory question = _buildQuestionString(_predictionType, _targetValue, _deadline, _description);

        predictionMarket = new PredictionMarketTTrust(
            _liquidityProvider,
            address(this), // This contract acts as oracle
            _ttrustToken,
            question,
            _initialTokenValue,
            _initialYesProbability,
            _percentageToLock,
            _initialTTrustLiquidity
        );

        emit PredictionCreated(_predictionType, _targetValue, _deadline, _description);
    }

    /////////////////
    /// Functions ///
    /////////////////

    /**
     * @notice Buy prediction tokens with TTrust (YES = target will be reached, NO = target won't be reached)
     */
    function buyTokens(PredictionMarketTTrust.Outcome _outcome, uint256 _amountTokenToBuy) 
        external 
        beforeDeadline
        notResolved
    {
        predictionMarket.buyTokensWithTTrust(_outcome, _amountTokenToBuy);
    }

    /**
     * @notice Sell prediction tokens for TTrust
     */
    function sellTokens(PredictionMarketTTrust.Outcome _outcome, uint256 _tradingAmount)
        external
        beforeDeadline
        notResolved
    {
        predictionMarket.sellTokensForTTrust(_outcome, _tradingAmount);
    }

    /**
     * @notice Resolve the prediction by checking current TTrust data
     */
    function resolvePrediction() external afterDeadline notResolved {
        
        // Get current data from oracle
        (uint256 currentValue, uint256 timestamp) = _getCurrentValue();

        // Check if oracle data is fresh enough
        if (block.timestamp - timestamp > 2 hours) {
            revert TTrustMarketCapPredictionTTrust__OracleDataStale();
        }

        // Determine if target was reached
        bool targetReached = _evaluateTarget(currentValue);

        // Update prediction state
        prediction.isResolved = true;
        prediction.targetReached = targetReached;
        prediction.resolutionValue = currentValue;
        prediction.resolutionTime = block.timestamp;

        // Report to underlying prediction market
        PredictionMarketTTrust.Outcome winningOutcome = targetReached ? 
            PredictionMarketTTrust.Outcome.YES : 
            PredictionMarketTTrust.Outcome.NO;
            
        predictionMarket.report(winningOutcome);

        emit PredictionResolved(targetReached, currentValue, prediction.targetValue, block.timestamp);
    }

    /**
     * @notice Emergency resolution by owner (in case of oracle issues)
     */
    function emergencyResolve(bool _targetReached, string memory _reason) 
        external 
        onlyOwner 
        notResolved 
    {
        prediction.isResolved = true;
        prediction.targetReached = _targetReached;
        prediction.resolutionTime = block.timestamp;

        PredictionMarketTTrust.Outcome winningOutcome = _targetReached ? 
            PredictionMarketTTrust.Outcome.YES : 
            PredictionMarketTTrust.Outcome.NO;
            
        predictionMarket.report(winningOutcome);

        emit EmergencyResolution(_targetReached, _reason);
    }

    /**
     * @notice Redeem winning tokens after resolution
     */
    function redeemWinningTokens(uint256 _amount) external resolved {
        predictionMarket.redeemWinningTokens(_amount);
    }

    /**
     * @notice Owner can withdraw profits after resolution
     */
    function withdrawProfits() external onlyOwner resolved {
        predictionMarket.resolveMarketAndWithdraw();
    }

    /////////////////////////
    /// Internal Functions //
    /////////////////////////

    /**
     * @dev Get current value based on prediction type
     */
    function _getCurrentValue() internal view returns (uint256 value, uint256 timestamp) {
        if (prediction.predictionType == PredictionType.MARKET_CAP_ABOVE || 
            prediction.predictionType == PredictionType.MARKET_CAP_BELOW) {
            return priceOracle.getMarketCap();
        } else {
            return priceOracle.getPrice();
        }
    }

    /**
     * @dev Evaluate if target was reached based on prediction type
     */
    function _evaluateTarget(uint256 currentValue) internal view returns (bool) {
        if (prediction.predictionType == PredictionType.MARKET_CAP_ABOVE || 
            prediction.predictionType == PredictionType.PRICE_ABOVE) {
            return currentValue >= prediction.targetValue;
        } else {
            return currentValue <= prediction.targetValue;
        }
    }

    /**
     * @dev Build human-readable question string
     */
    function _buildQuestionString(
        PredictionType _type,
        uint256 _target,
        uint256 _deadline,
        string memory _description
    ) internal pure returns (string memory) {
        // This is a simplified version - in production you'd format the numbers properly
        if (_type == PredictionType.MARKET_CAP_ABOVE) {
            return string(abi.encodePacked("Will TTrust market cap exceed target by deadline? ", _description));
        } else if (_type == PredictionType.MARKET_CAP_BELOW) {
            return string(abi.encodePacked("Will TTrust market cap stay below target by deadline? ", _description));
        } else if (_type == PredictionType.PRICE_ABOVE) {
            return string(abi.encodePacked("Will TTrust price exceed target by deadline? ", _description));
        } else {
            return string(abi.encodePacked("Will TTrust price stay below target by deadline? ", _description));
        }
    }

    /////////////////////////
    /// View Functions //////
    /////////////////////////

    /**
     * @notice Get current TTrust metrics for display
     */
    function getCurrentTTrustData() 
        external 
        view 
        returns (
            uint256 currentPrice,
            uint256 currentMarketCap,
            uint256 lastUpdate,
            bool isStale
        ) 
    {
        try priceOracle.getPrice() returns (uint256 price, uint256 timestamp) {
            currentPrice = price;
            lastUpdate = timestamp;
            
            try priceOracle.getMarketCap() returns (uint256 marketCap, uint256 mcTimestamp) {
                currentMarketCap = marketCap;
                if (mcTimestamp > lastUpdate) lastUpdate = mcTimestamp;
            } catch {
                currentMarketCap = 0;
            }
            
            isStale = (block.timestamp - lastUpdate) > 2 hours;
        } catch {
            currentPrice = 0;
            currentMarketCap = 0;
            lastUpdate = 0;
            isStale = true;
        }
    }

    /**
     * @notice Get complete prediction information
     */
    function getPredictionInfo()
        external
        view
        returns (
            PredictionType predictionType,
            uint256 targetValue,
            uint256 deadline,
            string memory description,
            bool isResolved,
            bool targetReached,
            uint256 resolutionValue,
            uint256 resolutionTime,
            address predictionMarketAddress
        )
    {
        return (
            prediction.predictionType,
            prediction.targetValue,
            prediction.deadline,
            prediction.description,
            prediction.isResolved,
            prediction.targetReached,
            prediction.resolutionValue,
            prediction.resolutionTime,
            address(predictionMarket)
        );
    }

    /**
     * @notice Get trading information from underlying market
     */
    function getTradingInfo()
        external
        view
        returns (
            uint256 yesTokenPrice,
            uint256 noTokenPrice,
            uint256 yesTokenReserve,
            uint256 noTokenReserve,
            address yesToken,
            address noToken
        )
    {
        yesTokenPrice = predictionMarket.getBuyPriceInTTrust(PredictionMarketTTrust.Outcome.YES, 1 ether);
        noTokenPrice = predictionMarket.getBuyPriceInTTrust(PredictionMarketTTrust.Outcome.NO, 1 ether);
        
        (,,,,,yesTokenReserve, noTokenReserve,, yesToken, noToken,,,,,, ) = predictionMarket.getPrediction();
    }

    /**
     * @notice Check if prediction can be resolved
     */
    function canResolve() external view returns (bool) {
        return !prediction.isResolved && 
               block.timestamp >= prediction.deadline + RESOLUTION_BUFFER &&
               priceOracle.isPriceValid();
    }

    /**
     * @notice Get time left until deadline
     */
    function getTimeToDeadline() external view returns (uint256) {
        if (block.timestamp >= prediction.deadline) {
            return 0;
        }
        return prediction.deadline - block.timestamp;
    }
}