import { getConsensusedInformationFromSharders } from "./utils";
import { createWasm } from "./zcn";

let bls;
let goWasm;
let config;

const StorageSmartContractAddress =
  "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7";
const MinerSmartContractAddress =
  "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d9";
const InterestPoolSmartContractAddress =
  "cf8d0df9bd8cc637a4ff4e792ffe3686da6220c45f0e1103baa609f3f1751ef4";

const Endpoints = {
  REGISTER_CLIENT: "/v1/client/put",
  PUT_TRANSACTION: "/v1/transaction/put",

  GET_RECENT_FINALIZED: "/v1/block/get/recent_finalized",
  GET_LATEST_FINALIZED: "/v1/block/get/latest_finalized",
  GET_CHAIN_STATS: "/v1/chain/get/stats",
  GET_BLOCK_INFO: "/v1/block/get",
  CHECK_TRANSACTION_STATUS: "/v1/transaction/get/confirmation",
  GET_BALANCE: "/v1/client/get/balance",
  GET_CLIENT: "/v1/client/get",
  GET_SCSTATE: "/v1/scstate/get",

  // SC REST
  SC_REST: "/v1/screst/",
  SC_REST_ALLOCATION: "/v1/screst/" + StorageSmartContractAddress + "/allocation",
  SC_REST_ALLOCATIONS: "/v1/screst/" + StorageSmartContractAddress + "/allocations",
  SC_REST_READPOOL_STATS: "/v1/screst/" + StorageSmartContractAddress + "/getReadPoolStat",
  SC_REST_WRITEPOOL_STATS: "/v1/screst/" + StorageSmartContractAddress + "/getWritePoolStat",
  SC_BLOBBER_STATS: "/v1/screst/" + StorageSmartContractAddress + "/getblobbers",
  SC_SHARDER_LIST: "/v1/screst/" + MinerSmartContractAddress + "/getSharderList",
  SC_MINERS_STATS: "/v1/screst/" + MinerSmartContractAddress + "/getMinerList",
  SC_REST_ALLOCATION_MIN_LOCK: "/v1/screst/" + StorageSmartContractAddress + "/allocation_min_lock",

  GET_LOCKED_TOKENS: "/v1/screst/" + InterestPoolSmartContractAddress + "/getPoolsStats",
  GET_USER_POOLS: "/v1/screst/" + MinerSmartContractAddress + "/getUserPools",

  // STAKING
  GET_STORAGESC_POOL_STATS: "/v1/screst/" + StorageSmartContractAddress + "/getUserStakePoolStat",
  GET_MINERSC_POOL_STATS: "/v1/screst/" + MinerSmartContractAddress + "/getUserPools",
  GET_STAKE_POOL_STAT: "/v1/screst/" + StorageSmartContractAddress + "/getStakePoolStat",

  // BLOBBER
  ALLOCATION_FILE_LIST: "/v1/file/list/",
  FILE_STATS_ENDPOINT: "/v1/file/stats/",
  OBJECT_TREE_ENDPOINT: "/v1/file/objecttree/",
  FILE_META_ENDPOINT: "/v1/file/meta/",
  RENAME_ENDPOINT: "/v1/file/rename/",
  COPY_ENDPOINT: "/v1/file/copy/",
  UPLOAD_ENDPOINT: "/v1/file/upload/",
  COMMIT_ENDPOINT: "/v1/connection/commit/",
  // COPY_ENDPOINT: "/v1/file/copy/",
  // OBJECT_TREE_ENDPOINT: '/v1/file/objecttree/',
  COMMIT_META_TXN_ENDPOINT: "/v1/file/commitmetatxn/",

  // PROXY
  PROXY_SERVER_DOWNLOAD_ENDPOINT: "/download",

  // ZEROBOX URLs
  ZEROBOX_SERVER_GET_MNEMONIC_ENDPOINT: "/v2/getmnemonic",
  ZEROBOX_SERVER_SHARE_INFO_ENDPOINT: "/shareinfo",
  ZEROBOX_SERVER_SAVE_MNEMONIC_ENDPOINT: "/v2/savemnemonic",
  ZEROBOX_SERVER_DELETE_MNEMONIC_ENDPOINT: "/shareinfo",
  ZEROBOX_SERVER_REFERRALS_INFO_ENDPOINT: "/getreferrals",
  ZEROBOX_SERVER_FREE_ALLOCATION: "/v2/createallocation",
  ZEROBOX_SERVER_DELETE_EXIST_ALLOCATION: "/v2/deleteallocation",
};

