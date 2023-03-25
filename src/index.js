import { getBalanceUtil, submitTransaction } from "./utils";
import { createWasm } from "./zcn";
import * as bip39 from "bip39";
import { sha3_256 } from "js-sha3";
import { Buffer as buff } from "buffer";

let bls;
let goWasm;
let Buffer;

/* tslint:disable:no-console */

const TransactionType = {
  SEND: 0, // A transaction to send tokens to another account, state is maintained by account
  DATA: 10, // A transaction to just store a piece of data on the block chain
  // STORAGE_WRITE : 101, // A transaction to write data to the blobber
  // STORAGE_READ  : 103,// A transaction to read data from the blobber
  SMART_CONTRACT: 1000, // A smart contract transaction type
};

export const init = async (config) => {
  console.log("config", config);

  const wasm = await createWasm();
  console.log("wasm", wasm);

  await wasm.sdk.showLogs();

  console.log(...config);
  await wasm.sdk.init(...config);

  console.log("window.bls", window.bls);
  bls = window.bls;
  console.log("bls", bls);
  await bls.init(bls.BN254);

  goWasm = wasm;
  window.Buffer = buff;
  Buffer = buff;
};

export const Greeter = (name) => `Hello ${name?.toUpperCase()}`;

export const getBalance = async (clientId) => {
  return getBalanceUtil(clientId);
};

export const sendTransaction = async (ae, toClientId, val, note) => {
  console.log("sendTransaction from:", ae, "to:", toClientId, "value:", val, "note:", note);
  return submitTransaction(ae, toClientId, val, note, TransactionType.SEND);
};

export const getBalanceWasm = async (clientId) => {
  const balanceObj = await goWasm.sdk.getWalletBalance(clientId);
  return balanceObj;
};

export const setWallet = async (clientID, privateKey, publicKey, mnemonic) => {
  console.log("START setWallet", { clientID, privateKey, publicKey, mnemonic });
  await goWasm.setWallet(bls, clientID, privateKey, publicKey, mnemonic);
  console.log("END setWallet", { clientID, privateKey, publicKey, mnemonic });
};

export const listAllocations = async () => {
  const allocations = await goWasm.sdk.listAllocations();
  return allocations;
};

