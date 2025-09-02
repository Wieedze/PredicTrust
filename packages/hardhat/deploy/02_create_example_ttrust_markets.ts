import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Creates example TTrust-based prediction markets after factory deployment
 * This script creates the markets shown in the UI for demonstration
 */
const createExampleMarkets: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  // Use different Hardhat accounts
  const accounts = await hre.ethers.getSigners();
  const liquidityProviderAccount = accounts[2] || accounts[0];

  console.log("📋 Creating Example TTrust Markets...");

  try {
    // Get contract instances
    const factory = await hre.ethers.getContract("PredictionFactoryTTrust", deployer);
    await hre.ethers.getContract("MockTTrustToken", deployer);

    // Calculate deadline dates
    const now = Math.floor(Date.now() / 1000);
    const march2025 = now + 89 * 24 * 60 * 60; // ~89 days from now
    const june2025 = now + 180 * 24 * 60 * 60; // ~180 days from now

    console.log("\n🎯 Creating TTrust Market Cap Prediction (March 2025)...");

    // 1. TTrust Market Cap Prediction - $1M by March 2025
    await factory.connect(liquidityProviderAccount).createTTrustPrediction(
      0, // PredictionType.MARKET_CAP_ABOVE
      ethers.parseEther("1000000"), // Target: $1M market cap
      march2025,
      "TTrust will reach $1M market cap by March 2025",
      ethers.parseEther("0.01"), // Initial token value
      43, // 43% initial YES probability
      10, // 10% locked percentage
      ethers.parseEther("2.5"), // 2.5 TTRUST initial liquidity
    );

    console.log("✅ TTrust Market Cap Prediction created");

    console.log("\n📈 Creating TTrust Price Prediction (June 2025)...");

    // 2. TTrust Price Prediction - $2.00 by June 2025
    await factory.connect(liquidityProviderAccount).createTTrustPrediction(
      2, // PredictionType.PRICE_ABOVE
      ethers.parseEther("2.00"), // Target: $2.00 price
      june2025,
      "TTrust price will exceed $2.00 by June 2025",
      ethers.parseEther("0.01"), // Initial token value
      29, // 29% initial YES probability
      10, // 10% locked percentage
      ethers.parseEther("1.8"), // 1.8 TTRUST initial liquidity
    );

    console.log("✅ TTrust Price Prediction created");

    // Get created market addresses
    const marketCount = await factory.getMarketCount();
    console.log(`\n📊 Total markets created: ${marketCount}`);

    // Display market addresses
    for (let i = 0; i < Number(marketCount); i++) {
      const marketInfo = await factory.getMarketInfo(i);
      console.log(`📍 Market ${i}: ${marketInfo.marketAddress}`);
      console.log(`   Type: TTrust Prediction`);
      console.log(`   Description: ${marketInfo.description.substring(0, 50)}...`);
    }

    console.log("\n🎉 All example TTrust markets created successfully!");
    console.log("💡 Users can now interact with these TTrust prediction markets through the UI");
  } catch (error) {
    console.error("❌ Error creating example markets:", error);
    // Don't fail the deployment if example market creation fails
  }
};

export default createExampleMarkets;

// This should run after the TTrust contracts are deployed
createExampleMarkets.tags = ["ExampleMarkets"];
createExampleMarkets.dependencies = ["TTrustContracts"];
