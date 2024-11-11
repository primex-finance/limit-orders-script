// SPDX-License-Identifier: BUSL-1.1
// const { expect } = require("chai");
const { HermesClient} = require("@pythnetwork/hermes-client");

module.exports = async function (
  { _ },{
    ethers: {
      getContractAt,
      getContract,
      getSigners,
      utils: { parseEther, defaultAbiCoder, parseUnits },
      constants: { MaxUint256, Zero } 
    }
  }
) {
  const {
    getLimitPriceParams,
    getCondition,
  } = require("./conditionParams");
  const { wadMul, wadDiv } = require("./bnMath");
 
  const {getEncodedPythRouteViaUsd} = require("./oracleUtils");

  const connection = new HermesClient("https://hermes.pyth.network", {});

  const priceIds = [
    // You can find the ids of prices at https://pyth.network/developers/price-feed-ids
    "0xffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472", // pol to usd
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a" // usdc to USD
  ];


  const priceUpdates = await connection.getLatestPriceUpdates(priceIds, {
    encoding: 'hex',
  });

  const updateData = "0x" + priceUpdates.binary.data[0];

  const depositAsset = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; //usdc
  const positionAsset = "0x59d9356e565ab3a36dd77763fc0d87feaf85508c"; //usdm
  let depositAmount = "1";
  const bucketName = "Primex Bucket USDC2";
  const shouldOpenPosition = true;
  const takeDepositFromWallet = true;
  let leverage = "2";
  const limitPrice = parseUnits("3", '6') // in borrowed token decimals

  const YEAR = 3600 * 24 * 365;

  leverage = parseEther(leverage);

  const isNotSpot = leverage.gt(parseEther("1"));

  const LIMIT_PRICE_CM_TYPE = 1;



  const positionToken = await getContractAt("ERC20", positionAsset);
  const depositToken = await getContractAt("ERC20", depositAsset);

  const limitOrderManager = await getContract("LimitOrderManager");

  const bucket = await getContract(bucketName);

  const maxLeverage = await bucket['maxAssetLeverage(address)'](positionToken.address);
  if (maxLeverage.lt(leverage)) {
    throw new Error(`Incorrect leverage. Max leverage is ${maxLeverage.toString()}`);
  }


  let tx;


  tx = await depositToken.approve(limitOrderManager.address, MaxUint256);
  await tx.wait();

  const depositDecimals = await depositToken.decimals();

  depositAmount = parseUnits(depositAmount, depositDecimals);

  tx = await limitOrderManager.createLimitOrder(
    {
      bucket: isNotSpot ? bucketName : "",
      depositAmount: depositAmount,
      depositAsset: depositToken.address,
      positionAsset: positionToken.address,
      deadline: Math.floor(new Date().getTime() / 1000) +  YEAR,
      takeDepositFromWallet: takeDepositFromWallet,
      leverage: leverage,
      shouldOpenPosition: shouldOpenPosition,
      openConditions: [getCondition(LIMIT_PRICE_CM_TYPE, getLimitPriceParams(limitPrice))],
      closeConditions: [],
      isProtocolFeeInPmx: false,
      nativeDepositAssetOracleData: getEncodedPythRouteViaUsd(depositToken),
      pullOracleData: [[updateData]],
      pullOracleTypes: [0],
    }, {
      value: parseEther('0.01')
    },
  );
  
  const txReceipt = await tx.wait();
  const orderId = txReceipt.events?.filter(x => {
    return x.event === "CreateLimitOrder";
  })[0].args.orderId;

  console.log(`order ${orderId} has been created`);

};
