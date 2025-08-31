import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

/**
 * Deploys TTrust-based prediction market contracts
 * Includes TTrust token, price oracle, and factory contracts
 */
const deployTTrustContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Use different Hardhat accounts for testing roles
  const accounts = await hre.ethers.getSigners();
  const deployerAccount = accounts[0]; // Deployer (account 0)
  const oracleAccount = accounts[1]; // Oracle (account 1)
  const liquidityProviderAccount = accounts[2] || accounts[0]; // LP (account 2 or 0 by default)

  console.log("📋 TTrust Contract Deployment Configuration:");
  console.log("🏭 Deployer:", deployerAccount.address);
  console.log("💧 Liquidity Provider:", liquidityProviderAccount.address);
  console.log("🔮 Oracle:", oracleAccount.address);

  // 1. Deploy Mock TTrust Token (for testing)
  console.log("\n🪙 Deploying Mock TTrust Token...");
  const mockTTrust = await deploy("MockTTrustToken", {
    from: deployer,
    args: ["TTrust", "TTRUST", ethers.parseEther("1000000")], // 1M tokens initial supply
    log: true,
    autoMine: true,
  });

  // 2. Deploy TTrust Price Oracle
  console.log("\n🔮 Deploying TTrust Price Oracle...");
  const priceOracle = await deploy("TTrustPriceOracle", {
    from: deployer,
    args: [
      ethers.parseEther("0.52"), // Initial price: $0.52
      ethers.parseEther("520000"), // Initial market cap: $520,000
      oracleAccount.address, // Oracle admin
    ],
    log: true,
    autoMine: true,
  });

  // 3. Deploy Intuition Metrics Oracle
  console.log("\n📊 Deploying Intuition Metrics Oracle...");
  const metricsOracle = await deploy("IntuitionMetricsOracle", {
    from: deployer,
    args: [
      12847, // Initial atoms count
      8934, // Initial triplets count
      5621, // Initial signals count
      oracleAccount.address, // Oracle admin
    ],
    log: true,
    autoMine: true,
  });

  // 4. Deploy TTrust Prediction Factory
  console.log("\n🏭 Deploying TTrust Prediction Factory...");
  const factory = await deploy("PredictionFactoryTTrust", {
    from: deployer,
    args: [
      mockTTrust.address,
      priceOracle.address,
      metricsOracle.address,
      ethers.parseEther("0.001"), // Creation fee: 0.001 TTRUST
      liquidityProviderAccount.address, // Default LP
    ],
    log: true,
    autoMine: true,
  });

  console.log("\n✅ TTrust Contracts Deployed Successfully!");
  console.log("🪙 Mock TTrust Token:", mockTTrust.address);
  console.log("🔮 TTrust Price Oracle:", priceOracle.address);
  console.log("📊 Intuition Metrics Oracle:", metricsOracle.address);
  console.log("🏭 Prediction Factory:", factory.address);

  // 5. Initialize some test data and approve tokens
  console.log("\n🔧 Setting up test environment...");

  try {
    // Get contract instances
    const ttrustToken = await hre.ethers.getContract("MockTTrustToken", deployer);
    await hre.ethers.getContract("PredictionFactoryTTrust", deployer);

    // Transfer some TTrust tokens to liquidity provider
    const transferAmount = ethers.parseEther("10000"); // 10K TTrust
    await ttrustToken.transfer(liquidityProviderAccount.address, transferAmount);
    console.log(`💰 Transferred ${ethers.formatEther(transferAmount)} TTRUST to LP`);

    // Transfer some tokens to deployer for testing
    await ttrustToken.transfer(deployerAccount.address, transferAmount);
    console.log(`💰 Transferred ${ethers.formatEther(transferAmount)} TTRUST to deployer for testing`);

    // Approve factory to spend tokens for creating markets
    await ttrustToken.connect(liquidityProviderAccount).approve(factory.address, ethers.parseEther("1000"));
    console.log("✅ LP approved factory to spend TTRUST");

    await ttrustToken.connect(deployerAccount).approve(factory.address, ethers.parseEther("1000"));
    console.log("✅ Deployer approved factory to spend TTRUST");

    console.log("\n🎉 Test environment setup completed!");
  } catch (error) {
    console.error("❌ Error setting up test environment:", error);
  }
};

export default deployTTrustContracts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployTTrustContracts.tags = ["TTrustContracts"];
