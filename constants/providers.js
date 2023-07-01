const dotenv = require("dotenv").config({path : './.env'});
const ethers = require("ethers");
const { CONFIG }= require("./config")


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
const sepoliaInfura = "https://sepolia.infura.io/v3/a86edca6bd3040689463a58672d7d8e5";
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

const wally = new ethers.Wallet(process.env.PRIVATE_KEY,PROVIDERS[CONFIG.CHAINNAME])
const SIGNER = wally.connect(PROVIDERS[CONFIG.CHAINNAME]);

module.exports = { PROVIDERS, SIGNER }