export const createAllocation = async (allocationConfig) => {
  console.log("allocationConfig", allocationConfig);
  await goWasm.sdk.createAllocation(
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

export const createAllocationWithBlobbers = async (allocationConfig) => {
  console.log("createAllocationWithBlobbers allocationConfig", allocationConfig);
  const txn = await goWasm.sdk.createAllocation(
    allocationConfig.datashards,
    allocationConfig.parityshards,
    allocationConfig.size,
    allocationConfig.expiry,
    allocationConfig.minReadPrice,
    allocationConfig.maxReadPrice,
    allocationConfig.minWritePrice,
    allocationConfig.maxWritePrice,
    allocationConfig.lock,
    allocationConfig.blobbers,
  );
  return txn;
};

export const getAllocation = async (allocationId) => {
  const allocation = await goWasm.sdk.getAllocation(allocationId);
  return allocation;
};

export const getAllocationFromAuthTicket = async (authTicket) => {
  console.log("getAllocationFromAuthTicket", authTicket);
  const allocation = await goWasm.sdk.getAllocationWith(authTicket);
  return allocation;
};

export const reloadAllocation = async (allocationId) => {
  console.log("reloadAllocation");
  const allocation = await goWasm.sdk.reloadAllocation(allocationId);
  return allocation;
};

export const freezeAllocation = async (allocationId) => {
  console.log("freezeAllocation");
  const hash = await goWasm.sdk.freezeAllocation(allocationId);
  return hash;
};

export const cancelAllocation = async (allocationId) => {
  console.log("cancelAllocation");
  const hash = await goWasm.sdk.cancelAllocation(allocationId);
  return hash;
};

//allocationId string, name string,size, expiry int64,lock int64,setImmutable, updateTerms bool,addBlobberId, removeBlobberId string
export const updateAllocation = async (
  allocationId,
  name,
  size,
  expiry,
  lock,
  setImmutable,
  updateTerms,
  addBlobberId,
  removeBlobberId,
) => {
  console.log("updateAllocation");
  const hash = await goWasm.sdk.updateAllocation(
    allocationId,
    name,
    size,
    expiry,
    lock,
    setImmutable,
    updateTerms,
    addBlobberId,
    removeBlobberId,
  );
  return hash;
};

export const bulkUpload = async (objects) => {
  console.log("bulkUpload objects", objects);
  const results = await goWasm.bulkUpload(objects);
  return results;
};

//allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int, callbackFuncName string
export const download = async (
  allocationID,
  remotePath,
  authTicket,
  lookupHash,
  downloadThumbnailOnly,
  numBlocks,
  callbackFuncName,
) => {
  console.log("download allocationID", allocationID, "remotePath", remotePath);
  const file = await goWasm.sdk.download(
    allocationID,
    remotePath,
    authTicket,
    lookupHash,
    downloadThumbnailOnly,
    numBlocks,
    callbackFuncName,
  );
  return file;
};

export const getFaucetToken = async () => {
  console.log("faucet before");
  await goWasm.sdk.faucet("pour", JSON.stringify("{Pay day}"), 0);
  console.log("faucet after");
};

export const executeSmartContract = async (address, methodName, input, value) => {
  console.log("executeSmartContract before", address, methodName, input, value);
  await goWasm.sdk.executeSmartContract(address, methodName, input, value);
  console.log("executeSmartContract after");
};

export const listObjects = async (allocationId, path) => {
  console.log("listObjects", allocationId, path);
  const { list = [] } = await goWasm.sdk.listObjects(allocationId, path);
  return list;
};

//allocationId, filePath, clientId, encryptionPublicKey string, expireAt int, revoke bool,availableAfter string
export const share = async (
  allocationId,
  filePath,
  clientId,
  encryptionPublicKey,
  expireAt,
  revoke,
  availableAfter,
) => {
  console.log("share allocationId", allocationId, "filePath", filePath);

  const authTicket = await goWasm.sdk.share(
    allocationId,
    filePath,
    clientId,
    encryptionPublicKey,
    expireAt,
    revoke,
    availableAfter,
  );

  console.log("authTicket after share", authTicket);
  return authTicket;
};

export const showLogs = async () => {
  console.log("showLogs");
  await goWasm.sdk.showLogs();
};

export const hideLogs = async () => {
  console.log("hideLogs");
  await goWasm.sdk.hideLogs();
};

export const deleteObject = async (allocationId, path) => {
  console.log("deleteObject");
  await goWasm.sdk.delete(allocationId, path);
};

export const renameObject = async (allocationId, path, newName) => {
  console.log("renameObject");
  await goWasm.sdk.rename(allocationId, path, newName);
};

export const copyObject = async (allocationId, path, destination) => {
  console.log("copyObject");
  await goWasm.sdk.copy(allocationId, path, destination);
};

export const moveObject = async (allocationId, path, destination) => {
  console.log("moveObject");
  await goWasm.sdk.move(allocationId, path, destination);
};

export const play = async (allocationId, remotePath, authTicket, lookupHash, isLive) => {
  console.log("play");
  await goWasm.sdk.play(allocationId, remotePath, authTicket, lookupHash, isLive);
};

export const stop = async () => {
  console.log("stop");
  await goWasm.sdk.stop();
};

export const getNextSegment = async () => {
  console.log("getNextSegment");
  const buf = await goWasm.sdk.getNextSegment();
  console.log("buf", buf);
  return buf;
};

export const createDir = async (allocationId, path) => {
  console.log("createDir", path);
  await goWasm.sdk.createDir(allocationId, path);
};

export const getFileStats = async (allocationId, path) => {
  console.log("getFileStats", path);
  const fileStats = await goWasm.sdk.getFileStats(allocationId, path);
  console.log("fileStats", fileStats);
  return fileStats;
};

//allocationID, remotePath, authTicket, lookupHash string, numBlocks int, startBlockNumber, endBlockNumber int64, callbackFuncName string
export const downloadBlocks = async (
  allocationID,
  remotePath,
  authTicket,
  lookupHash,
  numBlocks,
  startBlockNumber,
  endBlockNumber,
  callbackFuncName,
) => {
  console.log("downloadBlocks allocationID", allocationID, "remotePath", remotePath);
  const output = await goWasm.sdk.downloadBlocks(
    allocationID,
    remotePath,
    authTicket,
    lookupHash,
    numBlocks,
    startBlockNumber,
    endBlockNumber,
    callbackFuncName,
  );
  return output;
};

export const getUSDRate = async (symbol) => {
  console.log("getUSDRate", symbol);
  const usdRate = await goWasm.sdk.getUSDRate(symbol);
  return usdRate;
};

export const isWalletID = async (clientID) => {
  console.log("isWalletID", clientID);
  const result = await goWasm.sdk.isWalletID(clientID);
  return result;
};

export const getPublicEncryptionKey = async (mnemonic) => {
  console.log("getPublicEncryptionKey", mnemonic);
  const publicKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);
  return publicKey;
};

export const getLookupHash = async (allocationId, path) => {
  console.log("getLookupHash", allocationId, path);
  const hash = await goWasm.sdk.getLookupHash(allocationId, path);
  return hash;
};

//referredBlobberURLs []string, dataShards, parityShards int, size, expiry int64, minReadPrice, maxReadPrice, minWritePrice, maxWritePrice int64
export const getAllocationBlobbers = async (
  referredBlobberURLs,
  dataShards,
  parityShards,
  size,
  expiry,
  minReadPrice,
  maxReadPrice,
  minWritePrice,
  maxWritePrice,
) => {
  console.log("getAllocationBlobbers", referredBlobberURLs);
  const blobberList = await goWasm.sdk.getAllocationBlobbers(
    referredBlobberURLs,
    dataShards,
    parityShards,
    size,
    expiry,
    minReadPrice,
    maxReadPrice,
    minWritePrice,
    maxWritePrice,
  );
  return blobberList;
};

//blobberUrls []string
export const getBlobberIds = async (blobberUrls) => {
  console.log("getBlobberIds", blobberUrls);
  const blobberIds = await goWasm.sdk.getBlobberIds(blobberUrls);
  return blobberIds;
};

export const getBlobbers = async () => {
  console.log("getBlobbers");
  const blobberList = await goWasm.sdk.getBlobbers();
  return blobberList;
};

export const createReadPool = async () => {
  console.log("createReadPool");
  const result = await goWasm.sdk.createReadPool();
  return result;
};

export const getReadPoolInfo = async (clientID) => {
  console.log("getReadPoolInfo", clientID);
  const readPool = await goWasm.sdk.getReadPoolInfo(clientID);
  return readPool;
};

//allocationId string, tokens string, fee string
export const lockWritePool = async (allocationId, tokens, fee) => {
  console.log("lockWritePool", allocationId, tokens, fee);
  const hash = await goWasm.sdk.lockWritePool(allocationId, tokens, fee);
  return hash;
};

const truncateAddress = (addressString = "", start = 5, flag = true, end = -4) => {
  if (flag) {
    return `${addressString?.slice(0, start)}...${addressString?.slice(end)}`;
  } else {
    return `${addressString?.slice(0, start)}...`;
  }
};

const hexStringToByte = (str) => {
  if (!str) return new Uint8Array();

  const a = [];
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }

  return new Uint8Array(a);
};

