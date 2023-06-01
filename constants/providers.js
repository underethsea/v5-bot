const dotenv = require("dotenv");
const ethers = require("ethers");
dotenv.config();
// const ethereumEndpoint = "https://mainnet.infura.io/v3/" + process.env.ETHEREUM_KEY;
// const ethereumEndpoint = "https://eth-mainnet.alchemyapi.io/v2/IoY2MivSyvhBktzHoyto2ZqUsG2BEWth"

// const ethereumEndpoint = "https://eth-mainnet.alchemyapi.io/v2/" + process.env.POLYGON_KEY;
// const polygonEndpoint = "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.POLYGON_KEY;
// const avalancheEndpoint = "https://api.avax.network/ext/bc/C/rpc";
// const avalancheEndpoint = "https://avalanche-mainnet.infura.io/v3/" + process.env.INFURA_KEY;
// const optimismEndpoint = "https://opt-mainnet.g.alchemy.com/v2/" + process.env.POLYGON_KEY;
// const avalancheEndpoint = "https://rpc.ankr.com/avalanche";
const goerliEndpoint = "https://eth-goerli.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
const mumbaiEndpoint = "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
const sepoliaEndpoint = "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
const PROVIDERS = {
    GOERLI: new ethers.providers.JsonRpcProvider(goerliEndpoint),
    MUMBAI: new ethers.providers.JsonRpcProvider(mumbaiEndpoint),
    SEPOLIA: new ethers.providers.JsonRpcProvider(sepoliaEndpoint),


    // POLYGON: new ethers.providers.JsonRpcProvider(polygonEndpoint),
    // AVALANCHE: new ethers.providers.JsonRpcProvider(
    //     avalancheEndpoint
    // ),
    // ETHEREUM: new ethers.providers.JsonRpcProvider(ethereumEndpoint),
    // OPTIMISM: new ethers.providers.JsonRpcProvider(optimismEndpoint)
}

module.exports = { PROVIDERS }

