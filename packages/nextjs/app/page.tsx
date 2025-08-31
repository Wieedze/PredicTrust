"use client";

import Link from "next/link";
import { BarChart3, Coins, Zap } from "lucide-react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { IntuitionStats } from "~~/components/IntuitionStats";
import { ParticleBackground } from "~~/components/ParticleBackground";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Card, CardContent } from "~~/components/ui/card";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      {/* Particle Background */}
      <ParticleBackground />

      <div className="relative z-10 min-h-screen bg-black/30">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                PredicTrust
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-6">Decentralized Prediction Markets on Intuition</p>

            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              🔮 Harness the collective wisdom of the crowd. Trade on future outcomes, earn from accurate predictions,
              and participate in truly decentralized markets.
            </p>

            {connectedAddress && (
              <div className="flex justify-center items-center mb-8 gap-2 text-gray-300">
                <span className="text-sm opacity-70">Connected:</span>
                <Address address={connectedAddress} />
              </div>
            )}

            <div className="flex gap-4 justify-center flex-col sm:flex-row mb-16">
              <Link href="/ttrust-predictions">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
                  💎 TTrust Markets
                </Button>
              </Link>
              <Link href="/predictions">
                <Button variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg">
                  📊 Classic Markets
                </Button>
              </Link>
            </div>

            {/* Real-time Stats */}
            <IntuitionStats className="mb-16" />
          </div>

          {/* Glass Cards Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <BarChart3 className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Real-time Trading</h3>
                <p className="text-gray-300 leading-relaxed">
                  Trade prediction tokens in real-time with dynamic pricing. Buy low when you believe, sell high when
                  others catch on.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <Coins className="h-12 w-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Earn from Knowledge</h3>
                <p className="text-gray-300 leading-relaxed">
                  Your insights have value. Accurate predictions earn real rewards. Turn your expertise into profit.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl text-white">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <Zap className="h-12 w-12 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Powered by Intuition</h3>
                <p className="text-gray-300 leading-relaxed">
                  Built on Intuition blockchain for fast, secure, and cost-effective decentralized predictions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border-white/20 shadow-2xl max-w-4xl mx-auto">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold mb-6 text-white">Ready to Start?</h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join the future of prediction markets. Connect your wallet and place your first prediction today.
                </p>
                <Link href="/predictions">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-12 py-4 text-xl">
                    🚀 Enter PredicTrust
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
