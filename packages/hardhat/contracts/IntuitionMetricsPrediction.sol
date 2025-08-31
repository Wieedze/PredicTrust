//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarket } from "./PredictionMarket.sol";
import { IntuitionMetricsOracle } from "./IntuitionMetricsOracle.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IntuitionMetricsPrediction
 * @notice Prediction market for Intuition blockchain metrics (atoms, triplets, signals)
 * @dev Allows predictions on reaching certain thresholds for network metrics
 */
contract IntuitionMetricsPrediction is Ownable {
    
    /////////////////
    /// Errors //////
    /////////////////
    
    error IntuitionMetricsPrediction__MarketNotResolved();
    error IntuitionMetricsPrediction__MarketAlreadyResolved();
    error IntuitionMetricsPrediction__DeadlinePassed();
    error IntuitionMetricsPrediction__DeadlineNotReached();
    error IntuitionMetricsPrediction__InvalidTargetValue();
    error IntuitionMetricsPrediction__OracleDataStale();
    error IntuitionMetricsPrediction__InvalidMetricType();
    
    //////////////////////////
    /// State Variables //////
    //////////////////////////
    
    enum MetricType {
        ATOMS_COUNT,        // Total atoms created
        TRIPLETS_COUNT,     // Total triplets created
        SIGNALS_COUNT,      // Total signals created
        ATOMS_GROWTH,       // Daily atoms growth
        TRIPLETS_GROWTH,    // Daily triplets growth
        SIGNALS_GROWTH      // Daily signals growth
    }
    
    enum ComparisonType {
        ABOVE_THRESHOLD,    // Metric will be above threshold
        BELOW_THRESHOLD,    // Metric will be below threshold
        EXACT_VALUE         // Metric will equal exact value (with tolerance)
    }
    
    struct MetricPrediction {
        MetricType metricType;
        ComparisonType comparisonType;
        uint256 targetValue;        // Target count/growth value
        uint256 tolerance;          // For EXACT_VALUE predictions (±tolerance)
        uint256 deadline;           // When prediction expires
        string description;         // Human readable description
        bool isResolved;           // Has this prediction been resolved
        bool targetReached;        // Did target get reached
        uint256 actualValue;       // Actual value at resolution time
        uint256 resolutionTime;    // When it was resolved
        uint256 baselineValue;     // Starting value (for growth calculations)
        uint256 baselineTime;      // When baseline was recorded
    }
    
    // Core prediction market contract (handles token trading)
    PredictionMarket public immutable predictionMarket;
    
    // Oracle for Intuition metrics data
    IntuitionMetricsOracle public immutable metricsOracle;
    
    // Prediction details
    MetricPrediction public prediction;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant RESOLUTION_BUFFER = 2 hours; // Grace period after deadline
    uint256 public constant MAX_TOLERANCE_PERCENTAGE = 10; // 10% max tolerance for exact values
    
    /////////////////////////
    /// Events //////
    /////////////////////////
    
    event MetricPredictionCreated(
        MetricType indexed metricType,
        ComparisonType indexed comparisonType,
        uint256 indexed targetValue,
        uint256 deadline,
        string description
    );
    
    event PredictionResolved(
        bool indexed targetReached,
        uint256 actualValue,
        uint256 targetValue,
        uint256 resolutionTime
    );
    
    event BaselineUpdated(
        uint256 baselineValue,
        uint256 baselineTime
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
            revert IntuitionMetricsPrediction__DeadlinePassed();
        }
        _;
    }
    
    modifier afterDeadline() {
        if (block.timestamp < prediction.deadline + RESOLUTION_BUFFER) {
            revert IntuitionMetricsPrediction__DeadlineNotReached();
        }
        _;
    }
    
    modifier notResolved() {
        if (prediction.isResolved) {
            revert IntuitionMetricsPrediction__MarketAlreadyResolved();
        }
        _;
    }
    
    modifier resolved() {
        if (!prediction.isResolved) {
            revert IntuitionMetricsPrediction__MarketNotResolved();
        }
        _;
    }
    
    //////////////////
    ////Constructor///
    //////////////////
    
    constructor(
        address _liquidityProvider,
        address _metricsOracle,
        MetricType _metricType,
        ComparisonType _comparisonType,
        uint256 _targetValue,
        uint256 _tolerance,
        uint256 _deadline,
        string memory _description,
        uint256 _initialTokenValue,
        uint8 _initialYesProbability,
        uint8 _percentageToLock
    ) payable Ownable(_liquidityProvider) {
        
        if (_targetValue == 0) {
            revert IntuitionMetricsPrediction__InvalidTargetValue();
        }
        
        if (_deadline <= block.timestamp) {
            revert IntuitionMetricsPrediction__DeadlinePassed();
        }
        
        // Validate tolerance for exact value predictions
        if (_comparisonType == ComparisonType.EXACT_VALUE) {
            require(_tolerance <= (_targetValue * MAX_TOLERANCE_PERCENTAGE) / 100, "Tolerance too high");
        }
        
        // Set oracle
        metricsOracle = IntuitionMetricsOracle(_metricsOracle);
        
        // Get current baseline value
        (uint256 currentValue, uint256 currentTime) = _getCurrentMetricValue(_metricType);
        
        // Store prediction details
        prediction = MetricPrediction({
            metricType: _metricType,
            comparisonType: _comparisonType,
            targetValue: _targetValue,
            tolerance: _tolerance,
            deadline: _deadline,
            description: _description,
            isResolved: false,
            targetReached: false,
            actualValue: 0,
            resolutionTime: 0,
            baselineValue: currentValue,
            baselineTime: currentTime
        });
        
        // Create underlying prediction market
        string memory question = _buildQuestionString(
            _metricType, 
            _comparisonType, 
            _targetValue, 
            _deadline, 
            _description
        );
        
        predictionMarket = new PredictionMarket{value: msg.value}(
            _liquidityProvider,
            address(this), // This contract acts as oracle
            question,
            _initialTokenValue,
            _initialYesProbability,
            _percentageToLock
        );
        
        emit MetricPredictionCreated(_metricType, _comparisonType, _targetValue, _deadline, _description);
        emit BaselineUpdated(currentValue, currentTime);
    }
    
    /////////////////
    /// Functions ///
    /////////////////
    
    /**
     * @notice Buy prediction tokens (YES = target will be reached, NO = target won't be reached)
     */
    function buyTokens(PredictionMarket.Outcome _outcome, uint256 _amountTokenToBuy) 
        external 
        payable
        beforeDeadline
        notResolved
    {
        predictionMarket.buyTokensWithETH{value: msg.value}(_outcome, _amountTokenToBuy);
    }
    
    /**
     * @notice Sell prediction tokens back to the market
     */
    function sellTokens(PredictionMarket.Outcome _outcome, uint256 _tradingAmount)
        external
        beforeDeadline
        notResolved
    {
        predictionMarket.sellTokensForEth(_outcome, _tradingAmount);
    }
    
    /**
     * @notice Resolve the prediction by checking current Intuition metrics
     */
    function resolvePrediction() external afterDeadline notResolved {
        
        // Get current metric value
        (uint256 currentValue, uint256 timestamp) = _getCurrentMetricValue(prediction.metricType);
        
        // Check if oracle data is fresh enough
        if (block.timestamp - timestamp > 4 hours) {
            revert IntuitionMetricsPrediction__OracleDataStale();
        }
        
        // For growth metrics, calculate growth since baseline
        uint256 actualValue = currentValue;
        if (_isGrowthMetric(prediction.metricType)) {
            actualValue = currentValue > prediction.baselineValue ? 
                currentValue - prediction.baselineValue : 0;
        }
        
        // Determine if target was reached
        bool targetReached = _evaluateTarget(actualValue);
        
        // Update prediction state
        prediction.isResolved = true;
        prediction.targetReached = targetReached;
        prediction.actualValue = actualValue;
        prediction.resolutionTime = block.timestamp;
        
        // Report to underlying prediction market
        PredictionMarket.Outcome winningOutcome = targetReached ? 
            PredictionMarket.Outcome.YES : 
            PredictionMarket.Outcome.NO;
            
        predictionMarket.report(winningOutcome);
        
        emit PredictionResolved(targetReached, actualValue, prediction.targetValue, block.timestamp);
    }
    
    /**
     * @notice Update baseline for growth metrics (owner only, before deadline)
     */
    function updateBaseline() external onlyOwner beforeDeadline notResolved {
        if (!_isGrowthMetric(prediction.metricType)) {
            return; // Only applies to growth metrics
        }
        
        (uint256 currentValue, uint256 currentTime) = _getCurrentMetricValue(prediction.metricType);
        
        prediction.baselineValue = currentValue;
        prediction.baselineTime = currentTime;
        
        emit BaselineUpdated(currentValue, currentTime);
    }
    
    /**
     * @notice Emergency resolution by owner
     */
    function emergencyResolve(bool _targetReached, string memory _reason) 
        external 
        onlyOwner 
        notResolved 
    {
        prediction.isResolved = true;
        prediction.targetReached = _targetReached;
        prediction.resolutionTime = block.timestamp;
        
        PredictionMarket.Outcome winningOutcome = _targetReached ? 
            PredictionMarket.Outcome.YES : 
            PredictionMarket.Outcome.NO;
            
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
     * @dev Get current metric value from oracle
     */
    function _getCurrentMetricValue(MetricType _metricType) 
        internal 
        view 
        returns (uint256 value, uint256 timestamp) 
    {
        if (_metricType == MetricType.ATOMS_COUNT || _metricType == MetricType.ATOMS_GROWTH) {
            return metricsOracle.getMetricCount(IntuitionMetricsOracle.MetricType.ATOMS);
        } else if (_metricType == MetricType.TRIPLETS_COUNT || _metricType == MetricType.TRIPLETS_GROWTH) {
            return metricsOracle.getMetricCount(IntuitionMetricsOracle.MetricType.TRIPLETS);
        } else if (_metricType == MetricType.SIGNALS_COUNT || _metricType == MetricType.SIGNALS_GROWTH) {
            return metricsOracle.getMetricCount(IntuitionMetricsOracle.MetricType.SIGNALS);
        } else {
            revert IntuitionMetricsPrediction__InvalidMetricType();
        }
    }
    
    /**
     * @dev Check if metric type is growth-based
     */
    function _isGrowthMetric(MetricType _metricType) internal pure returns (bool) {
        return _metricType == MetricType.ATOMS_GROWTH ||
               _metricType == MetricType.TRIPLETS_GROWTH ||
               _metricType == MetricType.SIGNALS_GROWTH;
    }
    
    /**
     * @dev Evaluate if target was reached
     */
    function _evaluateTarget(uint256 actualValue) internal view returns (bool) {
        if (prediction.comparisonType == ComparisonType.ABOVE_THRESHOLD) {
            return actualValue >= prediction.targetValue;
        } else if (prediction.comparisonType == ComparisonType.BELOW_THRESHOLD) {
            return actualValue <= prediction.targetValue;
        } else { // EXACT_VALUE
            uint256 diff = actualValue > prediction.targetValue ? 
                actualValue - prediction.targetValue : 
                prediction.targetValue - actualValue;
            return diff <= prediction.tolerance;
        }
    }
    
    /**
     * @dev Build human-readable question string
     */
    function _buildQuestionString(
        MetricType _metricType,
        ComparisonType _comparisonType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _description
    ) internal pure returns (string memory) {
        
        string memory metricName;
        if (_metricType == MetricType.ATOMS_COUNT) metricName = "atoms count";
        else if (_metricType == MetricType.TRIPLETS_COUNT) metricName = "triplets count";
        else if (_metricType == MetricType.SIGNALS_COUNT) metricName = "signals count";
        else if (_metricType == MetricType.ATOMS_GROWTH) metricName = "atoms growth";
        else if (_metricType == MetricType.TRIPLETS_GROWTH) metricName = "triplets growth";
        else if (_metricType == MetricType.SIGNALS_GROWTH) metricName = "signals growth";
        
        string memory comparisonText;
        if (_comparisonType == ComparisonType.ABOVE_THRESHOLD) comparisonText = "exceed";
        else if (_comparisonType == ComparisonType.BELOW_THRESHOLD) comparisonText = "stay below";
        else comparisonText = "equal approximately";
        
        return string(abi.encodePacked(
            "Will Intuition ", metricName, " ", comparisonText, " the target by deadline? ", _description
        ));
    }
    
    /////////////////////////
    /// View Functions //////
    /////////////////////////
    
    /**
     * @notice Get current Intuition metrics for display
     */
    function getCurrentMetrics() 
        external 
        view 
        returns (
            uint256 currentAtoms,
            uint256 currentTriplets,
            uint256 currentSignals,
            uint256 lastUpdate
        ) 
    {
        return metricsOracle.getAllMetrics();
    }
    
    /**
     * @notice Get current prediction target vs actual
     */
    function getPredictionProgress()
        external
        view
        returns (
            uint256 targetValue,
            uint256 currentValue,
            uint256 progressPercentage,
            bool targetReached,
            uint256 timeRemaining
        )
    {
        targetValue = prediction.targetValue;
        
        try this.getCurrentPredictionValue() returns (uint256 current) {
            currentValue = current;
            
            if (prediction.comparisonType == ComparisonType.ABOVE_THRESHOLD) {
                progressPercentage = targetValue > 0 ? (currentValue * 100) / targetValue : 0;
                targetReached = currentValue >= targetValue;
            } else if (prediction.comparisonType == ComparisonType.BELOW_THRESHOLD) {
                progressPercentage = currentValue <= targetValue ? 100 : 0;
                targetReached = currentValue <= targetValue;
            } else { // EXACT_VALUE
                uint256 diff = currentValue > targetValue ? currentValue - targetValue : targetValue - currentValue;
                progressPercentage = diff <= prediction.tolerance ? 100 : 0;
                targetReached = diff <= prediction.tolerance;
            }
        } catch {
            currentValue = 0;
            progressPercentage = 0;
            targetReached = false;
        }
        
        timeRemaining = block.timestamp < prediction.deadline ? 
            prediction.deadline - block.timestamp : 0;
    }
    
    /**
     * @notice Get current value for this prediction (handles growth calculations)
     */
    function getCurrentPredictionValue() external view returns (uint256) {
        (uint256 currentValue,) = _getCurrentMetricValue(prediction.metricType);
        
        if (_isGrowthMetric(prediction.metricType)) {
            return currentValue > prediction.baselineValue ? 
                currentValue - prediction.baselineValue : 0;
        }
        
        return currentValue;
    }
    
    /**
     * @notice Get complete prediction information
     */
    function getPredictionInfo()
        external
        view
        returns (
            MetricType metricType,
            ComparisonType comparisonType,
            uint256 targetValue,
            uint256 tolerance,
            uint256 deadline,
            string memory description,
            bool isResolved,
            bool targetReached,
            uint256 actualValue,
            uint256 resolutionTime,
            address predictionMarketAddress
        )
    {
        return (
            prediction.metricType,
            prediction.comparisonType,
            prediction.targetValue,
            prediction.tolerance,
            prediction.deadline,
            prediction.description,
            prediction.isResolved,
            prediction.targetReached,
            prediction.actualValue,
            prediction.resolutionTime,
            address(predictionMarket)
        );
    }
    
    /**
     * @notice Check if prediction can be resolved
     */
    function canResolve() external view returns (bool) {
        return !prediction.isResolved && 
               block.timestamp >= prediction.deadline + RESOLUTION_BUFFER &&
               metricsOracle.isMetricValid(_mapToOracleMetricType(prediction.metricType));
    }
    
    /**
     * @dev Map internal metric type to oracle metric type
     */
    function _mapToOracleMetricType(MetricType _metricType) 
        internal 
        pure 
        returns (IntuitionMetricsOracle.MetricType) 
    {
        if (_metricType == MetricType.ATOMS_COUNT || _metricType == MetricType.ATOMS_GROWTH) {
            return IntuitionMetricsOracle.MetricType.ATOMS;
        } else if (_metricType == MetricType.TRIPLETS_COUNT || _metricType == MetricType.TRIPLETS_GROWTH) {
            return IntuitionMetricsOracle.MetricType.TRIPLETS;
        } else {
            return IntuitionMetricsOracle.MetricType.SIGNALS;
        }
    }
}