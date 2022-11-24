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

var sha3 = require("js-sha3");
var JSONbig = require("json-bigint");
const axios = require("axios");
var BlueBirdPromise = require("bluebird");
const moment = require("moment");

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

module.exports = {
  byteToHexString: function byteToHexString(uint8arr) {
    if (!uint8arr) {
      return "";
    }
    var hexStr = "";

    for (var i = 0; i < uint8arr.length; i++) {
      var hex = (uint8arr[i] & 0xff).toString(16);
      hex = hex.length === 1 ? "0" + hex : hex;
      hexStr += hex;
    }
    return hexStr;
  },

  hexStringToByte: function hexStringToByte(str) {
    if (!str) {
      return new Uint8Array();
    }
    var a = [];
    for (var i = 0, len = str.length; i < len; i += 2) {
      a.push(parseInt(str.substr(i, 2), 16));
    }
    return new Uint8Array(a);
  },

  shuffleArray: function shuffleArray(array) {
    var m = array.length,
      t,
      i;

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
  },

  sleep: function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  toHex: (str) => {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
  },

  computeStoragePartDataId: function (allocationId, path, fileName, partNum) {
    return sha3.sha3_256(allocationId + ":" + path + ":" + fileName + ":" + partNum);
  },

  parseAuthTicket: function (auth_ticket) {
    var buff = new Buffer(auth_ticket, "base64");
    var data = buff.toString("ascii");
    return JSON.parse(data);
  },

  parseWalletInfo: function (ae) {
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
  },
  /*
       A utility function to make a post request.
       url: Complete URL along with path to where the post request is to be sent
       jsonPostString: A stringfy of JSON object the payload for the request
       Return: Returns a Promise.
   */

  postReq: function postReq(url, data, option) {
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
  },

  putReq: function putReq(url, data) {
    const self = this;
    return axios({
      method: "put",
      url: url,
      data: data,
      transformResponse: function (responseData) {
        return self.parseJson(responseData);
      },
    });
  },

  delReq: function delReq(url, data) {
    return axios({
      method: "delete",
      url: url,
      data: data,
    });
  },

  recoverWalletFromCloud: function recoverWalletFromCloud(url, AppIDToken, AppPhoneNumber) {
    return axios({
      method: "get",
      url: url,
      headers: {
        "X-App-ID-TOKEN": AppIDToken,
        "X-App-Phone-Number": AppPhoneNumber,
      },
    });
  },

  getShareInfo: function getShareInfo(url, client_signature, clientId, clientkey) {
    return axios({
      method: "get",
      url: url,
      headers: {
        "X-App-Client-ID": clientId,
        "X-App-Client-Key": clientkey,
        "X-App-Signature": client_signature,
        "X-App-Timestamp": new Date().getTime(),
      },
    });
  },

  getReferrals: function getReferrals(url) {
    return axios({
      method: "get",
      url: url,
      headers: {
        "X-App-Timestamp": new Date().getTime(),
      },
    });
  },

  postMethodTo0box: function (url, data, clientId, public_key, client_signature, id_token) {
    const headers = {
      "X-App-ID-TOKEN": id_token,
      "X-App-Client-ID": clientId,
      "X-App-Client-Key": public_key,
      "X-App-Timestamp": new Date().getTime(),
      "X-App-Signature": 1234,
    };

    if (client_signature) {
      headers["X-App-Signature"] = client_signature;
    }

    return axios({
      method: "post",
      url: url,
      headers: headers,
      data: data,
    });
  },

  deleteMethodTo0box: function (url, data, clientId, public_key, client_signature, id_token) {
    const headers = {
      "X-App-ID-TOKEN": id_token,
      "X-App-Client-ID": clientId,
      "X-App-Client-Key": public_key,
      "X-App-Timestamp": new Date().getTime(),
      "X-App-Signature": 1234,
    };

    if (client_signature) {
      headers["X-App-Signature"] = client_signature;
    }

    const result = axios({
      method: "delete",
      url: url,
      headers: headers,
      data: data,
    });

    return result;
  },

  postReqToBlobber: function postReqToBlobber(url, data, params, clientId, public_key, signature) {
    const headers = {
      "X-App-Client-ID": clientId,
      "X-App-Client-Key": public_key,
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
  },

  getReqBlobbers: function getReqBlobbers(url, params, clientId) {
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
  },

  getReq: function getReq(url, params) {
    const self = this;
    console.log("axios getReq url", url, "params", params);
    return axios.get(url, {
      params: params,
      transformResponse: function (data) {
        return self.parseJson(data);
      },
    });
  },

  getDownloadReq: function getDownloadReq(url, params) {
    return axios.get(url, {
      params: params,
    });
  },

  plainGet: function plainGet(url) {
    return axios({
      method: "get",
      url: url,
    });
  },

  getReqFromMiner: async function getReqFromMiner(url, params) {
    try {
      return await axios.get(url, {
        params: params,
      });
    } catch (err) {
      return err;
    }
  },

  parseJson: function (jsonString) {
    return JSONbig.parse(jsonString);
  },

  getConsensusMessageFromResponse: getConsensusMessageFromResponse,

  getConsensusedInformationFromSharders: function (sharders, url, params, parser) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const urls = sharders.map((sharder) => sharder + url);
      const promises = urls.map((url) => self.getReq(url, params));
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
  },

  doParallelPostReqToAllMiners: function (miners, url, postData) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const urls = miners.map((miner) => miner + url);
      const promises = urls.map((url) => self.postReq(url, postData));
      let percentage = Math.ceil((promises.length * consensusPercentage) / 100);
      BlueBirdPromise.some(promises, percentage)
        .then(function (result) {
          resolve(result[0].data);
        })
        .catch(BlueBirdPromise.AggregateError, function (err) {
          reject({ error: err[0].code });
        });
    });
  },

  readBytes: (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new Uint8Array(reader.result));
      };
      reader.readAsArrayBuffer(file);
    }),

  doGetReqToRandomMiner: async function (miners, url, getData) {
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
  },
};
