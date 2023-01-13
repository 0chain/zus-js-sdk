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

import sha3 from "js-sha3";
import JSONbig from "json-bigint";
import axios from "axios";
import BlueBirdPromise from "bluebird";
import moment from "moment";

const consensusPercentage = 20;

// This will return null if not enough consensus , otherwise will return max voted response
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

const parseConsensusMessage = function (finalResponse, parser) {
  const data = typeof parser !== "undefined" ? parser(finalResponse) : finalResponse;
  return data;
};

export const getConsensusedInformationFromSharders = (sharders, url, params, parser) => {
  const self = this;
  return new Promise(function (resolve, reject) {
    const urls = sharders.map((sharder) => sharder + url);
    const promises = urls.map((oneUrl) => self.getReq(oneUrl, params));
    let percentage = Math.ceil((promises.length * consensusPercentage) / 100);

    BlueBirdPromise.some(promises, percentage)
      .then(function (result) {
        const hashedResponses = result.map((r) => {
          return sha3.sha3_256(JSON.stringify(r.data));
        });

        const consensusResponse = getConsensusMessageFromResponse(
          hashedResponses,
          percentage,
          result,
        );
        if (consensusResponse === null) {
          reject({ error: "Not enough consensus" });
        } else {
          resolve(parseConsensusMessage(consensusResponse.data, parser));
        }
      })
      .catch(BlueBirdPromise.AggregateError, function (err) {
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
        if (consensusErrorResponse === null) {
          reject({ error: "Not enough consensus" });
        } else {
          try {
            reject(parseConsensusMessage(consensusErrorResponse.response.data));
          } catch (err) {
            reject(err);
          }
        }
      });
  });
};

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

  export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  export const toHex = (str) => {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
  }

  export const computeStoragePartDataId = (allocationId, path, fileName, partNum) => {
    return sha3.sha3_256(allocationId + ":" + path + ":" + fileName + ":" + partNum);
  }

  export const parseAuthTicket = (authTicket) => {
    var buff = new Buffer(authTicket, "base64");
    var data = buff.toString("ascii");
    return JSON.parse(data);
  }

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

  /*
       A utility function to make a post request.
       url: Complete URL along with path to where the post request is to be sent
       jsonPostString: A stringfy of JSON object the payload for the request
       Return: Returns a Promise.
   */

  export const postReq = (url, data, option) => {
    const self = this;
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
        return self.parseJson(responseData);
      },
    });
  }

  export const putReq = (url, data) => {
    const self = this;
    return axios({
      method: "put",
      url: url,
      data: data,
      transformResponse: function (responseData) {
        return self.parseJson(responseData);
      },
    });
  }

  export const delReq = (url, data) => {
    return axios({
      method: "delete",
      url: url,
      data: data,
    });
  }

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

  export const getReferrals = (url) => {
    return axios({
      method: "get",
      url: url,
      headers: {
        "X-App-Timestamp": new Date().getTime(),
      },
    });
  }

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

  export const getReqBlobbers = (url, params, clientId) => {
    const self = this;
    return axios.get(url, {
      params: params,
      headers: {
        "X-App-Client-ID": clientId,
      },
      transformResponse: function (data) {
        return self.parseJson(data);
      },
    });
  }

  export const getReq = (url, params) => {
    const self = this;
    /* tslint:disable:no-console */
    console.log("axios getReq url", url, "params", params);
    /* tslint:enable:no-console */
    return axios.get(url, {
      params: params,
      transformResponse: function (data) {
        return self.parseJson(data);
      },
    });
  }

  export const getDownloadReq = (url, params) => {
    return axios.get(url, {
      params: params,
    });
  }

  export const plainGet = (url) => {
    return axios({
      method: "get",
      url: url,
    });
  }

  export const getReqFromMiner = async(url, params) => {
    try {
      return await axios.get(url, {
        params: params,
      });
    } catch (err) {
      return err;
    }
  },

  export const parseJson = (jsonString) => {
    return JSONbig.parse(jsonString);
  }

  export const doParallelPostReqToAllMiners = (miners, url, postData) => {
    const self = this;
    return new Promise(function (resolve, reject) {
      const urls = miners.map((miner) => miner + url);
      const promises = urls.map((oneUrl) => self.postReq(oneUrl, postData));
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

  export const readBytes = (file) => 
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new Uint8Array(reader.result));
      };
      reader.readAsArrayBuffer(file);
    })

    export const doGetReqToRandomMiner = async (miners, url, getData) => {
    let self = this;

    return new Promise(async (resolve, reject) => {
      try {
        let urls = miners.map((miner) => miner + url);
        let shuffledMinerUrl = self.shuffleArray([...urls]);

        for (let i = 0; i < shuffledMinerUrl.length; i++) {
          const res = await self.getReqFromMiner(shuffledMinerUrl[i], getData);
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
