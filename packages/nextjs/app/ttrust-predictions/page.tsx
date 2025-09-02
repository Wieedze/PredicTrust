"use client";

import React, { useState } from "react";
import { Filter, Plus, Search, Target } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { SimpleMarketCard } from "~~/components/SimpleMarketCard";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const PredictionMarketsPage = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("markets");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for creating markets
  const [marketForm, setMarketForm] = useState({
    category: "ttrust",
    predictionQuestion: "",
    targetValue: "",
    deadline: "",
    liquidityAmount: "",
    description: "",
  });

  const tabs = [
    { id: "markets", label: "All Markets", icon: "📈" },
    { id: "create", label: "➕ Create Market", icon: "" },
    { id: "portfolio", label: "💼 My Portfolio", icon: "" },
  ];

  // Read real markets from deployed native factory
  const { data: marketCount, isLoading: isLoadingCount } = useScaffoldReadContract({
    contractName: "PredictionFactoryNative",
    functionName: "getMarketCount",
  });

  const { data: activeMarketsData, isLoading: isLoadingMarkets } = useScaffoldReadContract({
    contractName: "PredictionFactoryNative",
    functionName: "getActiveMarkets",
    args: [0n, marketCount || 10n],
  });

  // Create new market with native factory
  const { writeContractAsync: createTTrustMarket } = useScaffoldWriteContract("PredictionFactoryNative");

  const { data: walletClient } = useWalletClient();

  // ABI for trading functions
  const MARKET_ABI = [
    {
      inputs: [],
      name: "buyYes",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "buyNo",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ] as const;

  // Trading functions for native TTRUST markets
  const handleBuyYes = async (marketAddress: string) => {
    if (!address || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Ask user how much TTRUST they want to spend
      const amountStr = prompt("How much TTRUST do you want to spend on YES tokens?", "0.1");
      if (!amountStr || parseFloat(amountStr) <= 0) return;

      const amountWei = parseEther(amountStr);

      console.log("💚 Buying YES tokens for market:", marketAddress);
      console.log("💰 Amount:", amountStr, "TTRUST");

      const tx = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "buyYes",
        value: amountWei,
      });

      console.log("✅ YES purchase transaction sent:", tx);
      alert(`YES purchase successful! Transaction: ${tx}`);

      // The page will auto-refresh and show updated balances
    } catch (error) {
      console.error("❌ Error buying YES tokens:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error buying YES: ${errorMessage}`);
    }
  };

  const handleBuyNo = async (marketAddress: string) => {
    if (!address || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Ask user how much TTRUST they want to spend
      const amountStr = prompt("How much TTRUST do you want to spend on NO tokens?", "0.1");
      if (!amountStr || parseFloat(amountStr) <= 0) return;

      const amountWei = parseEther(amountStr);

      console.log("🔴 Buying NO tokens for market:", marketAddress);
      console.log("💰 Amount:", amountStr, "TTRUST");

      const tx = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "buyNo",
        value: amountWei,
      });

      console.log("✅ NO purchase transaction sent:", tx);
      alert(`NO purchase successful! Transaction: ${tx}`);

      // The page will auto-refresh and show updated balances
    } catch (error) {
      console.error("❌ Error buying NO tokens:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error buying NO: ${errorMessage}`);
    }
  };

  // Handle market creation
  const handleCreateMarket = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const deadlineTimestamp = Math.floor(new Date(marketForm.deadline).getTime() / 1000);
      const targetValueWei = parseEther(marketForm.targetValue);
      const liquidityWei = parseEther(marketForm.liquidityAmount);
      const creationFee = parseEther("0.001"); // 0.001 TTRUST creation fee
      const totalTTrust = liquidityWei + creationFee;

      console.log("Creating native TTRUST market...");
      console.log("Liquidity:", marketForm.liquidityAmount, "TTRUST");
      console.log("Creation fee: 0.001 TTRUST");
      console.log("Total TTRUST needed:", formatEther(totalTTrust));

      // Create the market with native TTRUST (no approve needed!)
      const marketTx = await createTTrustMarket({
        functionName: "createTTrustMarket",
        args: [
          0, // PredictionType (0 = MARKET_CAP_ABOVE)
          targetValueWei, // Target value
          BigInt(deadlineTimestamp), // Deadline
          marketForm.predictionQuestion, // Question (used as title)
          marketForm.predictionQuestion, // Question
        ],
        value: totalTTrust, // Send TTRUST directly!
      });
      console.log("Native market creation transaction sent:", marketTx);

      // Reset form
      setMarketForm({
        category: "ttrust",
        predictionQuestion: "",
        targetValue: "",
        deadline: "",
        liquidityAmount: "",
        description: "",
      });

      alert("Market created successfully!");
    } catch (error) {
      console.error("Failed to create market:", error);
      alert("Failed to create market. Please try again.");
    }
  };

  // Process real markets data from contracts
  // Try different ways to extract market addresses based on contract return format
  let marketAddresses: string[] = [];

  if (activeMarketsData) {
    // If it's an array with [markets, total] structure
    if (Array.isArray(activeMarketsData) && activeMarketsData.length >= 1) {
      marketAddresses = Array.from(activeMarketsData[0] || []);
    }
    // If it's directly an array of addresses
    else if (Array.isArray(activeMarketsData)) {
      marketAddresses = Array.from(activeMarketsData);
    }
  }

  // Debug logging
  console.log("Market count:", marketCount);
  console.log("Is loading count:", isLoadingCount);
  console.log("Is loading markets:", isLoadingMarkets);
  console.log("Active markets data:", activeMarketsData);
  console.log("Market addresses:", marketAddresses);
  console.log("marketAddresses.length:", marketAddresses?.length);
  console.log("Type of activeMarketsData:", typeof activeMarketsData);
  console.log("Is activeMarketsData an array?", Array.isArray(activeMarketsData));

  // Market data is now handled directly by MarketCard components

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
              <p className="text-xl text-gray-300">Decentralized Prediction Markets on Intuition</p>
              <p className="text-gray-400 max-w-2xl mx-auto mt-2">
                Create and trade prediction markets for TTrust token performance and blockchain metrics with real-time
                data and decentralized resolution.
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

                  {/* Market Grid */}
                  <div className="grid lg:grid-cols-2 gap-8 mb-12">
                    {isLoadingCount || isLoadingMarkets ? (
                      <div className="col-span-2 text-center py-12">
                        <h3 className="text-xl text-gray-300 mb-4">Loading markets...</h3>
                        <p className="text-gray-400">
                          Count: {isLoadingCount ? "Loading..." : marketCount?.toString()}
                          <br />
                          Markets: {isLoadingMarkets ? "Loading..." : "Loaded"}
                        </p>
                      </div>
                    ) : marketAddresses && marketAddresses.length > 0 ? (
                      marketAddresses.map((marketAddress: string, index: number) => (
                        <SimpleMarketCard
                          key={index}
                          marketAddress={marketAddress}
                          index={index}
                          onBuyYes={handleBuyYes}
                          onBuyNo={handleBuyNo}
                          userAddress={address}
                        />
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12">
                        <h3 className="text-xl text-gray-300 mb-4">No prediction yet</h3>
                        <p className="text-gray-400 mb-6">
                          Create the first prediction !
                          <br />
                          <small className="text-gray-500">
                            Debug: Count={marketCount?.toString()}, Addresses={marketAddresses?.length || 0}
                          </small>
                        </p>
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          Create Prediction
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Empty State - Only show when no markets and not loading */}
                  {!isLoadingCount && !isLoadingMarkets && (!marketAddresses || marketAddresses.length === 0) && (
                    <Card className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-lg border-white/20 shadow-xl text-white">
                      <CardContent className="p-12 text-center">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-2xl font-bold mb-4">No Active Prediction</h3>
                        <p className="text-gray-300 mb-6">Start trading by creating your first prediction market!</p>
                        <Button
                          onClick={() => setActiveTab("create")}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          Create Prediction
                        </Button>
                      </CardContent>
                    </Card>
                  )}
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
                              <span className="text-purple-400">0.001 TTRUST</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Resolution buffer:</span>
                              <span className="text-emerald-400">24 hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Creation Form */}
                  <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-lg border-white/20 shadow-xl text-white">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-white">📝 Create New Market</CardTitle>
                      <p className="text-gray-300">Fill out the form below to create your prediction market</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                          <select
                            value={marketForm.category}
                            onChange={e => setMarketForm({ ...marketForm, category: e.target.value })}
                            className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="ttrust">TTrust Token</option>
                            <option value="metrics">Blockchain Metrics</option>
                            <option value="general">General Prediction</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Target Value</label>
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="e.g., 10 (for $10), 1000000 (for 1M users)..."
                            value={marketForm.targetValue}
                            onChange={e => setMarketForm({ ...marketForm, targetValue: e.target.value })}
                            className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                          <input
                            type="datetime-local"
                            value={marketForm.deadline}
                            onChange={e => setMarketForm({ ...marketForm, deadline: e.target.value })}
                            className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Initial Liquidity (TRUST)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            placeholder="e.g., 0.1"
                            value={marketForm.liquidityAmount}
                            onChange={e => setMarketForm({ ...marketForm, liquidityAmount: e.target.value })}
                            className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Prediction Question</label>
                        <input
                          type="text"
                          placeholder="e.g., Will TTrust reach $10 by December 2024?, Will Intuition have 100K users by Q2?"
                          value={marketForm.predictionQuestion}
                          onChange={e => setMarketForm({ ...marketForm, predictionQuestion: e.target.value })}
                          className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Market Description</label>
                        <textarea
                          placeholder="Describe your prediction market..."
                          value={marketForm.description}
                          onChange={e => setMarketForm({ ...marketForm, description: e.target.value })}
                          rows={3}
                          className="w-full bg-white/10 backdrop-blur-lg border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={handleCreateMarket}
                          disabled={
                            !address ||
                            !marketForm.predictionQuestion ||
                            !marketForm.targetValue ||
                            !marketForm.deadline ||
                            !marketForm.liquidityAmount
                          }
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg disabled:opacity-50"
                        >
                          🚀 Create Market
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "portfolio" && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-white">💼 My Portfolio</h2>

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
                      Select from Trust price/market cap predictions or Intuition blockchain metrics forecasts.
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
                      When the prediction resolves, winning token holders receive TRUST rewards proportional to their
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

export default PredictionMarketsPage;
