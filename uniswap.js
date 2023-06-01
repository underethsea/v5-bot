const { ethers } = require('ethers');
const { SupportedChainId, Token, Fetcher, Route } = require('@uniswap/sdk-core')
const { FeeAmount } = require('@uniswap/v3-sdk')

// const { CurrentConfig } = require('../config');
const { computePoolAddress } = require('@uniswap/v3-sdk');
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json');
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
// const {
//   POOL_FACTORY_CONTRACT_ADDRESS,
//   QUOTER_CONTRACT_ADDRESS,
// } = require('../libs/constants');
const { PROVIDERS } = require('./constants/providers');
const { CONFIG } = require('./constants/config');
const POOL_FACTORY_CONTRACT_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
// const { toReadableAmount, fromReadableAmount } = require('../libs/conversion');

 const POOL_TOKEN = new Token(
    SupportedChainId.POLYGON_MUMBAI,
    '0xC138A7C89C357d8FA5A9b7CE775e612b766153e7',
    18,
    'POOL',
    'PoolTogether'
  )
  
   const USDC_TOKEN = new Token(
    SupportedChainId.POLYGON_MUMBAI,
    '0xA7E7dc95b2cF9311C8BE9a96e8E111CCf0408ADD',
    6,
    'USDC',
    'USD//C'
  )
 const CurrentConfig = {
    rpc: {
      local: 'http://localhost:8545',
      mainnet: '',
    },
    tokens: {
      in: POOL_TOKEN,
    //   amountIn: 1,
      out: USDC_TOKEN,
      poolFee: FeeAmount.LOW,
    },
  }

async function toReadableAmount(amount,decimals){
    console.log("to readable ",amount.toString()," dec ",decimals)
    return ethers.utils.formatUnits(amount,decimals)
}
async function fromReadableAmount(amount,decimals){
    
    console.log("from readable ",amount," dec ",decimals)

    return ethers.utils.parseUnits(amount,decimals)
}

// async function getProvider() {
//     // return PROVIDERS[CONFIG.CHAINNAME]
//     return "https://polygon-mumbai.g.alchemy.com/v2/Km46Q-DZ04ftPfKNgPwaP6cp957PJHNl"
// }
async function quote() {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    PROVIDERS[CONFIG.CHAINNAME]
  );
  const poolConstants = await getPoolConstants();

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    "1000",
    0
  );

// const pair = await Fetcher.fetchPairData(USDC_TOKEN,POOL_TOKEN)
// const route = new Route([pair], POOL_TOKEN)
// console.log(route.midPrice.toSignificant(18))
// console.log(route.midPrice.invert().toSignificant(18))

  return toReadableAmount(quotedAmountOut, CurrentConfig.tokens.out.decimals);
}

async function getPoolConstants() {
  let currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  });
   currentPoolAddress = "0xB88249926abF1103B102C2A9919Eea43D90F9615"

  console.log("address",currentPoolAddress)
  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    PROVIDERS[CONFIG.CHAINNAME]
  );
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);
  console.log("token 0",token0)
  console.log("token 1",token1)


  return {
    token0,
    token1,
    fee,
  };
}

quote()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
