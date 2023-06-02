# v5-bot

## this is a WIP!! 
It has no pricing implemented yet, needs cleanup, decimal parsing, and better play by play as well as receipt handling

`yarn`

copy .env.example to .env

put keys in .env

update config.js

Both scripts require gas which can be found on Alchemy faucets for most tesnets

`node claimer.js`

Recent claim events are checked to avoid duplicate claims
`tiersToClaim` can be specified at the top of the script 
Time timestamps are used to fetch the Poolers for each tier using the TWAB subgraph
The script uses multicall to check if Poolers won and if they have not already claimed
Claims are set in `maxClaimsPerTx` batches

`node liquidator.js`
Requires POOL which can be obtained from the token faucet for testnets
When starting out you will need to approve the spend up POOL by the liquidation router.
- To do so you can uncomment the approve logic on liquidator.js


New deployments can be added in constants/address.js



