const axios = require("axios");
const { CONFIG } = require("../constants/config");
const { ADDRESS } = require("../constants/address");

async function makeGraphQlQuery(
  subgraphURL,
  _ticket,
  drawStartTime,
  drawEndTime
) {
  const maxPageSize = 900;
  let lastId = "";

  let data;
  let results = [];

  while (true) {
    const queryString = `{
        accounts(first: ${maxPageSize}, where: { id_gt: "${lastId}" }) {
          id
          delegateBalance

          beforeOrAtDrawStartTime: twabs(
            orderBy: timestamp
            orderDirection: desc
            first: 1
            where: { timestamp_lte: ${drawStartTime} }
          ) {
            amount
            delegateBalance
          }

          beforeOrAtDrawEndTime: twabs(
            orderBy: timestamp
            orderDirection: desc
            first: 1
            where: { timestamp_lte: ${drawEndTime} }
          ) {
            amount
            delegateBalance
          }
        }
      }
    `;

    try {
      const response = await axios.post(subgraphURL, { query: queryString });
      data = response.data;
    } catch (error) {
      console.error("GraphQL query error:", error);
      break;
    }

    // console.log(data);
    results.push(...data.data.accounts);

    const numberOfResults = data.data.accounts.length;
    if (numberOfResults < maxPageSize) {
      // We have retrieved all the results
      break;
    }

    lastId = data.data.accounts[data.data.accounts.length - 1].id;
  }
  return results;
}

async function GetTwabPlayers(startTimestamp, endTimestamp) {
  const poolers = await makeGraphQlQuery(
    ADDRESS[CONFIG.CHAINNAME].TWABSUBGRAPH,
    ADDRESS[CONFIG.CHAINNAME].TWABCONTROLLER,
    startTimestamp,
    endTimestamp
  );

  const addressesByVault = {};
const allPoolers = []
  poolers.forEach((pooler) => {
    const vault = pooler.id.split("-")[0];
    const address = pooler.id.split("-")[1];


    allPoolers.push({vault: vault, address: address});
  });
  // console.log("returning ",allPoolers.length," poolers")
  return allPoolers;
}

// GetTwabPlayers("3580234", "3586815");

// module.exports

// async function getRecentDraws() {
//   const claimFilter = {
//     address: ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
//     topics: [
//       "0x10594a72847a0979bcd5ad633b4a6bfb522d9df90aa4059e807b3044d60e5a12",
//     ],
//     fromBlock: -200000,
//     toBlock: "latest",
//   };

//   const claimLogs = await PROVIDERS[CONFIG.CHAINNAME].getLogs(
//     claimFilter,
//     -20000,
//     "latest"
//   );

//   const decodedClaimLogs = claimLogs.map((claim, index) => {
//     const decodedLog =
//       CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].interface.parseLog(claim);
//     return {
//       drawId: decodedLog.args.drawId,
//       vault: decodedLog.args.vault,
//       winner: decodedLog.args.winner,
//       tier: decodedLog.args.tier,
//     };
//   });}

module.exports = GetTwabPlayers