const createWalletKeys = async (userMnemonic) => {
  let mnemonic = userMnemonic;
  if (!userMnemonic) mnemonic = bip39.generateMnemonic(256);
  console.log("mnemonic", mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic, "0chain-client-split-key");
  const buffer = new Uint8Array(seed);

  const blsSecret = new bls.SecretKey();
  bls.setRandFunc(buffer);
  blsSecret.setLittleEndian(buffer);

  const publicKey = blsSecret.getPublicKey().serializeToHexStr();
  const hexPublicKey = hexStringToByte(publicKey);
  const publicKeySha = sha3_256(hexPublicKey);

  const keys = {
    walletId: publicKeySha,
    privateKey: blsSecret.serializeToHexStr(),
    publicKey,
  };

  return { keys, mnemonic };
};

export const createWallet = async () => {
  console.log("before createWalletKeys");
  const { keys, mnemonic } = await createWalletKeys();
  console.log("after createWalletKeys");
  const { publicKey, walletId } = keys;
  console.log("createWallet", keys, mnemonic);
  const pubEncKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);
  console.log("pubEncKey", pubEncKey);
  const wallet = {
    id: walletId,
    name: truncateAddress(publicKey),
    mnemonic,
    version: "1.0",
    creationDate: Date.now(),
    keys: { ...keys, publicEncryptionKey: pubEncKey },
  };
  return wallet;
};

