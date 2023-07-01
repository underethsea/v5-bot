const { CONFIG } = require("../constants/config");
const { CONTRACTS } = require("../constants/contracts");
const { ADDRESS } = require("../constants/address");
const { Multicall } = require("../utilities/multicall")

const GetPrizePoolData = async (block="latest") => {
  let maxFee,
    lastCompletedDrawStartedAt,
    drawPeriodSeconds,
    lastDrawId,
    numberOfTiers,
    grandPrizePeriod,
    prizePoolPOOLBalance,
    accountedBalance,
    reserve,
    prizesForTier = []
    tierTimestamps = [];
  try {
    [
      // maxFee,
      lastCompletedDrawStartedAt,
      drawPeriodSeconds,
      lastDrawId,
      numberOfTiers,
      grandPrizePeriod,
      prizePoolPOOLBalance,
      accountedBalance,
      reserve,
    ] = await Multicall([
      // CONTRACTS.CLAIMER[CONFIG.CHAINNAME].computeMaxFee({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].lastCompletedDrawStartedAt({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].drawPeriodSeconds({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getLastCompletedDrawId({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].numberOfTiers({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].grandPrizePeriodDraws({blockTag: block}),
      CONTRACTS.POOL[CONFIG.CHAINNAME].balanceOf(
        ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,{blockTag: block}
      ),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].accountedBalance({blockTag: block}),
      CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].reserve({blockTag: block}),
    ]);

    for (let tier = 0; tier < numberOfTiers; tier++) {
      const [startTimestamp, endTimestamp] = await CONTRACTS.PRIZEPOOL[
        CONFIG.CHAINNAME
      ].calculateTierTwabTimestamps(tier,{blockTag: block});
      tierTimestamps[tier] = { startTimestamp, endTimestamp };

      prizesForTier[tier] = await CONTRACTS.PRIZEPOOL[CONFIG.CHAINNAME].getTierPrizeCount(tier)
 
    }
  } catch (error) {
    console.log("Error fetching data:", error);
  }

  lastCompletedDrawStartedAt = parseInt(lastCompletedDrawStartedAt);
  console.log(
    "draw started ",
    lastCompletedDrawStartedAt.toString(),
    " prize period in seconds ",
    drawPeriodSeconds.toString()
  );

  console.log("tiers ", numberOfTiers.toString());

  console.log(
    "prize pool POOL balance ",
    (prizePoolPOOLBalance / 1e18).toFixed(2),
    " accounted balance ",
    (accountedBalance / 1e18).toFixed(2),
    " reserve ",
    (reserve / 1e18).toFixed(2)
  );

  const now = Math.floor(Date.now() / 1000); // convert current time to seconds

  const timeSinceLastDrawStarted =
    now - lastCompletedDrawStartedAt - drawPeriodSeconds;
  const timeUntilNextDraw = drawPeriodSeconds - timeSinceLastDrawStarted;

  console.log(
    `Time since last draw started ${Math.round(
      timeSinceLastDrawStarted / 60
    )} minutes`,
    ` Time until next draw ${Math.round(timeUntilNextDraw / 60)} minutes`
  );
  console.log();

  console.log("max claim fee ", (maxFee / 1e18).toString());
  console.log("completed draw id", lastDrawId.toString());
  console.log("");
  let tierPrizeValues = [];
  for (q = 0; q < numberOfTiers; q++) {

    // is it the tier number or the index of the tier, hmmm dittty.

    let tierFrequency = Math.abs(
      calculateTierFrequency(q+1, numberOfTiers, grandPrizePeriod)
    );
    let frequency = "";
    if (tierFrequency < 1) {
      frequency = 1 / tierFrequency + " times per draw";
    } else {
      frequency = "once every " + tierFrequency + " draws";
    }
    const tierValue = await CONTRACTS.PRIZEPOOL[
      CONFIG.CHAINNAME
    ].getTierPrizeSize(q,{blockTag: block});
    tierPrizeValues.push(tierValue);


    console.log(
      "tier ",
      q,
      "  value ",
      parseFloat(tierValue) / 1e18,
      " expected frequency ",
      frequency,
      " twab time ",
      tierTimestamps[q]?.startTimestamp.toString(),
      " - ",
      tierTimestamps[q]?.endTimestamp.toString()
    );
  }
  console.log("# of prizes for each tier ",prizesForTier)

  return {
    lastDrawId,
    numberOfTiers,
    tierTimestamps,
    lastCompletedDrawStartedAt,
    drawPeriodSeconds,
    grandPrizePeriod,
    tierPrizeValues,
    prizesForTier,
  };
};

const calculateTierFrequency = (t, n, g) => {
  const e = Math.E;
  const odds = e ** ((t - n + 1) * Math.log(1 / g)) / (1 - n);
  return odds;
};

module.exports = { GetPrizePoolData };
