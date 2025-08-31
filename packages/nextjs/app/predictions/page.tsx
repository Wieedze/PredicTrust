"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, DollarSign, Filter, Plus, Search, TrendingUp, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";

const PredictionsPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("markets");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "markets", label: "📊 All Markets", icon: "📈" },
    { id: "create", label: "➕ Create Market", icon: "🎯" },
    { id: "portfolio", label: "💼 My Portfolio", icon: "👤" },
  ];

  // Mock data for demonstration - in real app this would come from contracts
  const exampleMarkets = [
    {
      id: 1,
      title: "Will Bitcoin reach $100,000 by end of 2025?",
      description: "Prediction on Bitcoin price reaching six figures",
      category: "Crypto",
      endDate: "Dec 31, 2025",
      totalVolume: "5.2 TTRUST",
      participants: 45,
      yesPrice: "0.45 TTRUST",
      noPrice: "0.55 TTRUST",
      status: "active",
    },
    {
      id: 2,
      title: "Will Ethereum upgrade succeed without issues?",
      description: "Next major Ethereum network upgrade completion",
      category: "Technology",
      endDate: "Jun 15, 2025",
      totalVolume: "3.1 TTRUST",
      participants: 32,
      yesPrice: "0.68 TTRUST",
      noPrice: "0.32 TTRUST",
      status: "active",
    },
  ];

  const MarketCard = ({ market }: { market: any }) => (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white hover:border-blue-500/50 transition-all">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-2">{market.title}</CardTitle>
            <p className="text-sm text-gray-300 mb-2">{market.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="bg-blue-500/20 px-2 py-1 rounded">{market.category}</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {market.endDate}
              </span>
            </div>
          </div>
          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
            {market.status.toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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

        <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-white/10">
          <span className="flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            {market.totalVolume} volume
          </span>
          <span className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {market.participants} traders
          </span>
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
                  Prediction Markets
                </span>
              </h1>
              <p className="text-xl text-gray-300">Traditional binary outcome predictions</p>
              {connectedAddress && (
                <div className="flex justify-center items-center mt-4">
                  <span className="mr-2 text-gray-300">Connected:</span>
                  <Address address={connectedAddress} />
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
                        placeholder="Search prediction markets..."
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

                  {/* Markets Grid */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {exampleMarkets.map(market => (
                      <MarketCard key={market.id} market={market} />
                    ))}
                  </div>

                  {/* Empty State */}
                  <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-white/20 shadow-xl text-white">
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-2xl font-bold mb-4">No More Markets Available</h3>
                      <p className="text-gray-300 mb-6">
                        These are example markets. Connect your wallet and create your own prediction markets!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          Create Market
                        </Button>
                        <Link href="/ttrust-predictions">
                          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                            Try TTrust Markets
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
                        Create Your Prediction Market
                      </CardTitle>
                      <p className="text-lg text-slate-300">
                        Launch a custom binary prediction market with your own question and parameters.
                      </p>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-4">Classic Binary Markets</h3>
                          <p className="text-gray-300 mb-4">
                            Create traditional YES/NO prediction markets on any topic:
                          </p>
                          <ul className="text-gray-300 space-y-2">
                            <li>• Sports outcomes</li>
                            <li>• Political events</li>
                            <li>• Technology milestones</li>
                            <li>• Economic indicators</li>
                            <li>• Weather events</li>
                          </ul>
                        </div>

                        <div className="bg-white/5 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Market Requirements</h4>
                          <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex justify-between">
                              <span>Minimum liquidity:</span>
                              <span className="text-blue-400">0.1 TTRUST</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Creation fee:</span>
                              <span className="text-purple-400">0.001 TTRUST</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Oracle:</span>
                              <span className="text-cyan-400">Manual resolution</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <Button
                          disabled
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-4 text-lg cursor-not-allowed opacity-50"
                        >
                          🚧 Coming Soon - Classic Market Creator
                        </Button>
                        <p className="text-sm text-gray-400 mt-4">
                          Traditional market creation is under development. Try our TTrust & Metrics markets instead!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "portfolio" && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-white">💼 My Portfolio</h2>

                  {!connectedAddress ? (
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                      <CardContent className="p-12 text-center">
                        <h3 className="text-2xl mb-4 text-white">🔌 Connect Your Wallet</h3>
                        <p className="text-gray-300">
                          Connect your wallet to view your prediction positions and history
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">💰</div>
                          <div className="text-gray-300 text-sm">Total Value</div>
                          <div className="text-2xl font-bold text-blue-400">0.0 TTRUST</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">📈</div>
                          <div className="text-gray-300 text-sm">Active Positions</div>
                          <div className="text-2xl font-bold text-purple-400">0</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-lg p-6 text-center">
                          <div className="text-2xl mb-2">🏆</div>
                          <div className="text-gray-300 text-sm">Win Rate</div>
                          <div className="text-2xl font-bold text-cyan-400">-%</div>
                        </div>
                      </div>

                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                        <CardContent className="p-12 text-center">
                          <h3 className="text-2xl mb-4 text-white">📊 No Positions Yet</h3>
                          <p className="text-gray-300 mb-6">Start trading to see your positions here!</p>
                          <div className="flex gap-4 justify-center">
                            <Link href="/ttrust-predictions">
                              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3">
                                💎 Try TTrust Markets
                              </Button>
                            </Link>
                            <Button
                              onClick={() => setActiveTab("markets")}
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3"
                            >
                              📊 Browse Markets
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PredictionsPage;
