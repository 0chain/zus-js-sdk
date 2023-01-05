import utils from "./utils";
import axios, { AxiosResponse } from "axios";

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

const config = {
  miners: [
    "https://beta.0chain.net/miner03",
    "https://beta.0chain.net/miner01",
    "https://beta.0chain.net/miner02",
  ],
  sharders: ["https://beta.0chain.net/sharder01", "https://beta.0chain.net/sharder02"],
};

export const Greeter = (name: string) => `Hello ${name}`;

export const getBalance = async (clientId: string) => {
  return new Promise( (resolve, reject) => {
    utils
      .getConsensusedInformationFromSharders(config.sharders, Endpoints.GET_BALANCE, {
        client_id: clientId,
      })
      .then((res: object) => {
        resolve(res);
      })
      .catch((error: { error: string }) => {
        if (error.error === "value not present") {
          resolve({
            balance: 0,
          });
        } else {
          reject(error);
        }
      });
  });
};