const configJson = {
  miners: [
    "https://dev.0chain.net/miner02",
    "https://dev.0chain.net/miner01",
    "https://dev.0chain.net/miner03",
  ],
  sharders: ["https://dev.0chain.net/sharder01", "https://dev.0chain.net/sharder02"],
  chainId: "0afc093ffb509f059c55478bc1a60351cef7b4e9c008a53a6cc8241ca8617dfe",
  signatureScheme: "bls0chain",
  minConfirmation: 50,
  minSubmit: 50,
  confirmationChainLength: 3,
  blockWorker: "https://dev.0chain.net/dns",
  zboxHost: "https://0box.dev.0chain.net",
  zboxAppType: "vult",
};

const alternateConfig = [
  configJson.chainId,
  configJson.blockWorker,
  configJson.signatureScheme,
  configJson.minConfirmation,
  configJson.minSubmit,
  configJson.confirmationChainLength,
  "https://0box.dev.0chain.net", //zboxHost
  "vult", //zboxAppType
];

const getWasm = () => {
  return window.goWasm;
};

export const init = async (configObject, blsWasm) => {
  /* tslint:disable:no-console */
  // const hasConfig = typeof configObject !== "undefined";
  // if (hasConfig) {
  //   config = configObject;
  // } else {
  config = configJson;
  //}
  //console.log("config", config);

  // const wasm = await createWasm();
  const wasm = getWasm();

  console.log("wasm", wasm);

  await wasm.sdk.showLogs();

  console.log(...alternateConfig);
  await wasm.sdk.init(...alternateConfig);
  // await wasm.sdk.init(
  //   config.chainId,
  //   config.blockWorker,
  //   config.signatureScheme,
  //   config.minConfirmation,
  //   config.minSubmit,
  //   config.confirmationChainLength,
  //   config.zboxHost,
  //   config.zboxAppType,
  // );

  console.log("blsWasm", blsWasm);
  console.log("window.bls", window.bls);
  bls = window.bls;
  console.log("bls", bls);
  await bls.init(bls.BN254);

  const testWallet = {
    clientId: "7d35a6c3ba5066e62989d34cee7dd434d0833d5ea9ff00928aa89994d80e4700",
    privateKey: "5ababb1e99fe08e44b9843a0a365a832928f9e1aa2d6bba24e01058f1bf0e813",
    publicKey:
      "5b7ce801f11b5ce02c2ff980469b00e7ed34a9690977661b0cc80bc5eb33ee13baaf6b099f38a2586c5ff63c576870829c117e392fc40868e4bd6418dbaf389c",
  };
  await wasm.setWallet(bls, testWallet.clientId, testWallet.privateKey, testWallet.publicKey);

  goWasm = wasm;

  /* tslint:enable:no-console */
};

export const Greeter = (name) => `Hello ${name?.toUpperCase()}`;

export const getBalance = async (clientId) => {
  return new Promise((resolve, reject) => {
    getConsensusedInformationFromSharders(config.sharders, Endpoints.GET_BALANCE, {
      client_id: clientId,
    })
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        if (error?.error === "value not present") {
          resolve({
            balance: 0,
          });
        } else {
          reject(error);
        }
      });
  });
};

export const getBalanceWasm = async (clientId) => {
  const balanceObj = await goWasm.sdk.getWalletBalance(clientId);
  return balanceObj;
};

export const setWallet = async (clientID, privateKey, publicKey) => {
  console.log("START setWallet", { clientID, privateKey, publicKey });
  await goWasm.setWallet(bls, clientID, privateKey, publicKey);
  console.log("END setWallet", { clientID, privateKey, publicKey });
};

export const listAllocations = async () => {
  const allocations = await goWasm.sdk.listAllocations();
  return allocations;
};

export const createAllocation = async (allocationConfig) => {
  console.log("allocationConfig", allocationConfig);
  await goWasm.sdk.createAllocation(
    allocationConfig.name,
    allocationConfig.datashards,
    allocationConfig.parityshards,
    allocationConfig.size,
    allocationConfig.expiry,
    allocationConfig.minReadPrice,
    allocationConfig.maxReadPrice,
    allocationConfig.minWritePrice,
    allocationConfig.maxWritePrice,
    allocationConfig.lock,
    [],
  );
};

export const bulkUpload = async (objects) => {
  console.log("bulkUpload objects", objects);
  const results = await goWasm.bulkUpload(objects);
  return results;
};

export const getFaucetToken = async () => {
  console.log("faucet before");
  await goWasm.sdk.faucet("pour", JSON.stringify("{Pay day}"), 0);
  console.log("faucet after");
};

export const sendToken = async (sendTo, sendAmount) => {
  console.log("sendToken before", sendTo, sendAmount);
  const address = sendTo;
  const methodName = "";
  const input = JSON.stringify("{note: ''}");
  const value = sendAmount;
  await goWasm.sdk.executeSmartContract(address, methodName, input, value);
  console.log("sendToken after");
};
