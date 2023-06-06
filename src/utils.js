/*
 * This file is part of the 0chain @zerochain/0chain distribution (https://github.com/0chain/client-sdk).
 * Copyright (c) 2018 0chain LLC.
 *
 * 0chain @zerochain/0chain program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

  /* tslint:disable:no-console */
var sha3 = require("js-sha3");
var JSONbig = require("json-bigint");
var axios = require("axios");
// import {Promise as BlueBirdPromise} from "bluebird";
var BlueBirdPromise  = require("bluebird");
var moment = require("moment");

const StorageSmartContractAddress =
  "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d7";
const MinerSmartContractAddress =
  "6dba10422e368813802877a85039d3985d96760ed844092319743fb3a76712d9";
const InterestPoolSmartContractAddress =
  "cf8d0df9bd8cc637a4ff4e792ffe3686da6220c45f0e1103baa609f3f1751ef4";

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
  miners: [
    "https://dev2.zus.network/miner01",
    "https://dev3.zus.network/miner01",
    "https://dev1.zus.network/miner01",
  ],
  sharders: ["https://dev1.zus.network/sharder01", "https://dev2.zus.network/sharder01", "https://dev3.zus.network/sharder01"],
};



const consensusPercentage = 20;
let cachedNonce;

/**
 * Returns the consensus message from a set of hashed responses.
 * If there is enough consensus (at least `consensusNo` matching hashes), it returns the corresponding response.
 * Otherwise, it returns null.
 *
 * @param {Array} hashedResponses - An array of hashed responses.
 * @param {number} consensusNo - The minimum number of matching hashes required for consensus.
 * @param {Array} responseArray - An array of corresponding responses.
 * @returns {*} - The consensus message or null if there is not enough consensus.
 */
const getConsensusMessageFromResponse = function (hashedResponses, consensusNo, responseArray) {
  let uniqueCounts = {};

  hashedResponses.forEach(function (x) {
    uniqueCounts[x] = (uniqueCounts[x] || 0) + 1;
  });
  var maxResponses = { key: hashedResponses[0], val: uniqueCounts[hashedResponses[0]] };

  for (var key in uniqueCounts) {
    if (uniqueCounts.hasOwnProperty(key)) {
      if (maxResponses.val < uniqueCounts[key]) {
        maxResponses = { key: key, val: uniqueCounts[key] };
      }
    }
  }

  if (maxResponses.val >= consensusNo) {
    let responseIndex = hashedResponses.indexOf(maxResponses.key);
    return responseArray[responseIndex];
  } else {
    return null;
  }
};

/**
 * Parses the consensus message using the provided parser function.
 *
 * @param {*} finalResponse - The consensus message to parse.
 * @param {Function} parser - The parser function to apply to the consensus message. (optional)
 * @returns {*} - The parsed data.
 */
const parseConsensusMessage = function (finalResponse, parser) {
  const data = typeof parser !== "undefined" ? parser(finalResponse) : finalResponse;
  return data;
};

/**
 * Retrieves consensus-based information from a set of sharders.
 *
 * @param {Array} sharders - An array of sharder URLs.
 * @param {string} url - The endpoint URL.
 * @param {Object} params - The parameters to include in the request.
 * @param {Function} parser - The parser function to apply to the consensus response.
 * @returns {Promise<*>} - A Promise that resolves to the parsed consensus information.
 */
