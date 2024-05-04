import { basicRequest } from "./requests";

import sha3 from "js-sha3";
import JSONbig from "json-bigint";
import axios, { AxiosRequestConfig } from "axios";
import BlueBirdPromise from "bluebird";
import moment from "moment";
import { AccountEntity, ReqHeaders, TxnData } from "./types";

const StorageSmartContractAddress = "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7";
const MinerSmartContractAddress = "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d9";
const InterestPoolSmartContractAddress = "cf8d0df9bd8cc637a4ff4e792ffe3686da6220c45f0e1103baa609f3f1751ef4";

export const Endpoints = {
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
  miners: ["https://dev2.zus.network/miner01", "https://dev3.zus.network/miner01", "https://dev1.zus.network/miner01"],
  sharders: [
    "https://dev1.zus.network/sharder01",
    "https://dev2.zus.network/sharder01",
    "https://dev3.zus.network/sharder01",
  ],
};

const consensusPercentage = 20;
let cachedNonce = 0;

/**
 * Returns the consensus message from a set of hashed responses.
 * If there is enough consensus (at least `consensusNo` matching hashes), it returns the corresponding response.
 * Otherwise, it returns null.
 *
 * @param hashedResponses An array of SHA-256 hashed response strings.
 * @param consensusNo he minimum number of matching hashes required for consensus.
 * @param responseArray An array of corresponding responses.
 * @returns The consensus message or null if there is not enough consensus.
 */
const getConsensusMessageFromResponse = function (
  hashedResponses: string[] | BlueBirdPromise.AggregateError,
  consensusNo: number,
  responseArray: any[] | BlueBirdPromise.AggregateError
) {
  if (hashedResponses.length === 0 || responseArray.length === 0) return null;

  let uniqueCounts: Record<string, number> = {};
  hashedResponses.forEach(_hash => {
    const hash = _hash.toString();
    uniqueCounts[hash] = (uniqueCounts[hash] || 0) + 1;
  });

  const firstHash = hashedResponses[0]!;
  const isErrorObj = typeof firstHash !== "string" || hashedResponses instanceof BlueBirdPromise.AggregateError;
  let maxResponses = isErrorObj
    ? { key: "", val: 0 }
    : {
        key: firstHash,
        val: firstHash ? uniqueCounts[firstHash]! : 0,
      };

  for (const [hash, hashCount] of Object.entries(uniqueCounts)) {
    if (maxResponses.val < hashCount) {
      maxResponses = { key: hash, val: hashCount };
    }
  }

  if (maxResponses.val >= consensusNo) {
    if (isErrorObj) return null;
    const responseIndex = hashedResponses.indexOf(maxResponses.key);
    return responseArray[responseIndex];
  } else {
    return null;
  }
};

/**
 * Parses the consensus message using the provided parser function.
 *
 * @param finalResponse The consensus message to parse.
 * @param parser The parser function to apply to the consensus message. (optional)
 * @returns The parsed data.
 */
const parseConsensusMessage = function (finalResponse: any, parser?: Function) {
  const data = typeof parser !== "undefined" ? parser(finalResponse) : finalResponse;
  return data;
};

/**
 * Retrieves consensus-based information from a set of sharders.
 *
 * @param sharders An array of sharder URLs.
 * @param url The endpoint URL.
 * @param params he parameters to include in the request.
 * @param parser The parser function to apply to the consensus response.
 * @returns A Promise that resolves to the parsed consensus information.
 */
export const getConsensusedInformationFromSharders = (
  sharders: string[],
  url: string,
  params: AxiosRequestConfig<any>["params"],
  parser?: Function
) => {
  return new Promise(function (resolve, reject) {
    const urls = sharders.map(sharder => sharder + url);
    const promises = urls.map(oneUrl => getReq(oneUrl, params));
    let percentage = Math.ceil((promises.length * consensusPercentage) / 100);

    BlueBirdPromise.some(promises, percentage)
      .then(function (result) {
        const hashedResponses = result.map(r => {
          return sha3.sha3_256(JSON.stringify(r.data));
        });
        const consensusResponse = getConsensusMessageFromResponse(hashedResponses, percentage, result);
        if (consensusResponse === null) {
          reject({ error: "Not enough consensus" });
        } else {
          resolve(parseConsensusMessage(consensusResponse.data, parser));
        }
      })
      .catch(BlueBirdPromise.AggregateError, function (err: BlueBirdPromise.AggregateError) {
        console.log("err", err);
        const errors = err.map((e: any) => {
          if (
            e.response !== undefined &&
            e.response.status !== undefined &&
            e.response.status === 400 &&
            e.response.data !== undefined
          ) {
            return sha3.sha3_256(JSON.stringify(e.response.data));
          } else {
            return e.code;
          }
        });
        const consensusErrorResponse = getConsensusMessageFromResponse(errors, percentage, err);
        console.log("consensusErrorResponse", consensusErrorResponse);
        if (consensusErrorResponse === null) {
          reject({ error: "Not enough consensus" });
        } else {
          try {
            reject(parseConsensusMessage(consensusErrorResponse?.response?.data));
          } catch (err) {
            reject(err);
          }
        }
      });
  });
};

