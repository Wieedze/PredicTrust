//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleMarket
 * @notice Simple prediction market contract
 */
contract SimpleMarket is Ownable {
    
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
        string description;
        address creator;
        bool isResolved;
        bool targetReached;
        uint256 liquidityAmount;
    }
    
    MarketDetails public marketDetails;
    IERC20 public ttrustToken;
    
    constructor(
        address _creator,
        address _ttrustToken,
        PredictionType _predictionType,
        uint256 _targetValue,
        uint256 _deadline,
        string memory _description,
        uint256 _liquidityAmount
    ) Ownable(_creator) {
        marketDetails = MarketDetails({
            predictionType: _predictionType,
            targetValue: _targetValue,
            deadline: _deadline,
            description: _description,
            creator: _creator,
            isResolved: false,
            targetReached: false,
            liquidityAmount: _liquidityAmount
        });
        
        ttrustToken = IERC20(_ttrustToken);
    }
    
    function getMarketInfo() external view returns (MarketDetails memory) {
        return marketDetails;
    }
}