"use client";

import React, { useEffect, useState } from "react";
import { Database, DollarSign, Network, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";

interface IntuitionStatsProps {
  className?: string;
}

export const IntuitionStats: React.FC<IntuitionStatsProps> = ({ className = "" }) => {
  const [stats, setStats] = useState({
    ttrust: {
      price: 0.52,
      marketCap: 520000,
      change24h: 8.5,
      volume24h: 15420,
    },
    metrics: {
      atoms: 12847,
      triplets: 8934,
      signals: 24561,
      atomsGrowth: 156,
      tripletsGrowth: 67,
      signalsGrowth: 289,
    },
    lastUpdate: new Date(),
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ttrust: {
          ...prev.ttrust,
          price: prev.ttrust.price + (Math.random() - 0.5) * 0.02,
          change24h: prev.ttrust.change24h + (Math.random() - 0.5) * 0.5,
        },
        metrics: {
          ...prev.metrics,
          atoms: prev.metrics.atoms + Math.floor(Math.random() * 5),
          triplets: prev.metrics.triplets + Math.floor(Math.random() * 3),
          signals: prev.metrics.signals + Math.floor(Math.random() * 8),
        },
        lastUpdate: new Date(),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: num < 1 ? 4 : 2,
    }).format(num);
  };

  return (
    <div className={`grid lg:grid-cols-2 gap-6 ${className}`}>
      {/* TTrust Stats */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-300">
            <DollarSign className="h-5 w-5 mr-2" />
            TTrust Token Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.ttrust.price)}</div>
              <div className="text-sm text-slate-400">Current Price</div>
              <div
                className={`text-sm flex items-center mt-1 ${
                  stats.ttrust.change24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.ttrust.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(stats.ttrust.change24h).toFixed(2)}%
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.ttrust.marketCap)}</div>
              <div className="text-sm text-slate-400">Market Cap</div>
            </div>

            <div>
              <div className="text-lg font-semibold text-white">{formatCurrency(stats.ttrust.volume24h)}</div>
              <div className="text-sm text-slate-400">24h Volume</div>
            </div>

            <div>
              <div className="text-lg font-semibold text-green-400">LIVE</div>
              <div className="text-sm text-slate-400">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intuition Metrics Stats */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-300">
            <Network className="h-5 w-5 mr-2" />
            Intuition Network Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Atoms */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-4 w-4 text-cyan-400 mr-1" />
                <span className="text-sm text-slate-400">Atoms</span>
              </div>
              <div className="text-lg font-bold text-white">{formatNumber(stats.metrics.atoms)}</div>
              <div className="text-xs text-green-400">+{stats.metrics.atomsGrowth}/day</div>
            </div>

            {/* Triplets */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm text-slate-400">Triplets</span>
              </div>
              <div className="text-lg font-bold text-white">{formatNumber(stats.metrics.triplets)}</div>
              <div className="text-xs text-green-400">+{stats.metrics.tripletsGrowth}/day</div>
            </div>

            {/* Signals */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-sm text-slate-400">Signals</span>
              </div>
              <div className="text-lg font-bold text-white">{formatNumber(stats.metrics.signals)}</div>
              <div className="text-xs text-green-400">+{stats.metrics.signalsGrowth}/day</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
              Last update: {stats.lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