/**
 * Converts a Uint8Array to a hexadecimal string representation.
 *
 * @param uint8arr The Uint8Array to convert.
 * @returns he hexadecimal string representation of the Uint8Array.
 */
export const byteToHexString = (uint8arr: Uint8Array) => {
  if (!uint8arr) return "";

  let hexStr = "";
  for (const byte of uint8arr) {
    let hex = (byte & 0xff).toString(16);
    hex = hex.length === 1 ? "0" + hex : hex;
    hexStr += hex;
  }
  return hexStr;
};

/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param str The hexadecimal string to convert.
 * @returns The Uint8Array representation of the hexadecimal string.
 */
export const hexStringToByte = (str: string) => {
  if (!str) {
    return new Uint8Array();
  }
  const a = [];
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substring(i, i + 2), 16));
  }
  return new Uint8Array(a);
};

/**
 * Shuffles the elements in an array using the Fisher-Yates algorithm.
 *
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  let m = array.length;
  let t: T;
  let i: number;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m]!;
    array[m] = array[i]!;
    array[i] = t;
  }

  return array;
};

/**
 * Pauses the execution for a specified number of milliseconds.
 *
 * @param ms The number of milliseconds to sleep.
 * @returns A Promise that resolves after the specified sleep duration.
 */
export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Converts a string to its hexadecimal representation.
 *
 * @param str The string to convert.
 * @returns The hexadecimal representation of the string.
 */
export const toHex = (str: string) => {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
};

/**
 * Computes the data ID for a specific storage part.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path to the file.
 * @param fileName The name of the file.
 * @param partNum The part number.
 * @returns The computed data ID.
 */
export const computeStoragePartDataId = (allocationId: string, path: string, fileName: string, partNum: number) => {
  return sha3.sha3_256([allocationId, path, fileName, partNum].join(":"));
};

/**
 * Parses wallet information from an AE (AccountEntity) object and returns the parsed data.
 *
 * @param ae The AccountEntity object containing wallet information.
 * @returns The parsed wallet information.
 */
export const parseWalletInfo = (ae: AccountEntity) => {
  return {
    client_id: ae.id,
    client_key: ae.public_key,
    keys: [{ public_key: ae.public_key, private_key: ae.secretKey }],
    mnemonics:
      "bar figure position super change stage beach version word raise busy problem misery poet crystal gravity gospel fun become bring ready width object glance",
    version: "1.0",
    date_created: moment.unix(ae.timeStamp).format("YYYY-MM-DD HH:mm:ss"),
  };
};

/**
 * Makes a POST request to the specified URL with the given data.
 *
 * @param url The complete URL including the path to where the POST request is to be sent.
 * @param data The payload for the POST request.
 * @param option Additional options for the request (optional).
 * @returns A Promise representing the POST request.
 */
export const postReq = (url: string, data: any, option?: AxiosRequestConfig) => {
  return axios({
    method: "post",
    url: url,
    data: data,
    ...option,
    onUploadProgress: function (progressEvent) {
      if (option) {
        option.onUploadProgress?.(progressEvent);
      }
    },
    transformResponse: function (responseData) {
      return parseJson(responseData);
    },
  });
};

/**
 * Makes a PUT request to the specified URL with the given data.
 *
 * @param url The complete URL including the path to where the PUT request is to be sent.
 * @param data The payload for the PUT request.
 * @returns A Promise representing the PUT request.
 */
export const putReq = (url: string, data: any) => {
  return axios({
    method: "put",
    url: url,
    data: data,
    transformResponse: function (responseData) {
      return parseJson(responseData);
    },
  });
};

