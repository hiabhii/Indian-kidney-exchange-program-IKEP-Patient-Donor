require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Load and validate environment variables
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!ALCHEMY_API_KEY) {
  console.warn("⚠️ ALCHEMY_API_KEY is not set in your .env file");
}

if (!PRIVATE_KEY) {
  console.warn("⚠️ PRIVATE_KEY is not set in your .env file");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    sepolia: {
      url: ALCHEMY_API_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};