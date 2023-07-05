const { DB } = require("./dbConnection");

async function AddDraw(
  network,
  draw,
  startedAt,
  periodSeconds,
  tiers,
  grandPrizePeriod,
  tierValues,
  prizesForTier
) {
  try {

    // does not check that tiers are exactly the same, just looking for player already winning that draw on that vault
    const checkForDrawQuery =
      "SELECT * FROM draws WHERE network = $1 and draw = $2";

    let checkingForDraw = [];
    try {
      checkingForDraw = await DB.any(checkForDrawQuery, [network.toString(), draw]);
      if (checkingForDraw.length > 0) {
        console.log("duplicate draw='" + draw + "'  and network='" + network);
        return "Draw already in db";
      }
    } catch (error) {
      checkingForDraw = [];
    }

    const startedAtTimestamp = new Date(startedAt * 1000);

    const addDrawQuery =
      "INSERT INTO draws (network,draw,startedAt,periodSeconds,tiers,grandPrizePeriod, tierValues, prizeIndices) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    console.log("add draw query ", addDrawQuery);
    await DB.any(addDrawQuery, [
      network,
      draw,
      startedAtTimestamp,
      periodSeconds,
      tiers,
      grandPrizePeriod,
      tierValues,
      prizesForTier
    ]);

    return "Win added";
  } catch (error) {
    console.log(error);
    return "Could not add draw";
  }
}
async function AddWin(network, draw, vault, pooler, tier, indices) {

    console.log("adddding ",network, draw, vault, pooler, tier, indices)
    
  try {
    // does not check that tiers are exactly the same, just looking for player already winning that draw on that vault
    const checkForWinQuery =
      "SELECT * FROM wins WHERE network = $1 AND draw = $2 AND vault = $3 AND pooler = $4 and tier = $5";

    let checkingForWin = [];
    try {
      checkingForWin = await DB.any(checkForWinQuery, [
        network.toString(),
        draw,
        vault,
        pooler,
        tier
      ]);
      if (checkingForWin.length > 0) {
        console.log(
          "duplicate win network" +
            network +
            "draw='" +
            draw +
            "'  and vault='" +
            vault +
            " and pooler = " +
            pooler + " and tier " + tier
        );
        return "Win already in db";
      }
    } catch (error) {
      checkingForWin = [];
    }

    const addWinQuery =
      "INSERT INTO wins (network, draw, vault, pooler, tier, prizeIndices) VALUES ($1, $2, $3, $4, $5, $6)";
    await DB.any(addWinQuery, [network.toString(), draw, vault, pooler, tier, indices]);

    return "Win added";
  } catch (error) {
    console.log(error);
    return "Could not add win";
  }
}

module.exports = { AddWin, AddDraw };

/*
  CREATE TABLE draws (
  id SERIAL PRIMARY KEY,
  network INTEGER,
  draw INTEGER,
  startedAt TIMESTAMP,
  periodSeconds INTEGER,
  tiers INTEGER,
  grandPrizePeriod INTEGER,
  tiervalues NUMERIC[],
  prizeIndices INTEGER[]
);
*/
/*
CREATE TABLE wins (
  win_id SERIAL PRIMARY KEY,
  network INTEGER,
  draw INTEGER,
  vault VARCHAR,
  pooler VARCHAR,
  tier INTEGER[],
  prizeIndices INTEGER[]
);
*/
