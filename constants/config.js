const CONFIG = {
    CHAINNAME: "SEPOLIA",
    CHAINID: 11155111,
    WALLET: "0x2cB2aE08F293B3ea657b1474F5529F652E241058", // signing wallet

    // claimer config
    USEAPI: true, // true will use prize api instead of calculating prizes
    TIERSTOCLAIM: [], // which prize tiers to claim, empty is all tiers
    MAXCLAIMS: 25, // maximum claims per transaction to avoid block overflow
    TXDELAY: 10000, // time between transactions 
    BATCHSIZE: 100, // number of wins to calculate per multicall
}

module.exports = { CONFIG }

// MUMBAI 80001
// SEPOLIA 11155111

