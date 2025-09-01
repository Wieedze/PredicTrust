"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BarChart3, Clock, DollarSign, Filter, Plus, Search, Target } from "lucide-react";
import { useAccount } from "wagmi";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";

const TTrustPredictionsPage = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("markets");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"ttrust" | "metrics">("ttrust");

  const tabs = [
    { id: "markets", label: "📊 All Markets", icon: "📈" },
    { id: "create", label: "➕ Create Market", icon: "🎯" },
    { id: "portfolio", label: "💼 My Portfolio", icon: "👤" },
  ];

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
        {/* Prediction Outcome Sections */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-green-400 font-semibold">YES</div>
            <div className="text-sm text-gray-300">{market.yesPrice}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-red-400 font-semibold">NO</div>
            <div className="text-sm text-gray-300">{market.noPrice}</div>
          </div>
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

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-lg border-white/20 p-1 rounded-2xl">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-screen">
              {activeTab === "markets" && (
                <div className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search TTrust & Metrics markets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  {/* Sub-tab Navigation */}
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

                  {/* Empty State */}
                  <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-white/20 shadow-xl text-white">
                    <CardContent className="p-12 text-center">
                      <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-2xl font-bold mb-4">More Markets Coming Soon</h3>
                      <p className="text-gray-300 mb-6">
                        These are example TTrust & Metrics markets. Create your own advanced prediction markets!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          Create Market
                        </Button>
                        <Link href="/predictions">
                          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                            Try Classic Markets
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "create" && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-3xl font-bold text-white flex items-center">
                        <Plus className="h-8 w-8 mr-3 text-indigo-400" />
                        Create TTrust & Metrics Market
                      </CardTitle>
                      <p className="text-lg text-slate-300">
                        Launch advanced prediction markets for TTrust token performance or Intuition blockchain metrics.
                      </p>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-4">TTrust Markets</h3>
                          <p className="text-gray-300 mb-4">Create prediction markets on TTrust token performance:</p>
                          <ul className="text-gray-300 space-y-2">
                            <li>• Price targets & timeframes</li>
                            <li>• Market cap milestones</li>
                            <li>• Trading volume predictions</li>
                            <li>• Liquidity pool metrics</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold text-white mb-4">Metrics Markets</h3>
                          <p className="text-gray-300 mb-4">Predict Intuition blockchain growth metrics:</p>
                          <ul className="text-gray-300 space-y-2">
                            <li>• Atom creation milestones</li>
                            <li>• Triplet count predictions</li>
                            <li>• Signal accumulation goals</li>
                            <li>• Network activity metrics</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-6 mb-8">
                        <h4 className="text-lg font-semibold text-white mb-4">Advanced Market Features</h4>
                        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Oracle resolution:</span>
                              <span className="text-cyan-400">Automated via API</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Minimum liquidity:</span>
                              <span className="text-blue-400">0.01 TTRUST</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Creation fee:</span>
                              <span className="text-purple-400">0.005 TTRUST</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Resolution buffer:</span>
                              <span className="text-emerald-400">24 hours</span>
                            </div>
                          </div>
                        </div>
                      </div>

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
                </div>
              )}

              {activeTab === "portfolio" && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-white">💼 My TTrust Portfolio</h2>

                  {!address ? (
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                      <CardContent className="p-12 text-center">
                        <h3 className="text-2xl mb-4 text-white">🔌 Connect Your Wallet</h3>
                        <p className="text-gray-300">
                          Connect your wallet to view your TTrust & Metrics prediction positions
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">💎</div>
                          <div className="text-gray-300 text-sm">TTrust Value</div>
                          <div className="text-2xl font-bold text-blue-400">0.0 TTRUST</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">📊</div>
                          <div className="text-gray-300 text-sm">Active Positions</div>
                          <div className="text-2xl font-bold text-purple-400">0</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">🎯</div>
                          <div className="text-gray-300 text-sm">Success Rate</div>
                          <div className="text-2xl font-bold text-cyan-400">-%</div>
                        </div>
                      </div>

                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                        <CardContent className="p-12 text-center">
                          <h3 className="text-2xl mb-4 text-white">📈 No Positions Yet</h3>
                          <p className="text-gray-300 mb-6">
                            Start trading TTrust & Metrics markets to see your positions here!
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={() => setActiveTab("markets")}
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                            >
                              💎 Browse TTrust Markets
                            </Button>
                            <Link href="/predictions">
                              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3">
                                📊 Classic Markets
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>

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
