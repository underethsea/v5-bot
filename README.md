# v5-bot

This repo includes prize calculations and database population for a postgres DB.

Also included are bots for liquidating yield from V5 vaults and claiming prizes from the prize pool

## this is a WIP!! Some improvements to make...

- More pricing and swap
- Decimal parsing
- Better play by play
- Better receipt handling
- General cleanup
- Prize calc and DB error handling

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

more config options

- `CONFIG.USEAPI` boolean enables use of prize api instead of calculating prizes
- `CONFIG.TIERSTOCLAIM` [] specify which prize tiers to claim, empty is all tiers
- `CONFIG.MAXCLAIMS` number  maximum claims per transaction to avoid block overflow
- `CONFIG.BATCHSIZE` number of wins to calculate per multicall
- `TXDELAY` number ms time between transactions 

## `node claimer.js`

- Recent claim events are checked to avoid duplicate claims
- Time timestamps are used to fetch the Poolers for each tier using the TWAB subgraph
- The script uses multicall to check if Poolers won (or API) and if they have not already claimed
- Checks for profitability of claim

## `node liquidator.js`

- iterrates through the vaults on the configured chain to liquidate yield

## `node listen.js`
- listens for complete draw events to trigger prize calcs and update database


