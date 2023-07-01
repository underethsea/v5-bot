const ethers = require("ethers");
const { ABI } = require("./abi.js");
const { ADDRESS } = require("./address.js");
const { PROVIDERS, SIGNER } = require("./providers.js");
const { CONFIG } = require("./config.js");

console.log("chain",CONFIG.CHAINNAME)

const CONTRACTS = {
  CLAIMER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].CLAIMER,
      ABI.CLAIMER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  VAULTS: {
    [CONFIG.CHAINNAME]: ADDRESS[CONFIG.CHAINNAME].VAULTS.map((vault) => ({
      LIQUIDATIONPAIR: new ethers.Contract(
        vault.LIQUIDATIONPAIR,
        ABI.LIQUIDATIONPAIR,
        PROVIDERS[CONFIG.CHAINNAME]
      ),
      VAULT: new ethers.Contract(
        vault.VAULT,
        ABI.VAULT,
        PROVIDERS[CONFIG.CHAINNAME]
      )
    })),
  },
  LIQUIDATIONROUTER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].LIQUIDATIONROUTER,
      ABI.LIQUIDATIONROUTER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  POOL: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].POOL,
      ABI.POOL,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  TOKENFAUCET: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].TOKENFAUCET,
      ABI.TOKENFAUCET,
      SIGNER
    ),
  },
  PRIZEPOOL: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
      ABI.PRIZEPOOL,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  POOLWITHSIGNER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].POOL,
      ABI.POOL,
      SIGNER
    ),
  },
  LIQUIDATIONROUTERSIGNER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].LIQUIDATIONROUTER,
      ABI.LIQUIDATIONROUTER,
      SIGNER
    ),}
};

module.exports = { CONTRACTS };
