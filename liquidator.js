const { CONTRACTS } = require("./constants/contracts.js");
const { ADDRESS } = require("./constants/address.js");
const { PROVIDERS } = require("./constants/providers.js");
const { ABI } = require("./constants/abi.js");
const ethers = require("ethers");
const { CONFIG } = require("./constants/config.js");
const { GetLogs } = require("./utilities/getLogs.js");
const { Multicall } = require("./utilities/multicall.js")
const chalk  = require("chalk")
const chainName = CONFIG.CHAINNAME;

const slippage = 10; // 10 = 10%

const section = chalk.hex("#47FDFB")

const calculateWithSlippage = (amount) => {
  // let amountInt = amount.toNumber()
  let amountToReturn = amount.div(slippage).add(amount);
  return amountToReturn;
};
async function go() {
  let totalGasSpent = 0
  let totalPoolSpent = 0
  let assetsReceived = []
  let totalAssetsReceived = []
console.log("going")
  for (z = 0; z < ADDRESS[chainName].VAULTS.length; z++) {
    console.log(section("------- reading vault ---------"));
    console.log("address ", ADDRESS[chainName].VAULTS[z].VAULT);

    const contract = CONTRACTS.VAULTS[chainName][z].LIQUIDATIONPAIR;
    const maxOut = await contract.callStatic.maxAmountOut();
    const virtualReserveIn = await contract.virtualReserveIn();
    
    const virtualReserveOut = await contract.virtualReserveOut();

    // not necessary but could be helpful to know
    // const minK = await contract.minK();
    // const liquidityFraction = await contract.liquidityFraction();
    // const swapMultiplier = await contract.swapMultiplier();
    // const source = await contract.source();


    // buggy multi-call version
    //
    // const multiCallData = [
    // contract.callStatic.maxAmountOut(),
    // contract.virtualReserveIn(),
    // contract.minK(),
    // contract.liquidityFraction(),
    // contract.swapMultiplier(),
    // contract.virtualReserveOut(),
    // //  contract.source(),
    // CONTRACTS.VAULTS[chainName][z].VAULT.decimals(),
    // CONTRACTS.VAULTS[chainName][z].VAULT.symbol()
    // ]

    // let [maxOut, virtualReserveIn, minK, liquidityFraction, swapMultiplier, virtualReserveOut, tokenOutDecimals, vaultSymbol] = await Multicall(multiCallData)
    

    tokenOutDecimals = await CONTRACTS.VAULTS[chainName][z].VAULT.decimals()
    vaultSymbol = await CONTRACTS.VAULTS[chainName][z].VAULT.symbol()

    console.log(
      "liquidation pair ",
      ADDRESS[chainName].VAULTS[z].LIQUIDATIONPAIR
    );

    // assuming 18 decimals for token in for now (POOL)
    const tokenInDecimals = 18
    const tokenInSymbol = "POOL"

    const tokenOutSymbol = vaultSymbol

    // console.log("token out decimals ",tokenOutDecimals.toString())

    // console.log("minK ", minK.toString(), " liquidity fraction ", liquidityFraction.toString()," swap multiplier  ", swapMultiplier.toString() );

    console.log("max out from liquidation pair ", ethers.utils.formatUnits(maxOut,tokenOutDecimals),vaultSymbol);
    console.log("virtual reserve in ", ethers.utils.formatUnits(virtualReserveIn,tokenInDecimals),tokenInSymbol," virtual reserve out ", ethers.utils.formatUnits(virtualReserveOut,tokenOutDecimals),vaultSymbol)
    // console.log(
    //   "in / out = ",
    //   (virtualReserveIn / virtualReserveOut).toString()
    // );
    let tx;

    // trying to over-estimate amountIn to call statically, not sure if this will work
    //amountIn = (amountOut * virtualReserveIn) / virtualReserveOut

    const amountInEstimate = maxOut
      .mul(virtualReserveIn)
      .div(virtualReserveOut);
     
 if(parseFloat(maxOut)=== 0){console.log("Nothing to liquidate, maxout = 0")}else{
    try {
      tx = await CONTRACTS.LIQUIDATIONROUTERSIGNER[CONFIG.CHAINNAME].callStatic.swapExactAmountOut(
        ADDRESS[chainName].VAULTS[z].LIQUIDATIONPAIR,
        CONFIG.WALLET,
        maxOut,
        amountInEstimate
      );
      console.log("amount in required ", ethers.utils.formatUnits(tx,tokenInDecimals),tokenInSymbol);
// console.log(tx.toString())
      const maxToSendWithSlippage = calculateWithSlippage(
        tx
      );
      console.log("with slippage",maxToSendWithSlippage.toString())
      console.log("max out",maxOut.toString())
      console.log(
        "swapping a max of ",
        ethers.utils.formatUnits(maxToSendWithSlippage,tokenInDecimals),tokenInSymbol,
        " for ",
        ethers.utils.formatUnits(maxOut,tokenOutDecimals),tokenOutSymbol,
      );
      tx = await CONTRACTS.LIQUIDATIONROUTERSIGNER[CONFIG.CHAINNAME].swapExactAmountOut(
        ADDRESS[chainName].VAULTS[z].LIQUIDATIONPAIR,
        CONFIG.WALLET,
        maxOut,
        maxToSendWithSlippage
      );

      let txReceipt = await tx.wait();
      console.log(section("---- liquidated tx complete -------"));
      console.log("liquidated tx", txReceipt.transactionHash);

      // assumes gas is 18 decimal

      console.log("gas used", txReceipt.gasUsed.toString(),
      " effective gas price",
      ethers.utils.formatUnits(txReceipt.effectiveGasPrice,18));
   
      const gasSpent = parseFloat(ethers.utils.formatUnits(txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice),18))
      console.log("gas cost ",gasSpent)
      totalGasSpent += gasSpent
      // console.log("tx receipt",txReceipt.getTransactionReceipt)
      // console.log("get tx",txReceipt.getTransaction)

      // txReceipt.logs.map((log,index)=>{console.log("log ",index," ",log,interface.parseLog(log))}

      logs = GetLogs(txReceipt, ABI.SWAPEVENTS);
      logs.forEach((log) => {
        // if (log.name === "Transfer") {
          // Outgoing POOL
          // if (log.args.from.toLowerCase() === CONFIG.WALLET.toLowerCase()) {
          //   console.log("POOL OUT ", ethers.utils.formatUnits(log.args.value,tokenInDecimals));
          // }
          // else if (log.args.to.toLowerCase() === CONFIG.WALLET.toLowerCase()){
          //   console.log("YIELD RECEIVED ",log.args.value.toString())
          // }
        // }
        if (log.name === "Swapped") {
          const args = log.args;
          console.log(section("--- swapped log ---"));
          // console.log("account in ", args.account);
          const poolSpent = parseFloat(ethers.utils.formatUnits(args.amountIn,tokenInDecimals))
          totalPoolSpent += poolSpent
          assetsReceived.push({asset:tokenOutSymbol,amount:ethers.utils.formatUnits(args.amountOut,tokenOutDecimals)})
          console.log("sent  ",poolSpent,tokenInSymbol) ;
          console.log("received ", ethers.utils.formatUnits(args.amountOut,tokenOutDecimals),tokenOutSymbol);
          console.log("")
          // console.log("virtual in ", ethers.utils.formatUnits(args.virtualReserveIn,tokenInDecimals),tokenInSymbol);
          // console.log("virtual out ", ethers.utils.formatUnits(args.virtualReserveOut,tokenOutDecimals),tokenOutSymbol);
        }
      });
    } catch (e) {
      console.log(e);
      console.log("arg[2] ->", e.args && e.args.length > 2 ? e.args[2].toString() : "");
      console.log("arg[3] ->", e.args && e.args.length > 3 ? e.args[3].toString() : "");
    }
    
    
  }
  }
  console.log("")
  console.log(section("------ liquidation summary -------"))
  console.log("total gas spent ",totalGasSpent)
  console.log("total pool spent ",totalPoolSpent)
  // receivedString = ""
  // assetsReceived.forEach(asset=>receivedString+=asset.symbol + asset.amount + " , ")
  console.log(assetsReceived)
}

go();
