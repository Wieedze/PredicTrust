"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent } from "~~/components/ui/card";

const PredictionsPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("race");

  const tabs = [
    { id: "race", label: "🏎️ Race Prediction", icon: "🏁" },
    { id: "markets", label: "📊 All Markets", icon: "📈" },
    { id: "portfolio", label: "💼 My Portfolio", icon: "👤" },
  ];

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
                  PredicTrust
                </span>
              </h1>
              <p className="text-xl text-gray-300">Decentralized Prediction Markets on Intuition</p>
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
              {activeTab === "race" && (
                <div>
                  {/* Race Visualization */}
                  <Card className="bg-gradient-to-r from-green-500/20 to-red-500/20 backdrop-blur-lg border-white/20 shadow-xl text-white mb-8">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-2xl font-bold mb-4 text-white">🏁 Car Race Prediction</h3>
                      <div className="flex justify-center space-x-8 mb-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            🚗
                          </div>
                          <p className="text-green-400 font-semibold">Green Car</p>
                        </div>
                        <div className="text-4xl text-white">VS</div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            🚗
                          </div>
                          <p className="text-red-400 font-semibold">Red Car</p>
                        </div>
                      </div>
                      <p className="text-gray-300">Will the green car win the race?</p>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Betting Card */}
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                      <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-4 text-white">🎯 Place Your Bet</h2>
                        <p className="text-gray-300 mb-6">Will the green car win the race?</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <Button className="bg-green-500 hover:bg-green-600 text-white py-4 text-lg">
                            🟢 YES
                            <span className="ml-2 bg-black/30 px-2 py-1 rounded">0.006 ETH</span>
                          </Button>
                          <Button className="bg-red-500 hover:bg-red-600 text-white py-4 text-lg">
                            🔴 NO
                            <span className="ml-2 bg-black/30 px-2 py-1 rounded">0.004 ETH</span>
                          </Button>
                        </div>

                        <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">🏆</span>
                              <span className="text-gray-300">Potential Win</span>
                            </div>
                            <span className="text-xl font-bold text-green-400">0.01 ETH</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Market Info */}
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                      <CardContent className="p-8">
                        <h2 className="text-2xl font-bold mb-6 text-white">📊 Market Info</h2>

                        <div className="space-y-4">
                          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-2xl mr-2">💧</span>
                                <span className="text-gray-300">Total Liquidity</span>
                              </div>
                              <span className="text-xl font-bold text-blue-400">1.0 ETH</span>
                            </div>
                          </div>

                          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-2xl mr-2">🎲</span>
                                <span className="text-gray-300">Probability</span>
                              </div>
                              <span className="text-xl font-bold text-purple-400">60% / 40%</span>
                            </div>
                          </div>

                          <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-2xl mr-2">👥</span>
                                <span className="text-gray-300">Total Traders</span>
                              </div>
                              <span className="text-xl font-bold text-cyan-400">12</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "markets" && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-white">📈 All Prediction Markets</h2>

                  {/* Featured Market */}
                  <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">🏎️ Race Prediction Market</h3>
                          <p className="text-lg text-gray-300">Will the green car win the race?</p>
                        </div>
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">ACTIVE</div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                          <div className="text-gray-300 text-sm">Liquidity</div>
                          <div className="text-xl font-bold text-white">1.0 ETH</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                          <div className="text-gray-300 text-sm">Volume</div>
                          <div className="text-xl font-bold text-white">0.5 ETH</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur rounded-lg p-4">
                          <div className="text-gray-300 text-sm">Traders</div>
                          <div className="text-xl font-bold text-white">12</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-center py-12">
                    <p className="text-xl text-gray-400">More prediction markets coming soon...</p>
                    <p className="text-gray-500">🚧 Under Construction</p>
                  </div>
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
                          <div className="text-2xl font-bold text-blue-400">0.0 ETH</div>
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
                          <Button
                            onClick={() => setActiveTab("race")}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                          >
                            🎯 Place Your First Bet
                          </Button>
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