export const getConsensusedInformationFromSharders = (sharders, url, params, parser) => {
  return new Promise(function (resolve, reject) {
    const urls = sharders.map((sharder) => sharder + url);
    const promises = urls.map((oneUrl) => getReq(oneUrl, params));
    let percentage = Math.ceil((promises.length * consensusPercentage) / 100);
    console.log('BlueBirdPromise', BlueBirdPromise);
    console.log('promises', promises)

    BlueBirdPromise.some(promises, percentage)
      .then(function (result) {
        console.log('then result', result);
        const hashedResponses = result.map((r) => {
          console.log('result.map r', r);
          return sha3.sha3_256(JSON.stringify(r.data));
        });
        console.log('hashedResponses', hashedResponses)
        const consensusResponse = getConsensusMessageFromResponse(
          hashedResponses,
          percentage,
          result,
        );
        console.log('consensusResponse', consensusResponse)
        if (consensusResponse === null) {
          reject({ error: "Not enough consensus" });
        } else {
          resolve(parseConsensusMessage(consensusResponse.data, parser));
        }
      })
      .catch(BlueBirdPromise.AggregateError, function (err) {
        console.log('err', err)
        const errors = err.map((e) => {
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
        const consensusErrorResponse = getConsensusMessageFromResponse(
          errors,
          percentage,
          err,
          undefined,
        );
        console.log('consensusErrorResponse', consensusErrorResponse)
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
 * @param {Uint8Array} uint8arr - The Uint8Array to convert.
 * @returns {string} - The hexadecimal string representation of the Uint8Array.
 */
export const byteToHexString = (uint8arr)  => {
  if (!uint8arr) {
    return "";
  }
  var hexStr = "";

  for (var i = 0; i < uint8arr.length; i++) {
    /* tslint:disable:no-bitwise */
    var hex = (uint8arr[i] & 0xff).toString(16);
    /* tslint:enable:no-bitwise */
    hex = hex.length === 1 ? "0" + hex : hex;
    hexStr += hex;
  }
  return hexStr;
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 *
 * @param {string} str - The hexadecimal string to convert.
 * @returns {Uint8Array} - The Uint8Array representation of the hexadecimal string.
 */
export const hexStringToByte = (str) => {
  if (!str) {
    return new Uint8Array();
  }
  var a = [];
  for (var i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }
  return new Uint8Array(a);
}

/**
 * Shuffles the elements in an array using the Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
export const shuffleArray = (array) => {
  var m = array.length;
  var t;
  var i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

/**
 * Pauses the execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise} - A Promise that resolves after the specified sleep duration.
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a string to its hexadecimal representation.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The hexadecimal representation of the string.
 */
export const toHex = (str) => {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}

/**
 * Computes the data ID for a specific storage part.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path to the file.
 * @param {string} fileName - The name of the file.
 * @param {number} partNum - The part number.
 * @returns {string} - The computed data ID.
 */
export const computeStoragePartDataId = (allocationId, path, fileName, partNum) => {
  return sha3.sha3_256(allocationId + ":" + path + ":" + fileName + ":" + partNum);
}

/**
 * Parses an authTicket (authTicket) and returns the parsed data.
 *
 * @param {string} authTicket - The authTicket to parse.
 * @returns {Object} - The parsed data from the authTicket.
 */
export const parseAuthTicket = (authTicket) => {
  var buff = new Buffer(authTicket, "base64");
  var data = buff.toString("ascii");
  return JSON.parse(data);
}

/**
 * Parses wallet information from an AE (AccountEntity) object and returns the parsed data.
 *
 * @param {object} ae - The AccountEntity object containing wallet information.
 * @returns {object} - The parsed wallet information.
 */
export const parseWalletInfo = (ae) => {
  return {
    client_id: ae.id,
    client_key: ae.public_key,
    keys: [
      {
        public_key: ae.public_key,
        private_key: ae.secretKey,
      },
    ],
    mnemonics:
      "bar figure position super change stage beach version word raise busy problem misery poet crystal gravity gospel fun become bring ready width object glance",
    version: "1.0",
    date_created: moment.unix(ae.timeStamp).format("YYYY-MM-DD HH:mm:ss"),
  };
}

/**
 * Makes a POST request to the specified URL with the given data.
 *
 * @param {string} url - The complete URL including the path to where the POST request is to be sent.
 * @param {object} data - The payload for the POST request.
 * @param {object} option - Additional options for the request (optional).
 * @returns {Promise} - A Promise representing the POST request.
 */
export const postReq = (url, data, option) => {
  return axios({
    method: "post",
    url: url,
    data: data,
    onUploadProgress: function (progressEvent) {
      if (option) {
        option.onUploadProgress(progressEvent);
      }
    },
    transformResponse: function (responseData) {
      return parseJson(responseData);
    },
  });
}

/**
 * Makes a PUT request to the specified URL with the given data.
 *
 * @param {string} url - The complete URL including the path to where the PUT request is to be sent.
 * @param {object} data - The payload for the PUT request.
 * @returns {Promise} - A Promise representing the PUT request.
 */
export const putReq = (url, data) => {
  return axios({
    method: "put",
    url: url,
    data: data,
    transformResponse: function (responseData) {
      return parseJson(responseData);
    },
  });
}

/**
 * Makes a DELETE request to the specified URL with the given data.
 *
 * @param {string} url - The complete URL including the path to where the DELETE request is to be sent.
 * @param {object} data - The payload for the DELETE request.
 * @returns {Promise} - A Promise representing the DELETE request.
 */
export const delReq = (url, data) => {
  return axios({
    method: "delete",
    url: url,
    data: data,
  });
}

/**
 * Recovers a wallet from the cloud using the specified URL, App ID Token, and App Phone Number.
 *
 * @param {string} url - The URL from which to recover the wallet.
 * @param {string} AppIDToken - The App ID Token used for authentication.
 * @param {string} AppPhoneNumber - The App Phone Number associated with the wallet.
 * @returns {Promise} - A Promise representing the recovery request.
 */
export const recoverWalletFromCloud = (url, AppIDToken, AppPhoneNumber) => {
  return axios({
    method: "get",
    url: url,
    headers: {
      "X-App-ID-TOKEN": AppIDToken,
      "X-App-Phone-Number": AppPhoneNumber,
    },
  });
}

/**
 * Retrieves share information from the specified URL using the provided client signature, client ID, and client key.
 *
 * @param {string} url - The URL from which to retrieve the share information.
 * @param {string} clientSignature - The client signature used for authentication.
 * @param {string} clientId - The client ID associated with the share.
 * @param {string} clientkey - The client key used for authentication.
 * @returns {Promise} - A Promise representing the share information request.
 */
export const getShareInfo = (url, clientSignature, clientId, clientkey) => {
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
}

/**
 * Retrieves referrals information from the specified URL.
 *
 * @param {string} url - The URL from which to retrieve the referrals information.
 * @returns {Promise} - A Promise representing the referrals information request.
 */
export const getReferrals = (url) => {
  return axios({
    method: "get",
    url: url,
    headers: {
      "X-App-Timestamp": new Date().getTime(),
    },
  });
}

/**
 * Makes a POST request to 0box using the specified URL, data, client ID, public key, client signature, and ID token.
 *
 * @param {string} url - The URL to which the POST request is to be sent.
 * @param {object} data - The payload for the POST request.
 * @param {string} clientId - The client ID associated with the request.
 * @param {string} publicKey - The public key associated with the client.
 * @param {string} clientSignature - The client signature used for authentication.
 * @param {string} idToken - The ID token used for authentication.
 * @returns {Promise} - A Promise representing the POST request.
 */
export const postMethodTo0box = (url, data, clientId, publicKey, clientSignature, idToken) => {
  const headers = {
    "X-App-ID-TOKEN": idToken,
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "X-App-Timestamp": new Date().getTime(),
    "X-App-Signature": 1234,
  };

  if (client_signature) {
    headers["X-App-Signature"] = clientSignature;
  }

  return axios({
    method: "post",
    url: url,
    headers: headers,
    data: data,
  });
}

/**
 * Makes a DELETE request to 0box using the specified URL, data, client ID, public key, client signature, and ID token.
 *
 * @param {string} url - The URL to which the DELETE request is to be sent.
 * @param {object} data - The payload for the DELETE request.
 * @param {string} clientId - The client ID associated with the request.
 * @param {string} publicKey - The public key associated with the client.
 * @param {string} clientSignature - The client signature used for authentication.
 * @param {string} idToken - The ID token used for authentication.
 * @returns {Promise} - A Promise representing the DELETE request.
 */
export const deleteMethodTo0box = (url, data, clientId, publicKey, clientSignature, idToken) => {
  const headers = {
    "X-App-ID-TOKEN": idToken,
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "X-App-Timestamp": new Date().getTime(),
    "X-App-Signature": 1234,
  };

  if (client_signature) {
    headers["X-App-Signature"] = clientSignature;
  }

  const result = axios({
    method: "delete",
    url: url,
    headers: headers,
    data: data,
  });

  return result;
}

/**
 * Makes a POST request to a blobber using the specified URL, data, parameters, client ID, public key, and signature.
 *
 * @param {string} url - The URL to which the POST request is to be sent.
 * @param {object} data - The payload for the POST request.
 * @param {object} params - The parameters for the POST request.
 * @param {string} clientId - The client ID associated with the request.
 * @param {string} publicKey - The public key associated with the client.
 * @param {string} signature - The client signature used for authentication.
 * @returns {Promise} - A Promise representing the POST request.
 */
export const postReqToBlobber = (url, data, params, clientId, publicKey, signature) => {
  const headers = {
    "X-App-Client-ID": clientId,
    "X-App-Client-Key": publicKey,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (signature) {
    headers["X-App-Client-Signature"] = signature;
    headers["Content-Type"] = `multipart/form-data; boundary=${data._boundary}`;
  }

  return axios({
    method: "post",
    headers,
    params,
    data,
    url,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
}

/**
 * Makes a GET request to retrieve blobbers using the specified URL, parameters, and client ID.
 *
 * @param {string} url - The URL from which to retrieve the blobbers.
 * @param {object} params - The parameters for the GET request.
 * @param {string} clientId - The client ID associated with the request.
 * @returns {Promise} - A Promise representing the GET request.
 */
export const getReqBlobbers = (url, params, clientId) => {
  return axios.get(url, {
    params: params,
    headers: {
      "X-App-Client-ID": clientId,
    },
    transformResponse: function (data) {
      return parseJson(data);
    },
  });
}

/**
 * Makes a GET request to the specified URL with the provided parameters.
 *
 * @param {string} url - The URL for the GET request.
 * @param {object} params - The parameters for the GET request.
 * @returns {Promise} - A Promise representing the GET request.
 */
export const getReq = (url, params) => {
  console.log("axios getReq url", url, "params", params);
  return axios.get(url, {
    params: params,
    transformResponse: function (data) {
      console.log('getReq transformResponse', data)
      return parseJson(data);
    },
  });
}

/**
 * Makes a GET request to the specified URL with the provided parameters for downloading a file.
 *
 * @param {string} url - The URL for the GET request.
 * @param {object} params - The parameters for the GET request.
 * @returns {Promise} - A Promise representing the GET request for downloading a file.
 */
export const getDownloadReq = (url, params) => {
  return axios.get(url, {
    params: params,
  });
}

/**
 * Makes a plain GET request to the specified URL.
 *
 * @param {string} url - The URL for the GET request.
 * @returns {Promise} - A Promise representing the plain GET request.
 */
export const plainGet = (url) => {
  return axios({
    method: "get",
    url: url,
  });
}

/**
 * Makes a GET request to the specified URL with the provided parameters to a miner.
 *
 * @param {string} url - The URL for the GET request.
 * @param {object} params - The parameters for the GET request.
 * @returns {Promise} - A Promise representing the GET request to a miner.
 */
export const getReqFromMiner = async(url, params) => {
  try {
    return await axios.get(url, {
      params: params,
    });
  } catch (err) {
    return err;
  }
},

/**
 * Parses a JSON string using JSONbig library, which handles large numbers.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @returns {object} - The parsed JSON object.
 */
export const parseJson = (jsonString) => {
  return JSONbig.parse(jsonString);
}

/**
 * Performs parallel POST requests to all miners and returns the result from the first successful request.
 *
 * @param {string[]} miners - An array of miner URLs.
 * @param {string} url - The path to where the POST request is to be sent.
 * @param {object} postData - The payload for the POST request.
 * @returns {Promise} - A promise that resolves with the result from the first successful request or rejects with an error.
 */
export const doParallelPostReqToAllMiners = (miners, url, postData) => {
  return new Promise(function (resolve, reject) {
    const urls = miners.map((miner) => miner + url);
    const promises = urls.map((oneUrl) => postReq(oneUrl, postData));
    let percentage = Math.ceil((promises.length * consensusPercentage) / 100);
    BlueBirdPromise.some(promises, percentage)
      .then(function (result) {
        resolve(result[0].data);
      })
      .catch(BlueBirdPromise.AggregateError, function (err) {
        reject({ error: err[0].code });
      });
  });
}

/**
 * Reads the content of a file as a Uint8Array.
 *
 * @param {File} file - The file object to read.
 * @returns {Promise<Uint8Array>} - A promise that resolves with the file content as a Uint8Array.
 */
export const readBytes = (file) => 
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(file);
  })

/**
 * Performs a GET request to a random miner URL from the given list of miners.
 *
 * @param {string[]} miners - An array of miner URLs.
 * @param {string} url - The endpoint URL to send the GET request.
 * @param {object} getData - The query parameters for the GET request.
 * @returns {Promise} - A promise that resolves with the response from the successful request or rejects with an error.
 */
export const doGetReqToRandomMiner = async (miners, url, getData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let urls = miners.map((miner) => miner + url);
      let shuffledMinerUrl = shuffleArray([...urls]);

      for (let i = 0; i < shuffledMinerUrl.length; i++) {
        const res = await getReqFromMiner(shuffledMinerUrl[i], getData);
        if (res.status === 200) {
          return resolve(res);
        }
      }
      return reject({ error: "error while getting mnemonic" });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieves the balance of a client from the sharders by making a consensus-based request.
 *
 * @param {string} clientId - The ID of the client.
 * @returns {Promise} - A promise that resolves with the balance information or rejects with an error.
 */
export const getBalanceUtil = async (clientId) => {
  return new Promise((resolve, reject) => {
    getConsensusedInformationFromSharders(configJson.sharders, Endpoints.GET_BALANCE, {
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

/**
 * Extracts relevant information from a transaction data object and returns a simplified transaction object.
 *
 * @param {Object} data - The transaction data object.
 * @returns {Object} - The simplified transaction object.
 */
export const getTransactionResponse = (data) => {
  const txn = {};
  txn.hash = data.hash;
  txn.version = data.version;
  txn.client_id = data.client_id;
  txn.to_client_id = (typeof data.to_client_id !== 'undefined') ? data.to_client_id : null;
  txn.chain_id = data.chain_id;
  txn.transaction_data = data.transaction_data;
  txn.transaction_value = data.transaction_value;
  txn.signature = data.signature;
  txn.creation_date = data.creation_date;
  txn.transaction_type = data.transaction_type;
  txn.transaction_output = data.transaction_output;
  txn.txn_output_hash = (typeof data.txn_output_hash !== 'undefined') ? data.txn_output_hash : null;
}

/**
 * Submits a transaction to the network.
 *
 * @param {Object} ae - The wallet object.
 * @param {string} toClientId - The client ID of the recipient.
 * @param {number} val - The value to be transferred.
 * @param {string} note - A note or description for the transaction.
 * @param {string} transactionType - The type of transaction.
 * @returns {Promise} - A promise that resolves with the transaction hash if the transaction is successful.
 */
export const submitTransaction = async (ae, toClientId, val, note, transactionType) => {
  const hashPayload = sha3.sha3_256(note);
  const ts = Math.floor(new Date().getTime() / 1000);

  if (cachedNonce === undefined) {
      //initialize by 0 if there is no nonce from getBalance as well
      try {
          const { nonce } = await getBalanceUtil(ae.id)
          cachedNonce = nonce ?? 0   
      }
      catch (err) {
          cachedNonce = 0  
      }
  }

  const nonceToUse = cachedNonce+1
  const hashdata = ts + ":" + nonceToUse + ":" + ae.id + ":" + toClientId + ":" + val + ":" + hashPayload;
  const hash = sha3.sha3_256(hashdata);
  const bytehash = hexStringToByte(hash);
  const sec = new bls.SecretKey();
  sec.deserializeHexStr(ae.secretKey);
  const sig = sec.sign(bytehash);

  var data = {};
  data.client_id = ae.id;
  data.transaction_value = val;
  data.transaction_data = note;
  data.transaction_type = transactionType;
  data.transaction_nonce = nonceToUse;
  data.creation_date = ts;
  data.to_client_id = toClientId;
  data.hash = hash;
  data.transaction_fee = 0;
  data.signature = sig.serializeToHexStr();
  data.version = '1.0';
  data.txn_output_hash = "";
  data.public_key = ae.public_key;

  return new Promise(function (resolve, reject) {
    doParallelPostReqToAllMiners(configJson.miners, Endpoints.PUT_TRANSACTION, data)
        .then((response) => {
            cachedNonce +=1

            resolve(getTransactionResponse(response.entity));
        })
        .catch((error) => {
            reject(error);
        })
  });
}
