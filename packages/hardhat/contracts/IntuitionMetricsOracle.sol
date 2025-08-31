//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IntuitionMetricsOracle
 * @notice Oracle contract to track Intuition blockchain metrics
 * @dev Tracks atoms, triplets, and signals creation on Intuition network
 */
contract IntuitionMetricsOracle is Ownable {
    
    /////////////////
    /// Errors //////
    /////////////////
    
    error IntuitionMetricsOracle__DataStale();
    error IntuitionMetricsOracle__OnlyTrustedUpdater();
    error IntuitionMetricsOracle__InvalidMetric();
    
    //////////////////////////
    /// State Variables //////
    //////////////////////////
    
    enum MetricType {
        ATOMS,
        TRIPLETS, 
        SIGNALS
    }
    
    struct MetricData {
        uint256 count;          // Current count of this metric
        uint256 timestamp;      // Last update timestamp
        uint256 dailyGrowth;    // Growth in the last 24h
        uint256 weeklyGrowth;   // Growth in the last 7 days
        bool isValid;           // Is this data valid
    }
    
    // Mapping from MetricType to current data
    mapping(MetricType => MetricData) public metrics;
    
    // Historical snapshots for trend analysis
    struct Snapshot {
        uint256 atomsCount;
        uint256 tripletsCount;
        uint256 signalsCount;
        uint256 timestamp;
    }
    
    Snapshot[] public snapshots;
    
    uint256 public constant DATA_STALENESS_THRESHOLD = 4 hours;
    
    // Trusted data updaters (off-chain services that call explorer API)
    mapping(address => bool) public trustedUpdaters;
    
    /////////////////////////
    /// Events //////
    /////////////////////////
    
    event MetricUpdated(
        MetricType indexed metricType, 
        uint256 indexed count, 
        uint256 dailyGrowth,
        uint256 weeklyGrowth,
        uint256 timestamp,
        address updater
    );
    
    event SnapshotTaken(
        uint256 indexed snapshotId,
        uint256 atomsCount,
        uint256 tripletsCount, 
        uint256 signalsCount,
        uint256 timestamp
    );
    
    event TrustedUpdaterSet(address indexed updater, bool trusted);
    
    /////////////////
    /// Modifiers ///
    /////////////////
    
    modifier onlyTrustedUpdater() {
        if (!trustedUpdaters[msg.sender] && msg.sender != owner()) {
            revert IntuitionMetricsOracle__OnlyTrustedUpdater();
        }
        _;
    }
    
    //////////////////
    ////Constructor///
    //////////////////
    
    constructor(
        address _owner,
        uint256 _initialAtoms,
        uint256 _initialTriplets,
        uint256 _initialSignals
    ) Ownable(_owner) {
        
        // Initialize metrics with current values
        metrics[MetricType.ATOMS] = MetricData({
            count: _initialAtoms,
            timestamp: block.timestamp,
            dailyGrowth: 0,
            weeklyGrowth: 0,
            isValid: true
        });
        
        metrics[MetricType.TRIPLETS] = MetricData({
            count: _initialTriplets,
            timestamp: block.timestamp,
            dailyGrowth: 0,
            weeklyGrowth: 0,
            isValid: true
        });
        
        metrics[MetricType.SIGNALS] = MetricData({
            count: _initialSignals,
            timestamp: block.timestamp,
            dailyGrowth: 0,
            weeklyGrowth: 0,
            isValid: true
        });
        
        // Owner is automatically a trusted updater
        trustedUpdaters[_owner] = true;
        
        // Take initial snapshot
        _takeSnapshot();
    }
    
    /////////////////
    /// Functions ///
    /////////////////
    
    /**
     * @notice Update multiple metrics at once
     * @param _atomsCount Current atoms count
     * @param _tripletsCount Current triplets count  
     * @param _signalsCount Current signals count
     */
    function updateAllMetrics(
        uint256 _atomsCount,
        uint256 _tripletsCount,
        uint256 _signalsCount
    ) external onlyTrustedUpdater {
        
        // Calculate growth for each metric
        uint256 atomsDailyGrowth = _calculateGrowth(MetricType.ATOMS, _atomsCount, 1 days);
        uint256 atomsWeeklyGrowth = _calculateGrowth(MetricType.ATOMS, _atomsCount, 7 days);
        
        uint256 tripletsDailyGrowth = _calculateGrowth(MetricType.TRIPLETS, _tripletsCount, 1 days);
        uint256 tripletsWeeklyGrowth = _calculateGrowth(MetricType.TRIPLETS, _tripletsCount, 7 days);
        
        uint256 signalsDailyGrowth = _calculateGrowth(MetricType.SIGNALS, _signalsCount, 1 days);
        uint256 signalsWeeklyGrowth = _calculateGrowth(MetricType.SIGNALS, _signalsCount, 7 days);
        
        // Update atoms
        metrics[MetricType.ATOMS] = MetricData({
            count: _atomsCount,
            timestamp: block.timestamp,
            dailyGrowth: atomsDailyGrowth,
            weeklyGrowth: atomsWeeklyGrowth,
            isValid: true
        });
        
        // Update triplets
        metrics[MetricType.TRIPLETS] = MetricData({
            count: _tripletsCount,
            timestamp: block.timestamp,
            dailyGrowth: tripletsDailyGrowth,
            weeklyGrowth: tripletsWeeklyGrowth,
            isValid: true
        });
        
        // Update signals
        metrics[MetricType.SIGNALS] = MetricData({
            count: _signalsCount,
            timestamp: block.timestamp,
            dailyGrowth: signalsDailyGrowth,
            weeklyGrowth: signalsWeeklyGrowth,
            isValid: true
        });
        
        emit MetricUpdated(MetricType.ATOMS, _atomsCount, atomsDailyGrowth, atomsWeeklyGrowth, block.timestamp, msg.sender);
        emit MetricUpdated(MetricType.TRIPLETS, _tripletsCount, tripletsDailyGrowth, tripletsWeeklyGrowth, block.timestamp, msg.sender);
        emit MetricUpdated(MetricType.SIGNALS, _signalsCount, signalsDailyGrowth, signalsWeeklyGrowth, block.timestamp, msg.sender);
        
        // Take snapshot every update
        _takeSnapshot();
    }
    
    /**
     * @notice Update a single metric
     * @param _metricType Type of metric to update
     * @param _count New count value
     */
    function updateMetric(MetricType _metricType, uint256 _count) 
        external 
        onlyTrustedUpdater 
    {
        uint256 dailyGrowth = _calculateGrowth(_metricType, _count, 1 days);
        uint256 weeklyGrowth = _calculateGrowth(_metricType, _count, 7 days);
        
        metrics[_metricType] = MetricData({
            count: _count,
            timestamp: block.timestamp,
            dailyGrowth: dailyGrowth,
            weeklyGrowth: weeklyGrowth,
            isValid: true
        });
        
        emit MetricUpdated(_metricType, _count, dailyGrowth, weeklyGrowth, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Get current count for a specific metric
     * @param _metricType Type of metric to query
     * @return count Current count
     * @return timestamp Last update timestamp
     */
    function getMetricCount(MetricType _metricType) 
        external 
        view 
        returns (uint256 count, uint256 timestamp) 
    {
        if (!isMetricValid(_metricType)) {
            revert IntuitionMetricsOracle__DataStale();
        }
        
        MetricData memory data = metrics[_metricType];
        return (data.count, data.timestamp);
    }
    
    /**
     * @notice Get full metric data including growth
     * @param _metricType Type of metric to query
     */
    function getFullMetricData(MetricType _metricType)
        external
        view
        returns (
            uint256 count,
            uint256 timestamp,
            uint256 dailyGrowth,
            uint256 weeklyGrowth,
            bool isValid
        )
    {
        MetricData memory data = metrics[_metricType];
        return (
            data.count,
            data.timestamp,
            data.dailyGrowth,
            data.weeklyGrowth,
            isMetricValid(_metricType)
        );
    }
    
    /**
     * @notice Get all current metrics at once
     */
    function getAllMetrics()
        external
        view
        returns (
            uint256 atomsCount,
            uint256 tripletsCount,
            uint256 signalsCount,
            uint256 lastUpdate
        )
    {
        atomsCount = metrics[MetricType.ATOMS].count;
        tripletsCount = metrics[MetricType.TRIPLETS].count;
        signalsCount = metrics[MetricType.SIGNALS].count;
        
        // Return the most recent update time
        uint256 atomsTime = metrics[MetricType.ATOMS].timestamp;
        uint256 tripletsTime = metrics[MetricType.TRIPLETS].timestamp;
        uint256 signalsTime = metrics[MetricType.SIGNALS].timestamp;
        
        lastUpdate = atomsTime;
        if (tripletsTime > lastUpdate) lastUpdate = tripletsTime;
        if (signalsTime > lastUpdate) lastUpdate = signalsTime;
    }
    
    /**
     * @notice Check if metric data is valid (not stale)
     * @param _metricType Type of metric to check
     * @return bool True if data is valid
     */
    function isMetricValid(MetricType _metricType) public view returns (bool) {
        MetricData memory data = metrics[_metricType];
        return data.isValid && 
               (block.timestamp - data.timestamp) <= DATA_STALENESS_THRESHOLD;
    }
    
    /**
     * @notice Get growth data for trend predictions
     * @param _metricType Type of metric
     * @return dailyGrowth Growth in last 24h
     * @return weeklyGrowth Growth in last 7 days
     */
    function getGrowthData(MetricType _metricType) 
        external 
        view 
        returns (uint256 dailyGrowth, uint256 weeklyGrowth) 
    {
        MetricData memory data = metrics[_metricType];
        return (data.dailyGrowth, data.weeklyGrowth);
    }
    
    /////////////////////////
    /// Internal Functions //
    /////////////////////////
    
    /**
     * @dev Calculate growth compared to historical data
     */
    function _calculateGrowth(
        MetricType _metricType, 
        uint256 _newCount, 
        uint256 _timeWindow
    ) internal view returns (uint256 growth) {
        
        uint256 cutoffTime = block.timestamp - _timeWindow;
        uint256 oldCount = metrics[_metricType].count;
        
        // Look for snapshot closest to cutoff time
        for (uint i = snapshots.length; i > 0; i--) {
            Snapshot memory snap = snapshots[i-1];
            if (snap.timestamp <= cutoffTime) {
                if (_metricType == MetricType.ATOMS) {
                    oldCount = snap.atomsCount;
                } else if (_metricType == MetricType.TRIPLETS) {
                    oldCount = snap.tripletsCount;
                } else if (_metricType == MetricType.SIGNALS) {
                    oldCount = snap.signalsCount;
                }
                break;
            }
        }
        
        return _newCount > oldCount ? _newCount - oldCount : 0;
    }
    
    /**
     * @dev Take a snapshot of current metrics
     */
    function _takeSnapshot() internal {
        snapshots.push(Snapshot({
            atomsCount: metrics[MetricType.ATOMS].count,
            tripletsCount: metrics[MetricType.TRIPLETS].count,
            signalsCount: metrics[MetricType.SIGNALS].count,
            timestamp: block.timestamp
        }));
        
        emit SnapshotTaken(
            snapshots.length - 1,
            metrics[MetricType.ATOMS].count,
            metrics[MetricType.TRIPLETS].count,
            metrics[MetricType.SIGNALS].count,
            block.timestamp
        );
        
        // Keep only last 100 snapshots to avoid excessive gas costs
        if (snapshots.length > 100) {
            for (uint i = 0; i < snapshots.length - 100; i++) {
                snapshots[i] = snapshots[i + 1];
            }
            snapshots.pop();
        }
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
     * @notice Emergency function to invalidate metric data
     * @param _metricType Metric to invalidate
     */
    function invalidateMetric(MetricType _metricType) external onlyOwner {
        metrics[_metricType].isValid = false;
    }
    
    /////////////////////////
    /// Getter Functions ///
    /////////////////////////
    
    /**
     * @notice Get number of stored snapshots
     */
    function getSnapshotCount() external view returns (uint256) {
        return snapshots.length;
    }
    
    /**
     * @notice Get specific snapshot
     * @param _index Snapshot index
     */
    function getSnapshot(uint256 _index) 
        external 
        view 
        returns (
            uint256 atomsCount,
            uint256 tripletsCount,
            uint256 signalsCount,
            uint256 timestamp
        ) 
    {
        require(_index < snapshots.length, "Snapshot index out of bounds");
        Snapshot memory snap = snapshots[_index];
        return (snap.atomsCount, snap.tripletsCount, snap.signalsCount, snap.timestamp);
    }
}