/**
 * Makes a DELETE request to the specified URL with the given data.
 *
 * @param url The complete URL including the path to where the DELETE request is to be sent.
 * @param data The payload for the DELETE request.
 * @returns A Promise representing the DELETE request.
 */
export const delReq = (url: string, data: any) => {
  return axios({
    method: "delete",
    url: url,
    data: data,
  });
};

/**
 * Recovers a wallet from the cloud using the specified URL, App ID Token, and App Phone Number.
 *
 * @param url The URL from which to recover the wallet.
 * @param AppIDToken The App ID Token used for authentication.
 * @param AppPhoneNumber The App Phone Number associated with the wallet.
 * @returns A Promise representing the recovery request.
 */
export const recoverWalletFromCloud = (url: string, AppIDToken: string, AppPhoneNumber: string) => {
  return axios({
    method: "get",
    url: url,
    headers: {
      "X-App-ID-TOKEN": AppIDToken,
      "X-App-Phone-Number": AppPhoneNumber,
    },
  });
};

/**
 * Retrieves share information from the specified URL using the provided client signature, client ID, and client key.
 *
 * @param url The URL from which to retrieve the share information.
 * @param clientSignature The client signature used for authentication.
 * @param clientId The client ID associated with the share.
 * @param clientkey The client key used for authentication.
 * @returns A Promise representing the share information request.
 */
export const getShareInfo = (url: string, clientSignature: string, clientId: string, clientkey: string) => {
  return axios({
    method: "get",
    url: url,
    headers: {
      "X-App-Client-ID": clientId,
      "X-App-Client-Key": clientkey,
      "X-App-Signature": clientSignature,
      "X-App-Timestamp": new Date().getTime(),
    },
  });
};

/**
 * Retrieves referrals information from the specified URL.
 *
 * @param url The URL from which to retrieve the referrals information.
 * @returns A Promise representing the referrals information request.
 */
export const getReferrals = (url: string) => {
  return axios({
    method: "get",
    url: url,
    headers: {
      "X-App-Timestamp": new Date().getTime(),
    },
  });
};

/**
 * Makes a POST request to 0box using the specified URL, data, client ID, public key, client signature, and ID token.
 *
 * @param url The URL to which the POST request is to be sent.
 * @param data The payload for the POST request.
 * @param clientId The client ID associated with the request.
 * @param publicKey The public key associated with the client.
 * @param clientSignature The client signature used for authentication.
 * @param idToken The ID token used for authentication.
 * @returns A Promise representing the POST request.
 */
export const postMethodTo0box = (
  url: string,
  data: any,
  clientId: string,
  publicKey: string,
  clientSignature: string,
  idToken: string
) => {
  const headers: ReqHeaders = {
    "X-App-ID-TOKEN": idToken,
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "X-App-Timestamp": new Date().getTime(),
    "X-App-Signature": 1234,
  };

  if (clientSignature) {
    headers["X-App-Signature"] = clientSignature;
  }

  return axios({
    method: "post",
    url: url,
    headers: headers,
    data: data,
  });
};

/**
 * Makes a DELETE request to 0box using the specified URL, data, client ID, public key, client signature, and ID token.
 *
 * @param url The URL to which the DELETE request is to be sent.
 * @param data The payload for the DELETE request.
 * @param clientId The client ID associated with the request.
 * @param publicKey The public key associated with the client.
 * @param clientSignature The client signature used for authentication.
 * @param idToken The ID token used for authentication.
 * @returns A Promise representing the DELETE request.
 */
export const deleteMethodTo0box = (
  url: string,
  data: any,
  clientId: string,
  publicKey: string,
  clientSignature: string,
  idToken: string
) => {
  const headers: ReqHeaders = {
    "X-App-ID-TOKEN": idToken,
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "X-App-Timestamp": new Date().getTime(),
    "X-App-Signature": 1234,
  };

  if (clientSignature) {
    headers["X-App-Signature"] = clientSignature;
  }

  const result = axios({
    method: "delete",
    url: url,
    headers: headers,
    data: data,
  });

  return result;
};

/**
 * Makes a POST request to a blobber using the specified URL, data, parameters, client ID, public key, and signature.
 *
 * @param url The URL to which the POST request is to be sent.
 * @param data The payload for the POST request.
 * @param params The parameters for the POST request.
 * @param clientId The client ID associated with the request.
 * @param publicKey The public key associated with the client.
 * @param signature The client signature used for authentication.
 * @returns A Promise representing the POST request.
 */
