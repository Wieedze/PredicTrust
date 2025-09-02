import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Deploy PredicTrust System using native TTRUST on Intuition testnet
 */
const deployNativePredicTrustSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const accounts = await hre.ethers.getSigners();
  const deployerAccount = accounts[0];

  console.log("🚀 Deploying Native TTRUST PredicTrust System on Intuition Testnet...");
  console.log("🏭 Deployer:", deployerAccount.address);
  console.log(
    "💰 Deployer Balance:",
    ethers.formatEther(await hre.ethers.provider.getBalance(deployerAccount.address)),
    "TTRUST",
  );

  // ===== DEPLOY ORACLE =====

  console.log("\\n📡 Deploying Oracle...");

  // Deploy TTrust Price Oracle (reuse existing one if available)
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

  // ===== DEPLOY NATIVE FACTORY =====

  console.log("\\n🏭 Deploying Native Prediction Factory...");

  const nativeFactory = await deploy("PredictionFactoryNative", {
    from: deployer,
    args: [deployerAccount.address, ttustPriceOracle.address],
    log: true,
    autoMine: true,
  });

  console.log("✅ Native Prediction Factory deployed to:", nativeFactory.address);

  // ===== SETUP CONFIGURATION =====

  console.log("\\n⚙️ Setting up system configuration...");

  try {
    // Get deployed contracts
    const ttustOracle = await hre.ethers.getContract("TTrustPriceOracle", deployer);

    // Set factory as trusted updater for oracle
    console.log("🔐 Setting up oracle permissions...");

    const tx1 = await ttustOracle.setTrustedUpdater(nativeFactory.address, true);
    await tx1.wait();
    console.log("✅ TTrust Oracle: Native Factory set as trusted updater");
  } catch (error) {
    console.log("⚠️ Could not complete setup:", error);
  }

  // ===== DEPLOYMENT SUMMARY =====

  console.log("\\n" + "=".repeat(60));
  console.log("🎉 NATIVE TTRUST PREDICTRUST SYSTEM DEPLOYED!");
  console.log("=".repeat(60));
  console.log("📡 TTrust Price Oracle:", ttustPriceOracle.address);
  console.log("🏭 Native Factory:", nativeFactory.address);
  console.log("=".repeat(60));

  console.log("\\n💡 NEXT STEPS:");
  console.log("1. Update frontend to use PredictionFactoryNative");
  console.log("2. Markets now use native TTRUST (no ERC20 approvals needed)");
  console.log("3. Send TTRUST directly with createTTrustMarket() call");

  console.log("\\n📋 NATIVE FACTORY USAGE:");
  console.log("- Create market: factory.createTTrustMarket(...) {value: ttrust_amount}");
  console.log("- No approve() needed - just send TTRUST directly!");
  console.log("- View markets: factory.getActiveMarkets(0, 10)");

  console.log("\\n🔄 ORACLE COMMANDS:");
  console.log("- Update price: ttustOracle.updatePrice(newPrice, newMarketCap)");
};

export default deployNativePredicTrustSystem;

deployNativePredicTrustSystem.tags = ["NativeSystem", "NativeFactory", "TTrustOracle"];
