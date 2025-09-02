const { ethers } = require("hardhat");

async function main() {
    const marketAddress = "0x212f6ce7E3D05d892Fe427625267159639f99385"; // Votre marché complet
    
    console.log("🔍 Debugging market at:", marketAddress);
    
    // Get the SimpleNativeMarket contract
    const SimpleNativeMarket = await ethers.getContractFactory("SimpleNativeMarket");
    const market = SimpleNativeMarket.attach(marketAddress);
    
    try {
        console.log("📊 Reading market data...");
        
        // Test getMarketInfo
        const marketInfo = await market.getMarketInfo();
        console.log("✅ Market Info:", {
            title: marketInfo[0],
            question: marketInfo[1], 
            targetValue: ethers.formatEther(marketInfo[2]),
            deadline: new Date(Number(marketInfo[3]) * 1000).toISOString(),
            yesPool: ethers.formatEther(marketInfo[4]),
            noPool: ethers.formatEther(marketInfo[5]),
            resolved: marketInfo[6],
            targetReached: marketInfo[7]
        });
        
        // Test individual functions
        const yesPool = await market.yesPool();
        const noPool = await market.noPool();
        const yesPrice = await market.getYesPrice();
        const noPrice = await market.getNoPrice();
        
        console.log("💰 Pool Data:");
        console.log("  YES Pool:", ethers.formatEther(yesPool), "TTRUST");
        console.log("  NO Pool:", ethers.formatEther(noPool), "TTRUST");
        console.log("  Total Pool:", ethers.formatEther(yesPool + noPool), "TTRUST");
        
        console.log("💱 Price Data:");
        console.log("  YES Price:", ethers.formatEther(yesPrice), "TTRUST");
        console.log("  NO Price:", ethers.formatEther(noPrice), "TTRUST");
        
    } catch (error) {
        console.error("❌ Error reading market data:", error.message);
        console.log("🔧 This might help debug the issue");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });