"use client";

import React, { useState } from "react";
import { BarChart3, Clock, DollarSign, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useAccount } from "wagmi";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";

const TTrustPredictionsPage = () => {
  const { address } = useAccount();
  const [selectedTab, setSelectedTab] = useState<"ttrust" | "metrics">("ttrust");

  // Mock data for demonstration - in real app this would come from contracts
  const ttustMarkets = [
    {
      id: 1,
      title: "TTrust will reach $1M market cap by March 2025",
      description: "Prediction on whether TTrust token will achieve $1 million market cap within 3 months",
      currentPrice: "$0.52",
      targetValue: "$1,000,000",
      currentMarketCap: "$520,000",
      deadline: "March 15, 2025",
      timeLeft: "89 days",
      yesPrice: "0.003 TTRUST",
      noPrice: "0.004 TTRUST",
      yesPercentage: 43,
      noPercentage: 57,
      totalLiquidity: "2.5 TTRUST",
      participants: 28,
      isActive: true,
      predictionType: "MARKET_CAP_ABOVE",
    },
    {
      id: 2,
      title: "TTrust price will exceed $2.00 by June 2025",
      description: "Will TTrust token price surpass $2.00 before June 2025?",
      currentPrice: "$0.52",
      targetValue: "$2.00",
      deadline: "June 30, 2025",
      timeLeft: "180 days",
      yesPrice: "0.002 TTRUST",
      noPrice: "0.005 TTRUST",
      yesPercentage: 29,
      noPercentage: 71,
      totalLiquidity: "1.8 TTRUST",
      participants: 15,
      isActive: true,
      predictionType: "PRICE_ABOVE",
    },
  ];

  const metricsMarkets = [
    {
      id: 1,
      title: "Intuition will have 50K+ atoms by April 2025",
      description: "Will the Intuition blockchain reach 50,000 atoms created before April?",
      currentCount: "12,847",
      targetValue: "50,000",
      metricType: "ATOMS",
      deadline: "April 1, 2025",
      timeLeft: "120 days",
      yesPrice: "0.0025 TTRUST",
      noPrice: "0.0035 TTRUST",
      yesPercentage: 42,
      noPercentage: 58,
      totalLiquidity: "1.2 TTRUST",
      participants: 19,
      isActive: true,
      dailyGrowth: "+156",
    },
    {
      id: 2,
      title: "Triplets count will exceed 25K this month",
      description: "Will Intuition create more than 25,000 triplets before end of January?",
      currentCount: "8,934",
      targetValue: "25,000",
      metricType: "TRIPLETS",
      deadline: "January 31, 2025",
      timeLeft: "12 days",
      yesPrice: "0.001 TTRUST",
      noPrice: "0.006 TTRUST",
      yesPercentage: 14,
      noPercentage: 86,
      totalLiquidity: "0.9 TTRUST",
      participants: 11,
      isActive: true,
      dailyGrowth: "+67",
    },
  ];

  const MarketCard = ({ market, type }: { market: any; type: "ttrust" | "metrics" }) => (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white hover:border-blue-500/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-2">{market.title}</CardTitle>
            <p className="text-sm text-gray-300 mb-3">{market.description}</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{market.timeLeft}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {type === "ttrust" ? (
            <>
              <div>
                <span className="text-gray-400">Current Price:</span>
                <span className="text-green-400 font-semibold ml-2">{market.currentPrice}</span>
              </div>
              <div>
                <span className="text-gray-400">Target:</span>
                <span className="text-blue-400 font-semibold ml-2">{market.targetValue}</span>
              </div>
              <div>
                <span className="text-gray-400">Market Cap:</span>
                <span className="text-purple-400 font-semibold ml-2">{market.currentMarketCap}</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-400">Current:</span>
                <span className="text-green-400 font-semibold ml-2">{market.currentCount}</span>
              </div>
              <div>
                <span className="text-gray-400">Target:</span>
                <span className="text-blue-400 font-semibold ml-2">{market.targetValue}</span>
              </div>
              <div>
                <span className="text-gray-400">Daily Growth:</span>
                <span className="text-emerald-400 font-semibold ml-2">{market.dailyGrowth}</span>
              </div>
            </>
          )}
          <div>
            <span className="text-gray-400">Deadline:</span>
            <span className="text-orange-400 font-semibold ml-2">{market.deadline}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Prediction Outcome Bars */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-400">YES ({market.yesPercentage}%)</span>
            <span className="text-sm text-gray-300">{market.yesPrice}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${market.yesPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-400">NO ({market.noPercentage}%)</span>
            <span className="text-sm text-gray-300">{market.noPrice}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${market.noPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => console.log("Buy YES clicked")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Buy YES
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => console.log("Buy NO clicked")}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Buy NO
          </Button>
        </div>

        {/* Market Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
          <span>💧 {market.totalLiquidity} liquidity</span>
          <span>👥 {market.participants} participants</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Particle Background */}
      <ParticleBackground />

      <div className="relative z-10 min-h-screen bg-black/30">
        <div className="flex items-center flex-col grow pt-24">
          <div className="px-5 w-full max-w-7xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  TTrust & Metrics Markets
                </span>
              </h1>
              <p className="text-xl text-gray-300">Advanced Prediction Markets for Intuition Ecosystem</p>
              <p className="text-gray-400 max-w-2xl mx-auto mt-2">
                Predict TTrust token performance and Intuition blockchain metrics. Trade on future outcomes with
                real-time data and decentralized resolution.
              </p>
              {address && (
                <div className="flex justify-center items-center mt-4">
                  <span className="mr-2 text-gray-300">Connected:</span>
                  <Address address={address} />
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-lg border-white/20 p-1 rounded-2xl">
                <button
                  onClick={() => setSelectedTab("ttrust")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedTab === "ttrust"
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <DollarSign className="h-4 w-4 mr-2 inline" />
                  TTrust Markets
                </button>
                <button
                  onClick={() => setSelectedTab("metrics")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedTab === "metrics"
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2 inline" />
                  Metrics Markets
                </button>
              </div>
            </div>

            {/* Market Grid */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {selectedTab === "ttrust" ? (
                <>
                  {ttustMarkets.map(market => (
                    <MarketCard key={market.id} market={market} type="ttrust" />
                  ))}
                </>
              ) : (
                <>
                  {metricsMarkets.map(market => (
                    <MarketCard key={market.id} market={market} type="metrics" />
                  ))}
                </>
              )}
            </div>

            {/* Create New Market Section */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Target className="h-6 w-6 mr-3 text-indigo-400" />
                  Create Your Own Prediction Market
                </CardTitle>
                <p className="text-gray-300">
                  Launch custom prediction markets for TTrust performance or Intuition metrics. Set your own targets,
                  deadlines, and initial liquidity.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-6 h-auto">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-semibold">TTrust Prediction</div>
                      <div className="text-sm opacity-90">Price, Market Cap, Volume</div>
                    </div>
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-6 h-auto">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-semibold">Metrics Prediction</div>
                      <div className="text-sm opacity-90">Atoms, Triplets, Signals</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <div className="mt-16 text-center">
              <h2 className="text-3xl font-bold text-white mb-8">How PredicTrust Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Choose Prediction</h3>
                    <p className="text-gray-300">
                      Select from TTrust price/market cap predictions or Intuition blockchain metrics forecasts.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Buy Position</h3>
                    <p className="text-gray-300">
                      Purchase YES or NO tokens based on your prediction. Prices change dynamically with market
                      sentiment.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Earn Rewards</h3>
                    <p className="text-gray-300">
                      When the prediction resolves, winning token holders receive ETH rewards proportional to their
                      stake.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TTrustPredictionsPage;
