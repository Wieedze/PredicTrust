const fs = require('fs');
const path = require('path');

async function main() {
    // Read SimpleNativeMarket artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/SimpleNativeMarket.sol/SimpleNativeMarket.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Read current deployedContracts.ts
    const deployedContractsPath = path.join(__dirname, '../../nextjs/contracts/deployedContracts.ts');
    let deployedContracts = fs.readFileSync(deployedContractsPath, 'utf8');
    
    // Check if SimpleNativeMarket already exists
    if (deployedContracts.includes('SimpleNativeMarket')) {
        console.log('SimpleNativeMarket already exists in deployedContracts.ts');
        return;
    }
    
    // Add SimpleNativeMarket to the contracts
    const simpleNativeMarketContract = `    SimpleNativeMarket: {
      address: "0x0000000000000000000000000000000000000000", // Deployed dynamically by factory
      abi: ${JSON.stringify(artifact.abi, null, 8)},
    },`;
    
    // Insert before the last closing brace of the chain object
    const chainEndPattern = /(\s+),\s+} as const satisfies GenericContractsDeclaration;/;
    deployedContracts = deployedContracts.replace(chainEndPattern, `,
${simpleNativeMarketContract}$1,
  } as const satisfies GenericContractsDeclaration;`);
    
    // Write back to file
    fs.writeFileSync(deployedContractsPath, deployedContracts);
    console.log('✅ SimpleNativeMarket ABI added to deployedContracts.ts');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });