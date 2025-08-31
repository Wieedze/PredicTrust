//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketToken } from "./PredictionMarketToken.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract PredictionMarketTTrust is Ownable {
    /////////////////
    /// Errors //////
    /////////////////

    error PredictionMarketTTrust__MustProvideTTrustForInitialLiquidity();
    error PredictionMarketTTrust__InvalidProbability();
    error PredictionMarketTTrust__PredictionAlreadyReported();
    error PredictionMarketTTrust__OnlyOracleCanReport();
    error PredictionMarketTTrust__OwnerCannotCall();
    error PredictionMarketTTrust__PredictionNotReported();
    error PredictionMarketTTrust__InsufficientWinningTokens();
    error PredictionMarketTTrust__AmountMustBeGreaterThanZero();
    error PredictionMarketTTrust__InsufficientTokenReserve(Outcome _outcome, uint256 _amountToken);
    error PredictionMarketTTrust__TokenTransferFailed();
    error PredictionMarketTTrust__TTrustTransferFailed();
    error PredictionMarketTTrust__InsufficientBalance(uint256 _tradingAmount, uint256 _userBalance);
    error PredictionMarketTTrust__InsufficientAllowance(uint256 _tradingAmount, uint256 _allowance);
    error PredictionMarketTTrust__InsufficientLiquidity();
    error PredictionMarketTTrust__InvalidPercentageToLock();
    error PredictionMarketTTrust__InsufficientTTrustAllowance();

    //////////////////////////
    /// State Variables //////
    //////////////////////////

    enum Outcome {
        YES,
        NO
    }

    uint256 private constant PRECISION = 1e18;

    /// TTrust token contract
    IERC20 public immutable i_ttrustToken;

    /// Checkpoint 2 ///
    address public immutable i_oracle;
    uint256 public immutable i_initialTokenValue;
    uint256 public immutable i_percentageLocked;
    uint256 public immutable i_initialYesProbability;

    string public s_question;
    uint256 public s_ttrustCollateral;
    uint256 public s_lpTradingRevenue;

    /// Checkpoint 3 ///
    PredictionMarketToken public immutable i_yesToken;
    PredictionMarketToken public immutable i_noToken;

    /// Checkpoint 5 ///
    PredictionMarketToken public s_winningToken;
    bool public s_isReported;

    /////////////////////////
    /// Events //////
    /////////////////////////

    event TokensPurchased(address indexed buyer, Outcome outcome, uint256 amount, uint256 ttrustAmount);
    event TokensSold(address indexed seller, Outcome outcome, uint256 amount, uint256 ttrustAmount);
    event WinningTokensRedeemed(address indexed redeemer, uint256 amount, uint256 ttrustAmount);
    event MarketReported(address indexed oracle, Outcome winningOutcome, address winningToken);
    event MarketResolved(address indexed resolver, uint256 totalTTrustToSend);
    event LiquidityAdded(address indexed provider, uint256 ttrustAmount, uint256 tokensAmount);
    event LiquidityRemoved(address indexed provider, uint256 ttrustAmount, uint256 tokensAmount);

    /////////////////
    /// Modifiers ///
    /////////////////

    /// Checkpoint 5 ///
    modifier predictionNotReported() {
        if (s_isReported) {
            revert PredictionMarketTTrust__PredictionAlreadyReported();
        }
        _;
    }

    /// Checkpoint 6 ///
    modifier predictionReported() {
        if (!s_isReported) {
            revert PredictionMarketTTrust__PredictionNotReported();
        }
        _;
    }

    /// Checkpoint 8 ///
    modifier notOwner() {
        if (msg.sender == owner()) {
            revert PredictionMarketTTrust__OwnerCannotCall();
        }
        _;
    }

    modifier amountGreaterThanZero(uint256 _amount) {
        if (_amount == 0) {
            revert PredictionMarketTTrust__AmountMustBeGreaterThanZero();
        }
        _;
    }

    //////////////////
    ////Constructor///
    //////////////////

    constructor(
        address _liquidityProvider,
        address _oracle,
        address _ttrustToken,
        string memory _question,
        uint256 _initialTokenValue,
        uint8 _initialYesProbability,
        uint8 _percentageToLock,
        uint256 _initialTTrustLiquidity
    ) Ownable(_liquidityProvider) {
        /// Checkpoint 2 ////
        if (_initialTTrustLiquidity == 0) {
            revert PredictionMarketTTrust__MustProvideTTrustForInitialLiquidity();
        }
        if (_initialYesProbability >= 100 || _initialYesProbability == 0) {
            revert PredictionMarketTTrust__InvalidProbability();
        }
        if (_percentageToLock >= 100 || _percentageToLock == 0) {
            revert PredictionMarketTTrust__InvalidPercentageToLock();
        }

        i_ttrustToken = IERC20(_ttrustToken);
        i_oracle = _oracle;
        s_question = _question;
        i_initialTokenValue = _initialTokenValue;
        i_initialYesProbability = _initialYesProbability;
        i_percentageLocked = _percentageToLock;

        // Transfer initial TTrust liquidity from deployer
        bool success = i_ttrustToken.transferFrom(_liquidityProvider, address(this), _initialTTrustLiquidity);
        if (!success) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        s_ttrustCollateral = _initialTTrustLiquidity;

        /// Checkpoint 3 ////
        uint256 initialTokenAmount = (_initialTTrustLiquidity * PRECISION) / _initialTokenValue;
        i_yesToken = new PredictionMarketToken("Yes", "Y", msg.sender, initialTokenAmount);
        i_noToken = new PredictionMarketToken("No", "N", msg.sender, initialTokenAmount);

        uint256 initialYesAmountLocked = (initialTokenAmount * _initialYesProbability * _percentageToLock * 2) / 10000;
        uint256 initialNoAmountLocked = (initialTokenAmount * (100 - _initialYesProbability) * _percentageToLock * 2) / 10000;

        bool success1 = i_yesToken.transfer(msg.sender, initialYesAmountLocked);
        bool success2 = i_noToken.transfer(msg.sender, initialNoAmountLocked);
        if (!success1 || !success2) {
            revert PredictionMarketTTrust__TokenTransferFailed();
        }
    }

    /////////////////
    /// Functions ///
    /////////////////

    /**
     * @notice Add liquidity to the prediction market with TTrust
     * @dev Only the owner can add liquidity and only if the prediction is not reported
     * @param _ttrustAmount Amount of TTrust to add as liquidity
     */
    function addLiquidity(uint256 _ttrustAmount) external onlyOwner predictionNotReported {
        //// Checkpoint 4 ////
        bool success = i_ttrustToken.transferFrom(msg.sender, address(this), _ttrustAmount);
        if (!success) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        s_ttrustCollateral += _ttrustAmount;

        uint256 tokensAmount = (_ttrustAmount * PRECISION) / i_initialTokenValue;

        i_yesToken.mint(address(this), tokensAmount);
        i_noToken.mint(address(this), tokensAmount);

        emit LiquidityAdded(msg.sender, _ttrustAmount, tokensAmount);
    }

    /**
     * @notice Remove liquidity from the prediction market
     * @param _ttrustToWithdraw Amount of TTrust to withdraw from liquidity pool
     */
    function removeLiquidity(uint256 _ttrustToWithdraw) external onlyOwner predictionNotReported {
        //// Checkpoint 4 ////
        uint256 amountTokenToBurn = (_ttrustToWithdraw / i_initialTokenValue) * PRECISION;

        if (amountTokenToBurn > (i_yesToken.balanceOf(address(this)))) {
            revert PredictionMarketTTrust__InsufficientTokenReserve(Outcome.YES, amountTokenToBurn);
        }
        if (amountTokenToBurn > (i_noToken.balanceOf(address(this)))) {
            revert PredictionMarketTTrust__InsufficientTokenReserve(Outcome.NO, amountTokenToBurn);
        }

        s_ttrustCollateral -= _ttrustToWithdraw;

        i_yesToken.burn(address(this), amountTokenToBurn);
        i_noToken.burn(address(this), amountTokenToBurn);

        bool success = i_ttrustToken.transfer(msg.sender, _ttrustToWithdraw);
        if (!success) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        emit LiquidityRemoved(msg.sender, _ttrustToWithdraw, amountTokenToBurn);
    }

    /**
     * @notice Report the winning outcome for the prediction
     */
    function report(Outcome _winningOutcome) external predictionNotReported {
        //// Checkpoint 5 ////
        if (msg.sender != i_oracle) {
            revert PredictionMarketTTrust__OnlyOracleCanReport();
        }
        s_winningToken = _winningOutcome == Outcome.YES ? i_yesToken : i_noToken;
        s_isReported = true;
        emit MarketReported(msg.sender, _winningOutcome, address(s_winningToken));
    }

    /**
     * @notice Owner can withdraw profits after resolution
     */
    function resolveMarketAndWithdraw() external onlyOwner predictionReported returns (uint256 ttrustRedeemed) {
        /// Checkpoint 6 ////
        uint256 contractWinningTokens = s_winningToken.balanceOf(address(this));
        if (contractWinningTokens > 0) {
            ttrustRedeemed = (contractWinningTokens * i_initialTokenValue) / PRECISION;

            if (ttrustRedeemed > s_ttrustCollateral) {
                ttrustRedeemed = s_ttrustCollateral;
            }

            s_ttrustCollateral -= ttrustRedeemed;
        }

        uint256 totalTTrustToSend = ttrustRedeemed + s_lpTradingRevenue;
        s_lpTradingRevenue = 0;

        s_winningToken.burn(address(this), contractWinningTokens);

        bool success = i_ttrustToken.transfer(msg.sender, totalTTrustToSend);
        if (!success) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        emit MarketResolved(msg.sender, totalTTrustToSend);
        return ttrustRedeemed;
    }

    /**
     * @notice Buy prediction tokens with TTrust
     */
    function buyTokensWithTTrust(Outcome _outcome, uint256 _amountTokenToBuy) 
        external 
        amountGreaterThanZero(_amountTokenToBuy)
        predictionNotReported
        notOwner
    {
        /// Checkpoint 8 ////
        uint256 ttrustNeeded = getBuyPriceInTTrust(_outcome, _amountTokenToBuy);
        
        // Check allowance and balance
        uint256 allowance = i_ttrustToken.allowance(msg.sender, address(this));
        if (allowance < ttrustNeeded) {
            revert PredictionMarketTTrust__InsufficientTTrustAllowance();
        }

        uint256 balance = i_ttrustToken.balanceOf(msg.sender);
        if (balance < ttrustNeeded) {
            revert PredictionMarketTTrust__InsufficientBalance(ttrustNeeded, balance);
        }

        PredictionMarketToken optionToken = _outcome == Outcome.YES ? i_yesToken : i_noToken;

        if (_amountTokenToBuy > optionToken.balanceOf(address(this))) {
            revert PredictionMarketTTrust__InsufficientTokenReserve(_outcome, _amountTokenToBuy);
        }

        // Transfer TTrust from user
        bool success1 = i_ttrustToken.transferFrom(msg.sender, address(this), ttrustNeeded);
        if (!success1) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        s_lpTradingRevenue += ttrustNeeded;

        bool success2 = optionToken.transfer(msg.sender, _amountTokenToBuy);
        if (!success2) {
            revert PredictionMarketTTrust__TokenTransferFailed();
        }

        emit TokensPurchased(msg.sender, _outcome, _amountTokenToBuy, ttrustNeeded);
    }

    /**
     * @notice Sell prediction tokens for TTrust
     */
    function sellTokensForTTrust(Outcome _outcome, uint256 _tradingAmount)
        external
        amountGreaterThanZero(_tradingAmount)
        predictionNotReported
        notOwner
    {
        /// Checkpoint 8 ////
        PredictionMarketToken optionToken = _outcome == Outcome.YES ? i_yesToken : i_noToken;
        uint256 userBalance = optionToken.balanceOf(msg.sender);
        if (userBalance < _tradingAmount) {
            revert PredictionMarketTTrust__InsufficientBalance(_tradingAmount, userBalance);
        }

        uint256 allowance = optionToken.allowance(msg.sender, address(this));
        if (allowance < _tradingAmount) {
            revert PredictionMarketTTrust__InsufficientAllowance(_tradingAmount, allowance);
        }

        uint256 ttrustToReceive = getSellPriceInTTrust(_outcome, _tradingAmount);

        s_lpTradingRevenue -= ttrustToReceive;

        bool success1 = i_ttrustToken.transfer(msg.sender, ttrustToReceive);
        if (!success1) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        bool success2 = optionToken.transferFrom(msg.sender, address(this), _tradingAmount);
        if (!success2) {
            revert PredictionMarketTTrust__TokenTransferFailed();
        }

        emit TokensSold(msg.sender, _outcome, _tradingAmount, ttrustToReceive);
    }

    /**
     * @notice Redeem winning tokens for TTrust
     */
    function redeemWinningTokens(uint256 _amount) external amountGreaterThanZero(_amount) predictionReported notOwner {
        /// Checkpoint 9 ////
        if (s_winningToken.balanceOf(msg.sender) < _amount) {
            revert PredictionMarketTTrust__InsufficientWinningTokens();
        }

        uint256 ttrustToReceive = (_amount * i_initialTokenValue) / PRECISION;
        s_ttrustCollateral -= ttrustToReceive;

        s_winningToken.burn(msg.sender, _amount);

        bool success = i_ttrustToken.transfer(msg.sender, ttrustToReceive);
        if (!success) {
            revert PredictionMarketTTrust__TTrustTransferFailed();
        }

        emit WinningTokensRedeemed(msg.sender, _amount, ttrustToReceive);
    }

    /**
     * @notice Calculate TTrust price for buying tokens
     */
    function getBuyPriceInTTrust(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        /// Checkpoint 7 ////
        return _calculatePriceInTTrust(_outcome, _tradingAmount, false);
    }

    /**
     * @notice Calculate TTrust price for selling tokens
     */
    function getSellPriceInTTrust(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        /// Checkpoint 7 ////
        return _calculatePriceInTTrust(_outcome, _tradingAmount, true);
    }

    /////////////////////////
    /// Helper Functions ///
    ////////////////////////

    /**
     * @dev Internal helper to calculate TTrust price for both buying and selling
     */
    function _calculatePriceInTTrust(
        Outcome _outcome,
        uint256 _tradingAmount,
        bool _isSelling
    ) private view returns (uint256) {
        /// Checkpoint 7 ////
        (uint256 currentTokenReserve, uint256 currentOtherTokenReserve) = _getCurrentReserves(_outcome);

        /// Ensure sufficient liquidity when buying
        if (!_isSelling) {
            if (currentTokenReserve < _tradingAmount) {
                revert PredictionMarketTTrust__InsufficientLiquidity();
            }
        }

        uint256 totalTokenSupply = i_yesToken.totalSupply();

        /// Before trade
        uint256 currentTokenSoldBefore = totalTokenSupply - currentTokenReserve;
        uint256 currentOtherTokenSold = totalTokenSupply - currentOtherTokenReserve;

        uint256 totalTokensSoldBefore = currentTokenSoldBefore + currentOtherTokenSold;
        uint256 probabilityBefore = _calculateProbability(currentTokenSoldBefore, totalTokensSoldBefore);

        /// After trade
        uint256 currentTokenReserveAfter =
            _isSelling ? currentTokenReserve + _tradingAmount : currentTokenReserve - _tradingAmount;
        uint256 currentTokenSoldAfter = totalTokenSupply - currentTokenReserveAfter;

        uint256 totalTokensSoldAfter =
            _isSelling ? totalTokensSoldBefore - _tradingAmount : totalTokensSoldBefore + _tradingAmount;

        uint256 probabilityAfter = _calculateProbability(currentTokenSoldAfter, totalTokensSoldAfter);

        /// Compute final price
        uint256 probabilityAvg = (probabilityBefore + probabilityAfter) / 2;
        return (i_initialTokenValue * probabilityAvg * _tradingAmount) / (PRECISION * PRECISION);
    }

    function _getCurrentReserves(Outcome _outcome) private view returns (uint256, uint256) {
        if (_outcome == Outcome.YES) {
            return (i_yesToken.balanceOf(address(this)), i_noToken.balanceOf(address(this)));
        } else {
            return (i_noToken.balanceOf(address(this)), i_yesToken.balanceOf(address(this)));
        }
    }

    function _calculateProbability(uint256 tokensSold, uint256 totalSold) private pure returns (uint256) {
        return (tokensSold * PRECISION) / totalSold;
    }

    /////////////////////////
    /// Getter Functions ///
    ////////////////////////

    /**
     * @notice Get the prediction details
     */
    function getPrediction()
        external
        view
        returns (
            string memory question,
            string memory outcome1,
            string memory outcome2,
            address oracle,
            uint256 initialTokenValue,
            uint256 yesTokenReserve,
            uint256 noTokenReserve,
            bool isReported,
            address yesToken,
            address noToken,
            address winningToken,
            uint256 ttrustCollateral,
            uint256 lpTradingRevenue,
            address predictionMarketOwner,
            uint256 initialProbability,
            uint256 percentageLocked,
            address ttrustToken
        )
    {
        oracle = i_oracle;
        initialTokenValue = i_initialTokenValue;
        percentageLocked = i_percentageLocked;
        initialProbability = i_initialYesProbability;
        question = s_question;
        ttrustCollateral = s_ttrustCollateral;
        lpTradingRevenue = s_lpTradingRevenue;
        predictionMarketOwner = owner();
        yesToken = address(i_yesToken);
        noToken = address(i_noToken);
        outcome1 = i_yesToken.name();
        outcome2 = i_noToken.name();
        yesTokenReserve = i_yesToken.balanceOf(address(this));
        noTokenReserve = i_noToken.balanceOf(address(this));
        isReported = s_isReported;
        winningToken = address(s_winningToken);
        ttrustToken = address(i_ttrustToken);
    }
}