"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatEther } from "viem";
import { usePublicClient } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card, CardHeader, CardTitle } from "~~/components/ui/card";

interface SimpleMarketCardProps {
  marketAddress: string;
  index: number;
  onBuyYes: (marketAddress: string) => void;
  onBuyNo: (marketAddress: string) => void;
  userAddress?: string;
}

// ABI pour les fonctions qu'on utilise
const MARKET_ABI = [
  {
    inputs: [],
    name: "getMarketInfo",
    outputs: [
      { type: "string" },
      { type: "string" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "bool" },
      { type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yesPool",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "noPool",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getYesPrice",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNoPrice",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "address" }],
    name: "yesPositions",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "address" }],
    name: "noPositions",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const SimpleMarketCard: React.FC<SimpleMarketCardProps> = ({
  marketAddress,
  onBuyYes,
  onBuyNo,
  userAddress,
}) => {
  const publicClient = usePublicClient();
  const [marketData, setMarketData] = useState({
    title: "Loading...",
    question: "Loading...",
    deadline: "Loading...",
    totalPool: "0",
    yesPrice: "0",
    noPrice: "0",
    yesPool: "0",
    noPool: "0",
    userYesBalance: "0",
    userNoBalance: "0",
    isActive: true,
    isLoading: true,
  });

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!publicClient) return;

      try {
        console.log("🔄 Fetching data for market:", marketAddress);

        // Appels directs aux contrats
        const [marketInfo, yesPool, noPool, yesPrice, noPrice] = await Promise.all([
          publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "getMarketInfo",
          }),
          publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "yesPool",
          }),
          publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "noPool",
          }),
          publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "getYesPrice",
          }),
          publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "getNoPrice",
          }),
        ]);

        console.log("✅ Raw market data:", { marketInfo, yesPool, noPool, yesPrice, noPrice });

        const totalPool = formatEther((yesPool as bigint) + (noPool as bigint));
        const deadline = new Date(Number((marketInfo as any[])[3]) * 1000).toLocaleDateString();

        setMarketData({
          title: (marketInfo as any[])[0] as string,
          question: (marketInfo as any[])[1] as string,
          deadline,
          totalPool,
          yesPrice: parseFloat(formatEther(yesPrice as bigint)).toFixed(4),
          noPrice: parseFloat(formatEther(noPrice as bigint)).toFixed(4),
          yesPool: parseFloat(formatEther(yesPool as bigint)).toFixed(2),
          noPool: parseFloat(formatEther(noPool as bigint)).toFixed(2),
          isActive: !(marketInfo as any[])[6], // not resolved = active
          isLoading: false,
        });

        console.log("✅ Market data processed successfully");
      } catch (error) {
        console.error("❌ Error fetching market data:", error);
        setMarketData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchMarketData();
  }, [marketAddress, publicClient]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white hover:border-blue-500/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-2">{marketData.question}</CardTitle>
            <p className="text-sm text-gray-300 mb-3">{marketData.title}</p>
            <div className="text-xs text-blue-300 mb-3">
              <span className="font-medium">Market: </span>
              {marketAddress.slice(0, 10)}...{marketAddress.slice(-6)}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{marketData.isActive ? "Active" : "Resolved"}</span>
          </div>
        </div>

        {/* Total Pool Display */}
        <div className="bg-blue-500/20 rounded-lg p-4 mb-4 text-center border border-blue-500/30">
          <div className="text-blue-300 font-bold text-2xl">{marketData.totalPool}</div>
          <div className="text-sm text-blue-200">Total Pool (TTRUST)</div>
        </div>

        {/* YES/NO Price Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30">
            <div className="text-green-400 font-bold text-lg">{marketData.yesPrice}</div>
            <div className="text-xs text-green-300 mb-1">YES Price</div>
            <div className="text-xs text-gray-400">Pool: {marketData.yesPool}</div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
            <div className="text-red-400 font-bold text-lg">{marketData.noPrice}</div>
            <div className="text-xs text-red-300 mb-1">NO Price</div>
            <div className="text-xs text-gray-400">Pool: {marketData.noPool}</div>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            size="sm"
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 hover:text-green-300 backdrop-blur-sm"
            disabled={!userAddress || !marketData.isActive}
            onClick={() => onBuyYes(marketAddress)}
          >
            Buy YES
          </Button>
          <Button
            size="sm"
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 backdrop-blur-sm"
            disabled={!userAddress || !marketData.isActive}
            onClick={() => onBuyNo(marketAddress)}
          >
            Buy NO
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs border-t border-gray-700 pt-3">
          <div>
            <span className="text-gray-400">Deadline:</span>
            <span className="text-orange-400 font-semibold ml-2">{marketData.deadline}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ml-2 ${marketData.isActive ? "text-green-400" : "text-red-400"}`}>
              {marketData.isActive ? "Active" : "Resolved"}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
