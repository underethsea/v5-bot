const { CONTRACTS } = require("./constants/contracts.js");
const { PROVIDERS } = require("./constants/providers.js");
const { ADDRESS } = require("./constants/address.js");
const { ABI } = require("./constants/abi.js");
const { CONFIG } = require("./constants/config.js");
const FetchPlayers = require("./utilities/players.js");

const ethers = require("ethers");
const {Multicall} = require("./utilities/multicall.js")

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// empty array claims all tiers
const tiersToClaim = [];
// max prizes to claim per tx to avoid overflowing blocks
const maxClaimsPerTx = 10;

const wally = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  PROVIDERS[CONFIG.CHAINNAME]
);
const signer = wally.connect(PROVIDERS[CONFIG.CHAINNAME]);
const claimerContract = new ethers.Contract(
  ADDRESS[CONFIG.CHAINNAME].CLAIMER,
  ABI.CLAIMER,
  signer
);

// todo work on chains
// todo twab player list

async function getRecentClaims() {
  const claimFilter = {
    address: ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
    topics: [
      "0x10594a72847a0979bcd5ad633b4a6bfb522d9df90aa4059e807b3044d60e5a12",
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

async function getWinners(
  chainId,
  prizePool,
  vault,
  numberOfTiers,
  drawId,
  claims,
) {
  drawId = parseInt(drawId);
  let winsPerTier = new Array(numberOfTiers + 1).fill(0);
  let claimData = [];
  const players = await FetchPlayers(chainId, vault);
  console.log("players ", players.length);

  const batchSize = 30;
  const calls = [];
  const results = [];

  for (let x = 0; x < players.length; x++) {
    const playerAddress = players[x].address;

    for (let y = 0; y < numberOfTiers + 1; y++) {
      if (tiersToClaim.length === 0 || tiersToClaim.includes(y)) {
        const call = CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].isWinner(
          vault,
          playerAddress,
          y
        );
        calls.push({
          vault,
          playerAddress,
          y,
          call,
        });

        if (calls.length === batchSize) {
          const contractCalls = calls.map((callObj) => callObj.call);
          const batchResults = await Multicall(contractCalls);

          for (let i = 0; i < calls.length; i++) {
            const { vault, playerAddress, y } = calls[i];
            const didWin = batchResults[i];

            results.push({
              vault,
              playerAddress,
              y,
              didWin,
            });

            if (didWin) {
              winsPerTier[y]++;
              let winLog = playerAddress + " won tier " + y;

              if (
                claims.find(
                  (claim) =>
                    claim.vault.toLowerCase() === vault.toLowerCase() &&
                    claim.drawId === drawId &&
                    claim.tier === y &&
                    claim.winner.toLowerCase() === playerAddress.toLowerCase()
                )
              ) {
                console.log(winLog + " claimed");
              } else {
                console.log(winLog);
                claimData.push([vault, playerAddress, y]);
              }
            }
          }

          calls.length = 0; // Reset the calls array for the next batch
        }
      }
    }
  }

  if (calls.length > 0) {
    const contractCalls = calls.map((callObj) => callObj.call);
    const remainingResults = await Multicall(contractCalls);

    for (let i = 0; i < calls.length; i++) {
      const { vault, playerAddress, y } = calls[i];
      const didWin = remainingResults[i];

      results.push({
        vault,
        playerAddress,
        y,
        didWin,
      });

      if (didWin) {
        winsPerTier[y]++;
        let winLog = playerAddress + " won tier " + y;

        if (
          claims.find(
            (claim) =>
              claim.vault.toLowerCase() === vault.toLowerCase() &&
              claim.drawId === drawId &&
              claim.tier === y &&
              claim.winner.toLowerCase() === playerAddress.toLowerCase()
          )
        ) {
          console.log(winLog + " claimed");
        } else {
          console.log(winLog);
          claimData.push([vault, playerAddress, y]);
        }
      }
    }
  }

  console.log("wins per tier ", winsPerTier);
  return claimData;
}

const calculateTierFrequency = (t, n, g) => {
  const e = Math.E;
  const odds = e ** ((t - n + 1) * Math.log(1 / g)) / (1 - n);
  return odds;
};


async function go() {
  console.log("go")
  let claims = await getRecentClaims();
  console.log("got " + claims.length + " claim events ");
  console.log("going");
  let allVaultWins = [];

  let maxFee,
    lastCompletedDrawStartedAt,
    drawPeriodSeconds,
    lastDrawId,
    numberOfTiers,
    grandPrizePeriod,
    prizePoolPOOLBalance,
    accountedBalance,
    reserve;
  try {
    [
      maxFee,
      lastCompletedDrawStartedAt,
      drawPeriodSeconds,
      lastDrawId,
      numberOfTiers,
      grandPrizePeriod,
      prizePoolPOOLBalance,
      accountedBalance,
      reserve,
    ] = await Promise.all([
      CONTRACTS.CLAIMER[CONFIG.CHAINNAME].computeMaxFee(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].lastCompletedDrawStartedAt(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawPeriodSeconds(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getLastCompletedDrawId(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].numberOfTiers(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].grandPrizePeriodDraws(),
      CONTRACTS.POOL[CONFIG.CHAINNAME].balanceOf(
        ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL
      ),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].accountedBalance(),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].reserve(),
    ]);

    // do something with the results
  } catch (error) {
    console.log("Error fetching data:", error);
  }
  lastCompletedDrawStartedAt = parseInt(lastCompletedDrawStartedAt);
  console.log("draw started ", lastCompletedDrawStartedAt);
  console.log("prize period in seconds ", drawPeriodSeconds);
  console.log("tiers ", numberOfTiers + 1);

  console.log(
    "prize pool POOL balance ",
    (prizePoolPOOLBalance / 1e18).toFixed(2)
  );
  console.log("accounted balance ", (accountedBalance / 1e18).toFixed(2));
  console.log("reserve ", (reserve / 1e18).toFixed(2));

  const now = Math.floor(Date.now() / 1000); // convert current time to seconds

  const timeSinceLastDrawStarted =
    now - lastCompletedDrawStartedAt - drawPeriodSeconds;
  const timeUntilNextDraw = drawPeriodSeconds - timeSinceLastDrawStarted;

  console.log(
    `Time since last draw started: ${Math.round(
      timeSinceLastDrawStarted / 60
    )} minutes`
  );
  console.log(
    `Time until next draw: ${Math.round(timeUntilNextDraw / 60)} minutes`
  );

  console.log("max claim fee ", maxFee / 1e18);
  console.log("completed draw id", lastDrawId.toString());
  let tierPrizeValues = [];
  for (q = 0; q <= numberOfTiers; q++) {
    let tierFrequency = Math.abs(
      calculateTierFrequency(q, numberOfTiers, grandPrizePeriod)
    );
    let frequency = "";
    if (tierFrequency < 1) {
      frequency = 1 / tierFrequency + " times per draw";
    } else {
      frequency = "once every " + tierFrequency + " draws";
    }
    const tierValue = await CONTRACTS.PRIZEPOOL[
      CONFIG.CHAINNAME
    ].calculatePrizeSize(q);
    tierPrizeValues.push(tierValue);
    console.log(
      "tier ",
      q,
      "  value ",
      parseFloat(tierValue) / 1e18,
      " expected frequency ",
      frequency
    );
  }

  for (z = 0; z < ADDRESS[CONFIG.CHAINNAME].VAULTS.length; z++) {
    console.log("vault ", ADDRESS[CONFIG.CHAINNAME].VAULTS[z].VAULT);
    let newWinners = await getWinners(
      CONFIG.CHAINID,
      ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
      ADDRESS[CONFIG.CHAINNAME].VAULTS[z].VAULT,
      numberOfTiers,
      lastDrawId,
      claims
    );
    allVaultWins = allVaultWins.concat(newWinners);
  }

  //   console.log("all vault wins", allVaultWins);
  // ("submitting claims to get fee estimate...");
  // let encodedClaims = ethers.utils.defaultAbiCoder.encode(
  //   ["tuple(address vault, address winner, uint8 tier)[]"],
  //   [allVaultWins]
  // );
  // console.log(encodedClaims);
  //   console.log(encodedClaimData)
  // let feeEstimate = await CONTRACTS.CLAIMER[CONFIG.CHAINNAME].callStatic.claimPrizes(
  //   lastDrawId,
  //   allVaultWins.slice(0,4),
  //   CONFIG.WALLET
  // );
  // let estimateGas = await CONTRACTS.CLAIMER[CONFIG.CHAINNAME].estimateGas.claimPrizes(
  //   lastDrawId,
  //   allVaultWins.slice(0,4),
  //   CONFIG.WALLET
  // );
  // console.log("gas estimate ", estimateGas.toString());
  // console.log(feeEstimate[0].toString());
  // console.log("estimate claims to count", feeEstimate.claimCount.toString());
  // console.log("estimate fee", parseInt(feeEstimate.totalFees) / 1e18);
  // if (feeEstimate.claimCount > 0) {

  // let sendClaim = await claimerContract.claimPrizes(
  //   lastDrawId,
  //   allVaultWins.slice(0,4),
  //   CONFIG.WALLET
  // );
  await sendClaims(claimerContract, lastDrawId, allVaultWins);

  // } else {
  //   console.log("no prizes to claim");
  // }
}

const sendClaims = async (contract, drawId, vaultWins) => {
  console.log("total wins to claim ", vaultWins.length);

  const totalClaims = vaultWins.length;
  let claimsSent = 0;

  while (claimsSent < totalClaims) {
    const remainingClaims = totalClaims - claimsSent;
    const claimsToSend = Math.min(maxClaimsPerTx, remainingClaims);
    const batch = vaultWins.slice(claimsSent, claimsSent + claimsToSend);
    console.log("claiming this batch of ", batch.length);

    let feeEstimate = await CONTRACTS.CLAIMER[
      CONFIG.CHAINNAME
    ].callStatic.claimPrizes(drawId, batch, CONFIG.WALLET);
    let estimateGas = await CONTRACTS.CLAIMER[
      CONFIG.CHAINNAME
    ].estimateGas.claimPrizes(drawId, batch, CONFIG.WALLET);
    console.log("gas estimate ", estimateGas.toString());
    console.log("estimate claims to count", feeEstimate.claimCount.toString());
    console.log("estimate fee ", parseInt(feeEstimate.totalFees) / 1e18);
    if (feeEstimate.claimCount > 0) {
      const sendClaim = await contract.claimPrizes(
        drawId,
        batch,
        CONFIG.WALLET
      );
      console.log(`Sent ${claimsToSend} claims`);

      let receipt = await sendClaim.wait();
      // console.log("receipt ", receipt);
      if (receipt.gasUsed) {
        console.log("tx hash ", receipt?.transactionHash);
        console.log("gas used ", receipt?.gasUsed.toString());

        // console.log("gas used cumulative ",receipt?.cumulativeGasUsed.toString())
        console.log("gas price", receipt?.effectiveGasPrice.toString());
      }
      claimsSent += claimsToSend;
      if (claimsSent < totalClaims) {
        console.log("Waiting for the next block...");
        await delay(10000); // Wait for a new block, adjust the delay as needed
      }
    }
  }

  console.log("All claims sent!");
};
go();
