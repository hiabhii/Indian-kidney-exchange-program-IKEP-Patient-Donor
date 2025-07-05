const hre = require("hardhat");

async function main() {
  const IKEP = await hre.ethers.getContractFactory("IKEP_SingleMatch");
  const ikep = await IKEP.deploy();
  await ikep.waitForDeployment();

  console.log("IKEP_SingleMatch deployed to:", ikep.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});