const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const crowdFunding = await hre.ethers.deployContract("CrowdFunding");
  await crowdFunding.waitForDeployment();

  const address = await crowdFunding.getAddress();
  console.log("CrowdFunding deployed to:", address);

  fs.writeFileSync(
    path.resolve("src/contracts/contract-address.ts"),
    `export const CONTRACT_ADDRESS = "${address}";`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
