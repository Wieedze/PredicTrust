import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Déploie le système complet PredicTrust sur Intuition testnet
 */
const deployPredicTrustSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const accounts = await hre.ethers.getSigners();
  const deployerAccount = accounts[0];

  console.log("🚀 Deploying PredicTrust System on Intuition Testnet...");
  console.log("🏭 Deployer:", deployerAccount.address);
  console.log(
    "💰 Deployer Balance:",
    ethers.formatEther(await hre.ethers.provider.getBalance(deployerAccount.address)),
    "TRUST",
  );

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

  // Note: IntuitionMetricsOracle removed to focus on TTrust markets only

  // ===== DEPLOY MOCK TTRUST TOKEN (for testing) =====

  console.log("\n🪙 Deploying Mock TTrust Token for testing...");

  const mockTTrustToken = await deploy("MockTTrustToken", {
    from: deployer,
    args: ["TTrust Token", "TTRUST", ethers.parseEther("1000000")], // 1M tokens initial supply
    log: true,
    autoMine: true,
  });

  console.log("✅ Mock TTrust Token deployed to:", mockTTrustToken.address);

  // ===== DEPLOY FACTORY =====

  console.log("\n🏭 Deploying Prediction Factory...");

  const predictionFactory = await deploy("PredictionFactoryTTrustSimple", {
    from: deployer,
    args: [deployerAccount.address, mockTTrustToken.address, ttustPriceOracle.address],
    log: true,
    autoMine: true,
  });

  console.log("✅ Prediction Factory deployed to:", predictionFactory.address);

  // ===== SETUP AND CONFIGURATION =====

  console.log("\n⚙️ Setting up system configuration...");

  try {
    // Get deployed contracts
    const ttustOracle = await hre.ethers.getContract("TTrustPriceOracle", deployer);
    const mockToken = await hre.ethers.getContract("MockTTrustToken", deployer);

    // Set factory as trusted updater for oracles
    console.log("🔐 Setting up oracle permissions...");

    const tx1 = await ttustOracle.setTrustedUpdater(predictionFactory.address, true);
    await tx1.wait();
    console.log("✅ TTrust Oracle: Factory set as trusted updater");

    // Mint some TRUST tokens to deployer for testing
    console.log("💎 Minting test TRUST tokens...");
    const mintAmount = ethers.parseEther("10000"); // 10,000 TRUST for testing
    const tx2 = await mockToken.mint(deployerAccount.address, mintAmount);
    await tx2.wait();
    console.log("✅ Minted", ethers.formatEther(mintAmount), "TRUST tokens to deployer");

    // Approve factory to spend TRUST tokens
    const tx3 = await mockToken.approve(predictionFactory.address, ethers.parseEther("1000"));
    await tx3.wait();
    console.log("✅ Approved 1000 TRUST for factory");
  } catch (error) {
    console.log("⚠️ Could not complete setup:", error);
  }

  // ===== DEPLOYMENT SUMMARY =====

  console.log("\n" + "=".repeat(60));
  console.log("🎉 PREDICTRUST SYSTEM DEPLOYED SUCCESSFULLY ON INTUITION!");
  console.log("=".repeat(60));
  console.log("📡 TTrust Price Oracle:", ttustPriceOracle.address);
  // Note: IntuitionMetricsOracle removed to focus on TTrust markets only
  console.log("🪙 Mock TTrust Token:", mockTTrustToken.address);
  console.log("🏭 Prediction Factory:", predictionFactory.address);
  console.log("=".repeat(60));

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Update frontend with deployed contract addresses");
  console.log("2. Run the example market creation script");
  console.log("3. Set up off-chain oracle updaters for real-time data");
  console.log("4. Users can now create TTrust prediction markets!");

  console.log("\n📋 FACTORY USAGE:");
  console.log("- Create TTrust market: factory.createTTrustMarket(...)");
  console.log("- View all markets: factory.getActiveMarkets(0, 10)");

  console.log("\n🔄 UPDATE COMMANDS:");
  console.log("- Update TTrust price: ttustOracle.updatePrice(newPrice, newMarketCap)");
  console.log("- Update metrics: metricsOracle.updateAllMetrics(txs, blocks, addresses)");
};

export default deployPredicTrustSystem;

deployPredicTrustSystem.tags = ["System", "TTrustOracle", "MetricsOracle", "MockToken", "Factory"];
