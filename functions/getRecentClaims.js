
const {ADDRESS} = require("../constants/address")
const {PROVIDERS} = require("../constants/providers")
const {CONFIG} = require("../constants/config")
const {CONTRACTS} = require("../constants/contracts")

const GetRecentClaims = async () => {
    const claimFilter = {
      address: ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
      topics: [
        "0x4c22960d5c92fd5abcee7762692477f35a74c37afc6ba5b8b758473b689e2519",
      ],
      fromBlock: -200000,
      toBlock: "latest",
    };
  
    const claimLogs = await PROVIDERS[CONFIG.CHAINNAME].getLogs(
      claimFilter,
      -20000,
      "latest"
    );
  
    const decodedClaimLogs = claimLogs.map((claim, index) => {
      const decodedLog =
        CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].interface.parseLog(claim);
      return {
        drawId: decodedLog.args.drawId,
        vault: decodedLog.args.vault,
        winner: decodedLog.args.winner,
        tier: decodedLog.args.tier,
      };
    });
  
    return decodedClaimLogs;
  }
  module.exports = {GetRecentClaims}