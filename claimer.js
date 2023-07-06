const ethers = require("ethers");
const { CONTRACTS } = require("./constants/contracts.js");
// const { CONTRACTS, PROVIDERS, SIGNER, ABI } = require("./constants/index")
const { PROVIDERS, SIGNER } = require("./constants/providers.js");
const { ADDRESS } = require("./constants/address.js");
const { ABI } = require("./constants/abi.js");
const { CONFIG } = require("./constants/config.js");
const { FetchApiPrizes } = require("./functions/fetchApiPrizes.js");
const { GetWinners } = require("./functions/winners.js")
const { GetRecentClaims } = require("./functions/getRecentClaims.js")
const { SendClaims } = require("./functions/sendClaims.js")
const chalk = require("chalk");
const { GetPrizePoolData } = require("./functions/getPrizePoolData.js");

// covalent, not accurate to get twab players
// const FetchPlayers = require("./utilities/players.js");

// todo insufficient gas to make claims error.reason *insufficient funds*

const section = chalk.hex("#47FDFB");

const claimerContract = new ethers.Contract(
  ADDRESS[CONFIG.CHAINNAME].CLAIMER,
  ABI.CLAIMER,
  SIGNER
);

async function go() {
  console.log(section("----- starting claim bot ------"));
  console.log("fetching recent claim events");

  let claims = await GetRecentClaims();
  console.log("got " + claims.length + " claim events ");
  let allVaultWins = [];
  console.log("");
  console.log(section("----- calling contract data ------"));
  const {lastDrawId, numberOfTiers, tierTimestamps, prizesForTier, maxFee} = await GetPrizePoolData()
  console.log("");
  // console.log("prizes for Tier ",prizesForTier)

  let newWinners;
  console.log(section("----- getting winners -----"));

  if (!CONFIG.USEAPI) {
  
    // await SendClaims(claimerContract, lastDrawId, []);

    newWinners = await GetWinners(
      CONFIG.CHAINNAME,
      numberOfTiers,
      lastDrawId,
      tierTimestamps,
      CONFIG.TIERSTOCLAIM,
      prizesForTier,
      "latest"
    );
  }

  else {
    console.log("using api for winner calculations");
    newWinners = await FetchApiPrizes(
      CONFIG.CHAINID,
      lastDrawId,
      CONFIG.TIERSTOCLAIM,
      claims
    );
  }
  console.log("winners before removing claims", newWinners.length);
  newWinners = removeAlreadyClaimed(newWinners, claims, lastDrawId);
  console.log("winners after removing claims", newWinners.length);

  console.log(section("---- sending claims -----"));

  await SendClaims(claimerContract, lastDrawId, newWinners);

  // } else {
  //   console.log("no prizes to claim");
  // }
}

function removeAlreadyClaimed(winsToClaim, claims, draw) {

  const filteredWinsToClaim = winsToClaim.filter((win) => {
    const [v, p, t] = win;
    return !claims.some(
      (claim) =>
        claim.drawId.toString() === draw.toString() &&
        claim.vault.toLowerCase() === v &&
        claim.winner.toLowerCase() === p &&
        claim.tier === t
    );
  });
  return filteredWinsToClaim;
}

go();
