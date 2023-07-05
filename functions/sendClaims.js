const { CONTRACTS } = require("../constants/contracts");
const {PROVIDERS} = require("../constants/providers")
const { CONFIG } = require("../constants/config");
const { GetLogs } = require("../utilities/getLogs");
const { ABI } = require("../constants/abi");
const chalk  = require("chalk")

// Function for logging with red color
const chalkProfit = (message) => {
  console.log(chalk.green(message));
};

// Function for logging with green color
const chalkLoss = (message) => {
  console.log(chalk.red(message));
};

const SendClaims = async (contract, drawId, vaultWins) => {

  let feeRecipient = CONFIG.WALLET
  console.log("total wins to claim ", vaultWins.length);

  const totalClaims = vaultWins.length;
  let claimsSent = 0;

// Group data by vault and tier
const groupedData = vaultWins.reduce((groups, entry) => {
  const vault = entry[0];
  const tier = entry[2];
  const winner = entry[1];
  const prizeIndex = entry[3];

  const key = `${vault}-${tier}`;

  if (!groups[key]) {
    groups[key] = {
      vault,
      tier,
      winners: [],
      prizeIndices: [],
    };
  }

  const group = groups[key];

  const winnerIndex = group.winners.indexOf(winner);
  if (winnerIndex === -1) {
    group.winners.push(winner);
    group.prizeIndices.push(prizeIndex);
  } else {
    group.prizeIndices[winnerIndex].push(prizeIndex);
  }

  return groups;
}, {});

// console.log(groupedData);

for (const key in groupedData) {
  const group = groupedData[key];
  const { vault, tier, winners, prizeIndices } = group;
// console.log(winners)
// console.log(prizeIndices)

let feeEstimate = await CONTRACTS.CLAIMER[
  CONFIG.CHAINNAME
].callStatic.claimPrizes(vault, tier, winners, prizeIndices, feeRecipient);
let estimateGas = await CONTRACTS.CLAIMER[
  CONFIG.CHAINNAME
].estimateGas.claimPrizes(vault, tier, winners, prizeIndices, feeRecipient);
const gasPriceEstimate = PROVIDERS[CONFIG.CHAINNAME].getGasPrice
console.log("gas estimate ", estimateGas.toString()," estimate claim fee", feeEstimate.toString()," gas price ",gasPriceEstimate);
// console.log("estimate fee ", parseInt(feeEstimate.totalFees) / 1e18);
console.log("sending claim on vault ",vault," tier ",tier," winners ",winners.length," indices ",prizeIndices.flat().length)

  let tx = await contract.claimPrizes(vault, tier, winners, prizeIndices, feeRecipient);
  let receipt = await tx.wait()
  // hard coded gas pricing for context
  const ethPrice = 2000
  const gasPrice = 2
  const gasPriceWei = gasPrice * 1e9;
  const transactionCost = receipt.gasUsed * gasPriceWei * ethPrice / 1e18;
  const poolPrice = .69
  console.log("tx", receipt.transactionHash," gas used",receipt.gasUsed.toString(), "$",transactionCost.toFixed(4))
  let totalPayout = 0;
  let totalFee = 0;
  const logs = GetLogs(receipt, ABI.PRIZEPOOL);
  logs.forEach((log) => {
    if (log.name === "ClaimedPrize") {
      const payout = parseInt(log.args.payout);
      const fee = parseInt(log.args.fee);
      totalPayout += payout;
      totalFee += fee;
      console.log("prize payout ", (payout/1e18).toFixed(4), " fee collected ", (fee/1e18).toFixed(4));
    }
  });
  console.log(
    "total payout ",
    (totalPayout/1e18).toFixed(4),
    " total fee collected ",
    (totalFee/1e18).toFixed(4)
  );
  const netFromClaims = (totalFee/1e18)-transactionCost
  const netFromClaimMessage = "$" + (poolPrice *(totalFee/1e18)).toFixed(4) + " fee collected  - $" + 
  transactionCost.toFixed(4) + " tx cost = " + netFromClaims.toFixed(4)
  netFromClaims > 0 ?
  console.log(chalkProfit(netFromClaimMessage)):
  console.log(chalkLoss(netFromClaimMessage))
}
  return

  // const vault = "0x041a898bc37129d2d2232163c3374f4077255f74";
  // const tier = 1;
  // const winners = ["0x55f27eadd6fb3139c9a8ea4214bb6d65a2f4107d"];
  // const prizeIndices = [[1]];
  // const feeRecipient = "0x062bDEdfECFd229cd908371A5683e23224366856";
// console.log("sending 5 indices for  1 pooler, 1 vault, tier 3")
//   let tx = await contract.claimPrizes(vault, tier, winners, prizeIndices, feeRecipient);
//   let receipt = await tx.wait();
//   console.log(receipt)

//   vault = "0x8faf98698e4ff29149a8a9d06db20e3509f3754b" 
//   winners = ["0xd5ba9911bf6e7ff879d10f4875cec5aaf6e76acc","0xb7de3518022a39f1c7eb7fb5a917c00e44a9c919"]
//   tier = 3
//   prizeIndices = [[49,57,38],[21,31]]

//   console.log("sending 5 indices for  2 poolers, 1 vault, tier 3")
//    tx = await contract.claimPrizes(vault, tier, winners, prizeIndices, feeRecipient);
//    receipt = await tx.wait();
//   console.log(receipt)

  while (claimsSent < totalClaims) {
    const remainingClaims = totalClaims - claimsSent;
    const claimsToSend = Math.min(CONFIG.MAXCLAIMS, remainingClaims);
    const batch = vaultWins.slice(claimsSent, claimsSent + claimsToSend);
    console.log("claiming this batch of ", batch.length);
    console.log("batch", batch);
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
        // manual gas override
        // {gasPrice: ethers.utils.parseUnits('100', 'gwei'), gasLimit: 10000000}
      );
      console.log(`Sent ${claimsToSend} claims`);

      let receipt = await sendClaim.wait();
      // console.log("receipt ", receipt);
      if (receipt.gasUsed) {
        console.log("tx hash ", receipt?.transactionHash);
        console.log("gas used ", receipt?.gasUsed.toString());

        // console.log("gas used cumulative ",receipt?.cumulativeGasUsed.toString())
        console.log("gas price", receipt?.effectiveGasPrice.toString());
        let totalPayout = 0;
        let totalFee = 0;
        logs.forEach((log) => {
          if (log.name === "ClaimedPrize") {
            const payout = parseInt(log.args.payout);
            const fee = parseInt(log.args.fee);
            totalPayout += payout;
            totalFee += fee;
            console.log("prize payout ", (payout/1e18).toFixed(4), " fee collected ", (fee/1e18).toFixed(4));
          }
        });
        console.log(
          "total payout ",
          totalPayout,
          " total fee collected ",
          totalFee
        );
      }
      claimsSent += claimsToSend;
      if (claimsSent < totalClaims) {
        console.log("");
        console.log("Waiting for the next block...");
        await delay(CONFIG.TXDELAY); // Wait for a new block, adjust the delay as needed
      }
    }
  }

  console.log("All claims sent!");
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = { SendClaims };
