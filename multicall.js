const { ethers } = require("ethers");
const { PROVIDERS } = require("./constants/providers.js");
const { CONFIG } = require("./constants/config.js");
const { MulticallWrapper } = require("ethers-multicall-provider");

async function Multicall(calls) {
  const provider = MulticallWrapper.wrap(PROVIDERS[CONFIG.CHAINNAME]);

  const results = Promise.all(calls);
  return (await results).map((result) => result);
}

module.exports = { Multicall };
