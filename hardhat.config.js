require("@typechain/hardhat");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-solhint");
require("hardhat-tracer");
require("hardhat-spdx-license-identifier");
require("hardhat-docgen");
require("hardhat-dependency-compiler");
require("@atixlabs/hardhat-time-n-mine");
require("hardhat-local-networks-config-plugin");
require("hardhat-log-remover");
require("@nomiclabs/hardhat-solhint");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");
require("./tasks");
require("dotenv").config();


const keythereum = require("keythereum");

let accounts;
console.log(process.env.PRIVATE_KEY)
if (process.env.ADDRESS && process.env.KEYSTORE_DIR && process.env.PASSWORD) {
  const keyObject = keythereum.importFromFile(process.env.ADDRESS, process.env.KEYSTORE_DIR);
  accounts = ["0x" + keythereum.recover(process.env.PASSWORD, keyObject).toString("Hex")];
} else if (process.env.PRIVATE_KEY) {
  accounts = [process.env.PRIVATE_KEY];
  if (process.env.PRIVATE_KEY_EPMX) accounts.push(process.env.PRIVATE_KEY_EPMX);
} else {
  accounts = { mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk" };
}

console.log(accounts)




/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/40c89f9eb3aa45869f6717b0a33ea733",
      accounts: accounts,
      saveDeployments: true,
      gasPrice: 100e9,
      timeout: 60000
    },
  },
  dependencyCompiler: {
    paths: ["@openzeppelin/contracts/token/ERC20/IERC20.sol"],
    keep: true,
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/@openzeppelin/contracts/build/contracts",
      }
    ],
  },
};
