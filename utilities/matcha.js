const fetch = require("cross-fetch");

/* 
https://0x.org/docs/0x-swap-api/api-references/overview
Ethereum (Mainnet)	https://api.0x.org/
Ethereum (Goerli)	https://goerli.api.0x.org/
Polygon	https://polygon.api.0x.org/
Polygon (Mumbai)	https://mumbai.api.0x.org/
Binance Smart Chain	https://bsc.api.0x.org/
Optimism	https://optimism.api.0x.org/
Fantom	https://fantom.api.0x.org/
Celo	https://celo.api.0x.org/
Avalanche	https://avalanche.api.0x.org/
Arbitrum	https://arbitrum.api.0x.org/ */

async function matchaQuote(sellToken,buyToken,sellAmountInWei){
    try{
        const quoteFetchUrl = `https://goerli.api.0x.org/swap/v1/source`
// const quoteFetchUrl = `https://goerli.api.0x.org/swap/v1/price?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmountInWei}`
const fetched = await fetch(quoteFetchUrl)
const fetchResult = await fetched.json()
console.log(fetchResult)
    }catch(e){console.log(e)}
}

async function go(){
    await matchaQuote("ETH","USDC",1000000000000000000)
}
go()

