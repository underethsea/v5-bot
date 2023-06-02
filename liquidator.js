const { CONTRACTS } = require("./constants/contracts.js");
const { ADDRESS } = require("./constants/address.js");
const { PROVIDERS } = require("./constants/providers.js")
const { ABI } = require("./constants/abi.js")
const ethers = require("ethers");
const { CONFIG } = require("./constants/config.js")
const { GetLogs } = require("./utilities/getLogs.js")

const chainName = CONFIG.CHAINNAME
// this is probably not needed but can be set for example at .02 for 2% slippage
const slippage = 0

const wally = new ethers.Wallet(process.env.PRIVATE_KEY,PROVIDERS[chainName])
const signer = wally.connect(PROVIDERS[chainName]);

const liquidationRouterWithSigner = new ethers.Contract(ADDRESS[chainName].LIQUIDATIONROUTER,ABI.LIQUIDATIONROUTER,signer)
const poolTokenWithSigner = new ethers.Contract(ADDRESS[chainName].POOL,ABI.POOL,signer)
// const dripper = new ethers.Contract("0xC7a469F83849501F02ebb50522eDa43CcCcf47fB",ABI.DRIPPER,signer)

const calculateWithSlippage = (amount) =>{
  // let amountInt = amount.toNumber()
  let amountToReturn = amount + (amount*slippage)
  return Math.floor(amountToReturn).toString()

}
async function go() {
  for (z = 0; z < ADDRESS[chainName].VAULTS.length; z++) {
    console.log("-------reading vault---------")
    console.log("address ", ADDRESS[chainName].VAULTS[z].VAULT);
    
    let contract = CONTRACTS.VAULTS[chainName][z].LIQUIDATIONPAIR
  const maxOut =
    await contract.callStatic.maxAmountOut();
  const virtualReserveIn =
    await contract.virtualReserveIn();
  const minK =
    await contract.minK();
  const liquidityFraction =
    await contract.liquidityFraction();
  const swapMultiplier = 
    await contract.swapMultiplier();
  const virtualReserveOut =
    await contract.virtualReserveOut();
    const source =
    await contract.source();
    
  console.log("liquidation pair ", ADDRESS[chainName].VAULTS[0].LIQUIDATIONPAIR);

  console.log("minK ", minK.toString());
  console.log("liquidity fraction ", liquidityFraction.toString());
  console.log("swap multiplier  ", swapMultiplier.toString());



  console.log("max out from liquidation pair ", maxOut.toString());
  console.log("virtual reserve in ", virtualReserveIn.toString());
  console.log("virtual reserve out ", virtualReserveOut.toString());
  console.log("in / out = ", (virtualReserveIn / virtualReserveOut).toString());
  let tx 

  // // drip POOL
  // let drip = await dripper.drip(ADDRESS[chainName].POOL)
  // let dripReceipt = await drip.wait()
  // console.log(dripReceipt)

  // approve 
  // let approve = await poolTokenWithSigner.approve(ADDRESS[chainName].LIQUIDATIONROUTER,"100000000000000000000000000000")
  // let approveReceipt = await approve.wait()
  // console.log(approveReceipt)
  
  // tx = await liquidationRouter.swapExactAmountIn(ADDRESS[chainName].VAULTS[0].LIQUIDATIONPAIR,CONFIG.WALLET,"156245004254578","1")
  
  // trying to over-estimate amountIn to call statically, not sure if this will work
  //amountIn = (amountOut * virtualReserveIn) / virtualReserveOut
  const amountInEstimate = maxOut.mul(virtualReserveIn).div(virtualReserveOut)
  try{
  tx = await liquidationRouterWithSigner.callStatic.swapExactAmountOut(ADDRESS[chainName].VAULTS[0].LIQUIDATIONPAIR,CONFIG.WALLET,maxOut,amountInEstimate)
  console.log("amount in required ",tx.toString())
  
  const maxToSendWithSlippage = calculateWithSlippage(parseInt(tx.toString()))
  console.log("swapping a max of ",maxToSendWithSlippage, " for ",maxOut.toString(), )
  tx = await liquidationRouterWithSigner.swapExactAmountOut(ADDRESS[chainName].VAULTS[0].LIQUIDATIONPAIR,CONFIG.WALLET,maxOut.toString(),maxToSendWithSlippage)

  let txReceipt = await tx.wait()
  console.log("---- liquidated tx complete-------")
  console.log("liquidated tx",txReceipt.transactionHash)
  console.log("gas used",txReceipt.gasUsed.toString())
  console.log("effective gas price",txReceipt.effectiveGasPrice.toString())
  // console.log("tx receipt",txReceipt.getTransactionReceipt)
  // console.log("get tx",txReceipt.getTransaction)
  


  // txReceipt.logs.map((log,index)=>{console.log("log ",index," ",log,interface.parseLog(log))}
    
  logs = GetLogs(txReceipt,ABI.SWAPEVENTS)
  logs.forEach(log=>{
    if(log.name==="Transfer") {
      // Outgoing POOL
      if(log.args.from.toLowerCase() === CONFIG.WALLET.toLowerCase()) {
        console.log("POOL OUT ",log.args.value.toString())
      }
      // else if (log.args.to.toLowerCase() === CONFIG.WALLET.toLowerCase()){
      //   console.log("YIELD RECEIVED ",log.args.value.toString())
      // }
    }
    if(log.name==="Swapped") {
      const args = log.args
      console.log("---swapped log---")
      console.log("account in ",args.account)

      console.log("amount in ",args.amountIn.toString())
      console.log("amount out ",args.amountOut.toString())
      console.log("virtual in ",args.virtualReserveIn.toString())
      console.log("virtual out ",args.virtualReserveOut.toString())

    }
  })  }catch(e){console.log(e);console.log("arg[2] ->",e.args[2].toString());console.log("arg[3] ->",e.args[3].toString())}

  }
  
}


go();
