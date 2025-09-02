"use client";

import React from "react";
import { Clock } from "lucide-react";
import { formatEther } from "viem";
import { Button } from "~~/components/ui/button";
import { Card, CardHeader, CardTitle } from "~~/components/ui/card";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface MarketCardProps {
  marketAddress: string;
  index: number;
  onBuyYes: (marketAddress: string) => void;
  onBuyNo: (marketAddress: string) => void;
  userAddress?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({ marketAddress, onBuyYes, onBuyNo, userAddress }) => {
  // Read market info from SimpleNativeMarket contract
  const { data: marketInfo, error: marketInfoError } = useScaffoldReadContract({
    contractName: "SimpleNativeMarket",
    functionName: "getMarketInfo",
    args: [],
    address: marketAddress as `0x${string}`,
  });

  // Debug logs
  console.log("🔍 MarketCard Debug for", marketAddress);
  console.log("📊 Market Info:", marketInfo);
  console.log("❌ Market Info Error:", marketInfoError);

  const { data: yesPool } = useScaffoldReadContract({
    contractName: "SimpleNativeMarket",
    functionName: "yesPool",
    args: [],
    address: marketAddress as `0x${string}`,
  });

  const { data: noPool } = useScaffoldReadContract({
    contractName: "SimpleNativeMarket",
    functionName: "noPool",
    args: [],
    address: marketAddress as `0x${string}`,
  });

  const { data: yesPrice } = useScaffoldReadContract({
    contractName: "SimpleNativeMarket",
    functionName: "getYesPrice",
    args: [],
    address: marketAddress as `0x${string}`,
  });

  const { data: noPrice } = useScaffoldReadContract({
    contractName: "SimpleNativeMarket",
    functionName: "getNoPrice",
    args: [],
    address: marketAddress as `0x${string}`,
  });

  // Calculate display values
  const totalPool = yesPool && noPool ? formatEther(yesPool + noPool) : "0";
  const formattedYesPrice = yesPrice ? parseFloat(formatEther(yesPrice)).toFixed(4) : "0";
  const formattedNoPrice = noPrice ? parseFloat(formatEther(noPrice)).toFixed(4) : "0";
  const yesPoolFormatted = yesPool ? parseFloat(formatEther(yesPool)).toFixed(2) : "0";
  const noPoolFormatted = noPool ? parseFloat(formatEther(noPool)).toFixed(2) : "0";

  const title = marketInfo ? marketInfo[0] : "Loading...";
  const question = marketInfo ? marketInfo[1] : "Loading...";
  const deadline = marketInfo ? new Date(Number(marketInfo[3]) * 1000).toLocaleDateString() : "Loading...";
  const isActive = marketInfo ? !marketInfo[6] : true; // not resolved = active

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white hover:border-blue-500/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-2">{question}</CardTitle>
            <p className="text-sm text-gray-300 mb-3">{title}</p>
            <div className="text-xs text-blue-300 mb-3">
              <span className="font-medium">Market: </span>
              {marketAddress.slice(0, 10)}...{marketAddress.slice(-6)}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{isActive ? "Active" : "Resolved"}</span>
          </div>
        </div>

        {/* Total Pool Display */}
        <div className="bg-blue-500/20 rounded-lg p-4 mb-4 text-center border border-blue-500/30">
          <div className="text-blue-300 font-bold text-2xl">{totalPool}</div>
          <div className="text-sm text-blue-200">Total Pool (TTRUST)</div>
        </div>

        {/* YES/NO Price Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30">
            <div className="text-green-400 font-bold text-lg">{formattedYesPrice}</div>
            <div className="text-xs text-green-300 mb-1">YES Price</div>
            <div className="text-xs text-gray-400">Pool: {yesPoolFormatted}</div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
            <div className="text-red-400 font-bold text-lg">{formattedNoPrice}</div>
            <div className="text-xs text-red-300 mb-1">NO Price</div>
            <div className="text-xs text-gray-400">Pool: {noPoolFormatted}</div>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            size="sm"
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 hover:text-green-300 backdrop-blur-sm"
            disabled={!userAddress || !isActive}
            onClick={() => onBuyYes(marketAddress)}
          >
            Buy YES
          </Button>
          <Button
            size="sm"
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 backdrop-blur-sm"
            disabled={!userAddress || !isActive}
            onClick={() => onBuyNo(marketAddress)}
          >
            Buy NO
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs border-t border-gray-700 pt-3">
          <div>
            <span className="text-gray-400">Deadline:</span>
            <span className="text-orange-400 font-semibold ml-2">{deadline}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ml-2 ${isActive ? "text-green-400" : "text-red-400"}`}>
              {isActive ? "Active" : "Resolved"}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