export const postReqToBlobber = async (
  url: string,
  data: any,
  params: AxiosRequestConfig<any>["params"],
  clientId: string,
  publicKey: string,
  signature: string
) => {
  const headers: ReqHeaders = {
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (signature) {
    headers["X-App-Client-Signature"] = signature;
    headers["Content-Type"] = `multipart/form-data; boundary=${data._boundary}`;
  }

  try {
    const response = await axios({
      method: "post",
      headers,
      params,
      data,
      url,
    });
    return response;
  } catch (error) {
    return error;
  }
};

/**
 * Makes a GET request to retrieve blobbers using the specified URL, parameters, and client ID.
 *
 * @param url The URL from which to retrieve the blobbers.
 * @param params The parameters for the GET request.
 * @param clientId The client ID associated with the request.
 * @returns A Promise representing the GET request.
 */
export const getReqBlobbers = (url: string, params: AxiosRequestConfig<any>["params"], clientId: string) => {
  return axios.get(url, {
    params,
    headers: {
      "X-App-Client-ID": clientId,
    },
    transformResponse: function (data) {
      return parseJson(data);
    },
  });
};

/**
 * Makes a GET request to the specified URL with the provided parameters.
 *
 * @param url The URL for the GET request.
 * @param params The parameters for the GET request.
 * @returns A Promise representing the GET request.
 */
export const getReq = (url: string, params: AxiosRequestConfig<any>["params"]) => {
  return axios.get(url, {
    params,
    transformResponse: function (data) {
      console.log("getReq transformResponse", data);
      return parseJson(data);
    },
  });
};

/**
 * Makes a GET request to the specified URL with the provided parameters for downloading a file.
 *
 * @param url The URL for the GET request.
 * @param params The parameters for the GET request.
 * @returns A Promise representing the GET request for downloading a file.
 */
export const getDownloadReq = (url: string, params: AxiosRequestConfig<any>["params"]) => {
  return axios.get(url, { params });
};

/**
 * Makes a plain GET request to the specified URL.
 *
 * @param url The URL for the GET request.
 * @returns A Promise representing the plain GET request.
 */
export const plainGet = (url: string) => axios({ method: "get", url: url });

/**
 * Makes a GET request to the specified URL with the provided parameters to a miner.
 *
 * @param url The URL for the GET request.
 * @param params The parameters for the GET request.
 * @returns A Promise representing the GET request to a miner.
 */
export const getReqFromMiner = async (url: string, params: AxiosRequestConfig<any>["params"]) => {
  return axios.get(url, { params });
};

/** Parses a JSON string using JSONbig library, which handles large numbers. */
export const parseJson = (jsonString: string) => {
  return JSONbig.parse(jsonString);
};

/**
 * Performs parallel POST requests to all miners and returns the result from the first successful request.
 *
 * @param miners An array of miner URLs.
 * @param url The path to where the POST request is to be sent.
 * @param postData The payload for the POST request.
 * @return A promise that resolves with the result from the first successful request or rejects with an error.
 */
export const doParallelPostReqToAllMiners = (miners: string[], url: string, postData: any) => {
  return new Promise<{ entity: TxnData }>(function (resolve, reject) {
    const urls = miners.map(miner => miner + url);
    const promises = urls.map(oneUrl => postReq(oneUrl, postData));
    let percentage = Math.ceil((promises.length * consensusPercentage) / 100);
    BlueBirdPromise.some(promises, percentage)
      .then(function (result) {
        resolve(result[0]?.data);
      })
      .catch(BlueBirdPromise.AggregateError, function (err: any) {
        reject({ error: err[0]?.code });
      });
  });
};

/**
 * Reads the content of a file as a Uint8Array.
 *
 * @param file The file object to read.
 * @returns A promise that resolves with the file content as a Uint8Array.
 */
export const readBytes = (file: File) => {
  const readerPromise = new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = (reader.result || []) as ArrayBuffer;
      const buffer = new Uint8Array(result);
      resolve(buffer);
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });

  return readerPromise;
};

/**
 * Performs a GET request to a random miner URL from the given list of miners.
 *
 * @param miners An array of miner URLs.
 * @param url The endpoint URL to send the GET request.
 * @param getData The query parameters for the GET request.
 * @returns A promise that resolves with the response from the successful request or rejects with an error.
 */
