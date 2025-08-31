import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { ethers } from "hardhat";

/**
 * Deploys the complete PredicTrust prediction system with oracles and factory
 */
const deployPredictionSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const accounts = await hre.ethers.getSigners();
  const deployerAccount = accounts[0];

  console.log("🚀 Deploying PredicTrust Prediction System...");
  console.log("🏭 Deployer:", deployerAccount.address);

  // ===== DEPLOY ORACLES =====

  console.log("\n📡 Deploying Oracles...");

  // 1. Deploy TTrust Price Oracle
  console.log("💰 Deploying TTrust Price Oracle...");
  const initialTTrustPrice = ethers.parseEther("0.5"); // $0.5 initial price
  const initialMarketCap = ethers.parseEther("500000"); // $500k initial market cap

  const ttustPriceOracle = await deploy("TTrustPriceOracle", {
    from: deployer,
    args: [deployerAccount.address, initialTTrustPrice, initialMarketCap],
    log: true,
    autoMine: true,
  });

  console.log("✅ TTrust Price Oracle deployed to:", ttustPriceOracle.address);

  // 2. Deploy Intuition Metrics Oracle
  console.log("📊 Deploying Intuition Metrics Oracle...");
  const initialAtoms = 1000;
  const initialTriplets = 500;
  const initialSignals = 2000;

  const intuitionMetricsOracle = await deploy("IntuitionMetricsOracle", {
    from: deployer,
    args: [deployerAccount.address, initialAtoms, initialTriplets, initialSignals],
    log: true,
    autoMine: true,
  });

  console.log("✅ Intuition Metrics Oracle deployed to:", intuitionMetricsOracle.address);

  // ===== DEPLOY FACTORY =====

  console.log("\n🏭 Deploying Prediction Factory...");

  const predictionFactory = await deploy("PredictionFactory", {
    from: deployer,
    args: [deployerAccount.address, ttustPriceOracle.address, intuitionMetricsOracle.address],
    log: true,
    autoMine: true,
  });

  console.log("✅ Prediction Factory deployed to:", predictionFactory.address);

  // ===== SETUP AND CONFIGURATION =====

  console.log("\n⚙️ Setting up system configuration...");

  // Get deployed contracts
  const ttustOracle = await hre.ethers.getContract<Contract>("TTrustPriceOracle", deployer);
  const metricsOracle = await hre.ethers.getContract<Contract>("IntuitionMetricsOracle", deployer);
  const factory = await hre.ethers.getContract<Contract>("PredictionFactory", deployer);

  // Set factory as trusted updater for oracles (so it can update prices when needed)
  console.log("🔐 Setting up oracle permissions...");

  try {
    await ttustOracle.setTrustedUpdater(predictionFactory.address, true);
    console.log("✅ TTrust Oracle: Factory set as trusted updater");
  } catch {
    console.log("⚠️ TTrust Oracle: Could not set factory as trusted updater");
  }

  try {
    await metricsOracle.setTrustedUpdater(predictionFactory.address, true);
    console.log("✅ Metrics Oracle: Factory set as trusted updater");
  } catch {
    console.log("⚠️ Metrics Oracle: Could not set factory as trusted updater");
  }

  // ===== CREATE EXAMPLE MARKETS =====

  console.log("\n🎯 Creating example prediction markets...");

  const oneMonth = 30 * 24 * 60 * 60; // 30 days in seconds
  const threeMonths = 90 * 24 * 60 * 60; // 90 days in seconds

  try {
    // Example 1: TTrust Market Cap Prediction
    console.log("💎 Creating TTrust market cap prediction...");
    const ttustMarketCapTarget = ethers.parseEther("1000000"); // $1M target
    const deadline1 = Math.floor(Date.now() / 1000) + threeMonths;
    const marketLiquidity = ethers.parseEther("0.1");

    const tx1 = await factory.createTTrustMarket(
      0, // PredictionType.MARKET_CAP_ABOVE
      ttustMarketCapTarget,
      deadline1,
      "Will TTrust reach $1M market cap within 3 months?",
      0, // Use default token value
      0, // Use default probability
      { value: marketLiquidity },
    );

    await tx1.wait();
    console.log("✅ TTrust market created, tx:", tx1.hash);

    // Example 2: Intuition Metrics Prediction
    console.log("🌟 Creating Intuition atoms prediction...");
    const atomsTarget = 10000; // 10k atoms target
    const deadline2 = Math.floor(Date.now() / 1000) + oneMonth;

    const tx2 = await factory.createIntuitionMetricsMarket(
      0, // MetricType.ATOMS_COUNT
      0, // ComparisonType.ABOVE_THRESHOLD
      atomsTarget,
      0, // No tolerance needed for above threshold
      deadline2,
      "Will Intuition have more than 10k atoms within 1 month?",
      { value: marketLiquidity },
    );

    await tx2.wait();
    console.log("✅ Atoms prediction market created, tx:", tx2.hash);
  } catch (error) {
    console.log("⚠️ Could not create example markets:", error);
  }

  // ===== DEPLOYMENT SUMMARY =====

  console.log("\n" + "=".repeat(60));
  console.log("🎉 PREDICTRUST SYSTEM DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("📡 TTrust Price Oracle:", ttustPriceOracle.address);
  console.log("📊 Intuition Metrics Oracle:", intuitionMetricsOracle.address);
  console.log("🏭 Prediction Factory:", predictionFactory.address);
  console.log("=".repeat(60));

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Set up off-chain oracle updaters to feed price/metrics data");
  console.log("2. Update the frontend to use the new factory contract");
  console.log("3. Users can now create TTrust and Intuition metrics predictions!");
  console.log("4. Monitor oracle data freshness and update regularly");

  console.log("\n📋 ORACLE UPDATE COMMANDS:");
  console.log("- Update TTrust price: ttustOracle.updatePrice(newPrice, newMarketCap)");
  console.log("- Update metrics: metricsOracle.updateAllMetrics(atoms, triplets, signals)");

  console.log("\n🎯 FACTORY USAGE:");
  console.log("- Create TTrust market: factory.createTTrustMarket(...)");
  console.log("- Create metrics market: factory.createIntuitionMetricsMarket(...)");
  console.log("- View all markets: factory.getActiveMarkets(0, 10)");
};

export default deployPredictionSystem;

deployPredictionSystem.tags = ["PredictionSystem", "TTrustOracle", "MetricsOracle", "Factory"];