export const recoverWallet = async (mnemonic) => {
  console.log("before createWalletKeys");
  const { keys } = await createWalletKeys(mnemonic);

  const clientId = keys.walletId;
  const pubEncKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);

  const wallet = {
    id: clientId,
    version: "1.0",
    creationDate: Date.now(),
    keys: {
      ...keys,
      publicEncryptionKey: pubEncKey,
    },
  };
  return wallet;
};

export const decodeAuthTicket = async (authTicket) => {
  console.log("decodeAuthTicket", authTicket);
  const output = await goWasm.sdk.decodeAuthTicket(authTicket);
  return output;
};

export const decodeAuthTicketWasm = async (authTicket) => {
  console.log("decodeAuthTicketWasm", authTicket);
  let resp = {};

  let decoded = Buffer.from(authTicket, "base64");
  let input = {};
  try {
    input = JSON.parse(decoded);
  } catch (err) {
    console.error("error unmarshalling json", err);
    return [resp, err];
  }

  if ("marker" in input) {
    let str = input.marker;
    let decodedMarker = Buffer.from(str, "base64");
    console.log("decodedMarker", decodedMarker);

    let markerInput = {};
    try {
      markerInput = JSON.parse(decodedMarker);
      console.log("markerInput", markerInput);
    } catch (err) {
      console.error("error unmarshaling markerInput", err);
      return [resp, err];
    }
    let lock = markerInput.free_tokens;
    console.log("lock", lock);
    resp.Marker = JSON.stringify(markerInput);
    let tokens = parseFloat(lock / Math.pow(10, 10));
    console.log("tokens", tokens);
    resp.Tokens = tokens;
  }

  if ("recipient_public_key" in input) {
    let recipientPublicKey = input.recipient_public_key;
    if (typeof recipientPublicKey !== "string") {
      return [resp, new Error("recipient_public_key is required")];
    }
    console.log("recipientPublicKey", recipientPublicKey);
    resp.RecipientPublicKey = recipientPublicKey;
  }

  return [resp, null];
};

//ethereumAddress string, bridgeAddress string, authorizersAddress string, wzcnAddress string, ethereumNodeURL string, gasLimit uint64, value int64, consensusThreshold float64
export const initBridge = async (
  ethereumAddress,
  bridgeAddress,
  authorizersAddress,
  wzcnAddress,
  ethereumNodeURL,
  gasLimit,
  value,
  consensusThreshold,
) => {
  console.log(
    "initBridge",
    ethereumAddress,
    bridgeAddress,
    authorizersAddress,
    wzcnAddress,
    ethereumNodeURL,
    gasLimit,
    value,
    consensusThreshold,
  );
  await goWasm.sdk.initBridge(
    ethereumAddress,
    bridgeAddress,
    authorizersAddress,
    wzcnAddress,
    ethereumNodeURL,
    gasLimit,
    value,
    consensusThreshold,
  );
};

export const burnZCN = async (amount) => {
  console.log("burnZCN", amount);
  const hash = await goWasm.sdk.burnZCN(amount);
  return hash;
};

export const mintZCN = async (burnTrxHash, timeout) => {
  console.log("mintZCN", burnTrxHash, timeout);
  const hash = await goWasm.sdk.mintZCN(burnTrxHash, timeout);
  return hash;
};

export const getMintWZCNPayload = async (burnTrxHash) => {
  console.log("getMintWZCNPayload", burnTrxHash);
  const result = await goWasm.sdk.getMintWZCNPayload(burnTrxHash);
  return result;
};
