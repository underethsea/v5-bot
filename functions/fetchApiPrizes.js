const fetch = require("cross-fetch");

const FetchApiPrizes = async (chain, draw, tiersToClaim, claims) => {
  ///testnet-80001-draw42
  const url = "https://poolexplorer.xyz/testnet-" + chain + "-draw" + draw;
  const fetchPrizes = await fetch(url);
  const prizesResult = await fetchPrizes.json();

  // Filter wins for tiers to claim
  const filteredWins = prizesResult.wins.filter((win) => {
    const tierToClaim = win.t[0];
    if (tiersToClaim.length === 0) {
      // If tiersToClaim is empty, claim all tiers
      return true;
    } else {
      // Claim specific tiers based on tiersToClaim array
      return tiersToClaim.includes(tierToClaim);
    }
  });
  // Return vault, playeraddress, tier for claim

  const winsToClaim = filteredWins.map((win) => [win.v, win.p, win.t[0]]);

//   console.log("wins to claim ", filteredWins.length);
//   const filteredWinsToClaim = winsToClaim.filter((win) => {
//     const [v, p, t] = win;
//     return !claims.some(
//       (claim) =>
//         claim.drawId.toString() === draw.toString() &&
//         claim.vault.toLowerCase() === v &&
//         claim.winner.toLowerCase() === p &&
//         claim.tier === t
//     );
//   });
//   console.log("wins after filtering out claims ", filteredWinsToClaim.length);
  return winsToClaim;

  //check that its not putting wins on same vault on api that are actually diff vaults
  // need to exclude already claimed prizes
}

module.exports = { FetchApiPrizes };
