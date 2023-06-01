const fetch = require("cross-fetch");
require("dotenv").config();
const fs = require("fs");

async function FetchPlayers(chainId,ticket) {
  try {
let pageSize = 20000;
let holders = [];
let covalentData = {}
let pageNumber = 0
let hasMore = false

do {
    let fetchString = `https://api.covalenthq.com/v1/${chainId}/tokens/${ticket}/token_holders/?page-size=${pageSize}&page-number=${pageNumber}&key=${process.env.COVALENT_KEY}`;
    try {
      let covalentFetch = await fetch(fetchString);
      let covalentData = await covalentFetch.json();
      holders = holders.concat(covalentData.data.items);
      hasMore = covalentData.data.pagination.has_more
    //   console.log(holders);
      pageNumber++;
    } catch (error) {
      console.log(error);
      break;
    }
  } while (hasMore);
  
//   console.log(holders);

    fs.writeFileSync(
        "./players/players_" + chainId + "_" + ticket + ".json",
      JSON.stringify(holders)
    );

    return holders;
  } catch (error) {
    console.log("error " , error)
    console.log("fetch failed, using backup players for chain ", chainId);
    const backup = JSON.parse(
      fs.readFileSync("./players/players_" + chainId + "_" + ticket + ".json", "utf8")
    );
    console.log( " backup has ",backup.data.items.length," <---- players ");
    return backup;
    console.log(error);
  }
}
// async function go() {
//   FetchPlayers(5,"0x61e0A5e77db8e659C8753630046025876414715d");
// }
// go();

module.exports = FetchPlayers
