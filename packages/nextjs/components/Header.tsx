"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

/**
 * Site header - Simplified without navigation
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="fixed top-0 w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex relative w-10 h-10">
              <Image alt="PredicTrust logo" className="cursor-pointer" fill src="/predictrust-logo.svg" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight text-white text-lg">PredicTrust</span>
              <span className="text-xs text-gray-400">Prediction for Trust</span>
            </div>
          </Link>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            <RainbowKitCustomConnectButton />
            {isLocalNetwork && <FaucetButton />}
          </div>
        </div>
      </div>
    </div>
  );
};
