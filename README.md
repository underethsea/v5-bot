# v5-bot

For liquidating yield from V5 vaults and claiming prizes from the prize pool

## this is a WIP!! Some todos...

- Implement pricing
- Decimal parsing
- Better play by play
- Better receipt handling
- Move wallet connection to constants
- General cleanup

# Getting started

`git clone` this repo

`yarn` to install dependencies

`cp .env.example .env` to copy environment variable setup

put your keys in .env

update ./constants/config.js with chain and wallet information

to create a wallet use `node newWallet.js`

you will need gas on your new wallet. Alchemy has free faucets for testnets

you will need POOL to liquidate yield. for testnets you can use the faucet and drip to your wallet specified in config.js. do so by running `node drip.js`

you will need to approve of POOL spend by the liquidation router, this can be done by running `node approve.js`

new deployments can be added in constants/address.js


## `node claimer.js`

- `tiersToClaim` can be specified at the top of the script 
- Claims are sent in `maxClaimsPerTx` batches
- Recent claim events are checked to avoid duplicate claims
- Time timestamps are used to fetch the Poolers for each tier using the TWAB subgraph
- The script uses multicall to check if Poolers won and if they have not already claimed

## `node liquidator.js`

- iterrates through the vaults on the configured chain to liquidate yield








