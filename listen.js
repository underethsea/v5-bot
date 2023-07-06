
// const { CONTRACTS, ADDRESS, PROVIDERS } = require("./constants/index.js")
const { ADDRESS } = require("./constants/address")
const { PROVIDERS } = require("./constants/providers")
const {PrizeWinsToDb} = require("./prizeWinsToDb.js")
const ethers = require("ethers")

console.log(ADDRESS["SEPOLIA"].PRIZEPOOL)
const chain = "SEPOLIA"
const FILTERS = {
  DRAWCOMPLETED: {
    address: ADDRESS[chain].PRIZEPOOL,
    topics: ["0x41eb98a80ad132e465ac5c11736a75eefdbba4b8fdc43b8ff5c2e7c3bdc6dcbf"]
  },
}

async function listen() {
    console.log("listening for complete award events")
    PROVIDERS[chain].on(FILTERS.DRAWCOMPLETED, (drawCompletedEvent) => {
        try {
            console.log("draw completed event", drawCompletedEvent)
            PrizeWinsToDb(11155111,drawCompletedEvent.blockNumber).then((finished)=>{console.log("db updated")})
        }catch(error){console.log(error)}
    })
}

listen()