export const doGetReqToRandomMiner = async (
  miners: string[],
  url: string,
  getData: AxiosRequestConfig<any>["params"]
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let urls = miners.map(miner => miner + url);
      let shuffledMinerUrl = shuffleArray([...urls]);

      for (const url of shuffledMinerUrl) {
        const res = await getReqFromMiner(url, getData);
        if (res.status === 200) return resolve(res);
      }
      return reject({ error: "error while getting mnemonic" });
    } catch (err) {
      reject(err);
    }
  });
};

type BalanceResponse = { balance: number; nonce?: number };
/**
 * Retrieves the balance of a client from the sharders by making a consensus-based request.
 *
 * @param clientId The ID of the client.
 * @param domain The domain of the network.
 * @returns A promise that resolves with the balance information or rejects with an error.
 */
export const getBalanceUtil = async (clientId: string, domain: string): Promise<BalanceResponse> => {
  const { data: minersAndSharders } = await getMinersAndShardersUtils(domain);
  return new Promise((resolve, reject) => {
    getConsensusedInformationFromSharders(minersAndSharders.sharders, Endpoints.GET_BALANCE, {
      client_id: clientId,
    })
      .then(res => resolve(res as BalanceResponse))
      .catch(error => {
        if (error?.error === "value not present") {
          resolve({ balance: 0 });
        } else reject(error);
      });
  });
};

/**
 * Extracts relevant information from a transaction data object and returns a simplified transaction object.
 *
 * @param data The transaction data object.
 * @returns The simplified transaction object.
 */
export const getTransactionResponse = (data: TxnData) => {
  const txn: TxnData = {
    ...data,
    to_client_id: typeof data.to_client_id !== "undefined" ? data.to_client_id : null,
    txn_output_hash: typeof data.txn_output_hash !== "undefined" ? data.txn_output_hash : null,
  };
  return txn;
};

/**
 * Submits a transaction to the network.
 *
 * @param ae The wallet object.
 * @param toClientId The client ID of the recipient.
 * @param val The value to be transferred (in tokens).
 * @param note A note or description for the transaction.
 * @param transactionType The type of transaction.
 * @returns A promise that resolves with the transaction hash if the transaction is successful.
 */
export const submitTransaction = async (
  ae: AccountEntity,
  toClientId: string,
  val: number,
  note: string,
  transactionType: string,
  domain: string
) => {
  const hashPayload = sha3.sha3_256(note);
  const ts = Math.floor(new Date().getTime() / 1000);

  if (cachedNonce === undefined) {
    // initialize by 0 if there is no nonce from getBalance as well
    try {
      const { nonce } = await getBalanceUtil(ae.id, domain);
      cachedNonce = nonce ?? 0;
    } catch (err) {
      cachedNonce = 0;
    }
  }

  const nonceToUse = cachedNonce + 1;
  const hashdata = ts + ":" + nonceToUse + ":" + ae.id + ":" + toClientId + ":" + val + ":" + hashPayload;
  const hash = sha3.sha3_256(hashdata);
  const bytehash = hexStringToByte(hash);
  const sec = new bls.SecretKey();
  sec.deserializeHexStr(ae.secretKey);
  const sig = sec.sign(bytehash);

  const data = {
    client_id: ae.id,
    transaction_value: val,
    transaction_data: note,
    transaction_type: transactionType,
    transaction_nonce: nonceToUse,
    creation_date: ts,
    to_client_id: toClientId,
    hash: hash,
    transaction_fee: 1000000,
    signature: sig.serializeToHexStr(),
    version: "1.0",
    txn_output_hash: "",
    public_key: ae.public_key,
  };

  return new Promise(async function (resolve, reject) {
    const { data: minersAndSharders } = await getMinersAndShardersUtils(domain);
    doParallelPostReqToAllMiners(minersAndSharders.miners, Endpoints.PUT_TRANSACTION, data)
      .then(response => {
        cachedNonce += 1;

        resolve(getTransactionResponse(response.entity));
      })
      .catch(error => reject(error));
  });
};

/**
 * Retrieves the list of miners and sharders.
 * @param domain The domain of the network.
 * @returns  A Promise that resolves to the list of miners and sharders.
 */
export const getMinersAndShardersUtils = async (domain: string) => {
  if (!domain) return { error: "domain is required" };
  const { error, data } = await basicRequest({
    url: domain.startsWith("http") ? `${domain}/network` : `https://${domain}/dns/network`,
    options: { method: "GET" },
  });

  return { error, data };
};
