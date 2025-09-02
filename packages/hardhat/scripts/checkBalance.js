const { ethers } = require("hardhat");

async function main() {
    // Get the deployed MockTTrustToken contract
    const mockToken = await ethers.getContract("MockTTrustToken");
    
    // Your wallet address
    const walletAddress = "0x0B940A81271aD090AbD2C18d1a5873e5cb93D42a";
    
    // Check balance
    const balance = await mockToken.balanceOf(walletAddress);
    const balanceFormatted = ethers.formatEther(balance);
    
    console.log("🪙 Your TRUST Token Balance:", balanceFormatted, "TRUST");
    
    // Also check how many markets exist
    const factory = await ethers.getContract("PredictionFactoryTTrustSimple");
    const marketCount = await factory.getMarketCount();
    
    console.log("📊 Total Markets Created:", marketCount.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });