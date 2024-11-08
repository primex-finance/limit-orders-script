// SPDX-License-Identifier: BUSL-1.1
const { task } = require("hardhat/config");

task(
  "createLimitOrder",
  "Creates filled limit order then create canBeClosed position in testnet",
  require("./createLimitNetworkTestnets.js"),
)
