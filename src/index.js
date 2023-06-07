import { getBalanceUtil, submitTransaction, Endpoints, getReqBlobbers } from "./utils";
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

/**
 * Initializes the SDK with the provided configuration.
 *
 * @param {Array} config - The configuration parameters for initializing the SDK.
 * @returns {Promise<void>} - A Promise that resolves when the SDK is initialized.
 */
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

/**
 * Retrieves the balance for a given client ID.
 *
 * @param {string} clientId - The client ID for which to retrieve the balance.
 * @returns {Promise<number>} - A Promise that resolves to the balance of the client identified by the clientId parameter.
 */
export const getBalance = async (clientId) => {
  return getBalanceUtil(clientId);
};

/**
 * Sends a transaction from one client to another.
 *
 * @param {string} ae - The client ID initiating the transaction.
 * @param {string} toClientId - The client ID receiving the transaction.
 * @param {number} val - The value (amount) to be sent in the transaction.
 * @param {string} note - An optional note to be included with the transaction.
 * @returns {Promise<any>} - A Promise that resolves to the result of submitting the transaction.
 */
export const sendTransaction = async (ae, toClientId, val, note) => {
  console.log("sendTransaction from:", ae, "to:", toClientId, "value:", val, "note:", note);
  return submitTransaction(ae, toClientId, val, note, TransactionType.SEND);
};

/**
 * Retrieves the balance for a given client ID using the WebAssembly module.
 *
 * @param {string} clientId - The client ID for which to retrieve the balance.
 * @returns {Promise<object>} - A Promise that resolves to an object representing the balance of the client identified by the clientId parameter.
 */
export const getBalanceWasm = async (clientId) => {
  const balanceObj = await goWasm.sdk.getWalletBalance(clientId);
  return balanceObj;
};

/**
 * Sets the wallet information for a client, including the client ID, private key, public key, and mnemonic.
 *
 * @param {string} clientID - The client ID associated with the wallet.
 * @param {string} privateKey - The private key of the wallet.
 * @param {string} publicKey - The public key of the wallet.
 * @param {string} mnemonic - The mnemonic associated with the wallet.
 * @returns {Promise<void>} - A Promise that resolves when the wallet information has been successfully set.
 */
export const setWallet = async (clientID, privateKey, publicKey, mnemonic) => {
  console.log("START setWallet", { clientID, privateKey, publicKey, mnemonic });
  await goWasm.setWallet(bls, clientID, privateKey, publicKey, mnemonic);
  console.log("END setWallet", { clientID, privateKey, publicKey, mnemonic });
};

/**
 * Retrieves a list of allocations.
 *
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the list of allocations.
 */
export const listAllocations = async () => {
  const allocations = await goWasm.sdk.listAllocations();
  return allocations;
};

/**
 * Creates an allocation with the specified configuration.
 *
 * @param {object} allocationConfig - The configuration object for the allocation.
 * @param {number} allocationConfig.datashards - The number of data shards for the allocation.
 * @param {number} allocationConfig.parityshards - The number of parity shards for the allocation.
 * @param {number} allocationConfig.size - The size of the allocation in bytes.
 * @param {number} allocationConfig.expiry - The expiry time of the allocation.
 * @param {number} allocationConfig.minReadPrice - The minimum price for reading from the allocation.
 * @param {number} allocationConfig.maxReadPrice - The maximum price for reading from the allocation.
 * @param {number} allocationConfig.minWritePrice - The minimum price for writing to the allocation.
 * @param {number} allocationConfig.maxWritePrice - The maximum price for writing to the allocation.
 * @param {number} allocationConfig.lock - The lock for the allocation.
 * @returns {Promise<void>} - A Promise that resolves when the allocation has been created.
 */
export const createAllocation = async (allocationConfig) => {
  console.log("allocationConfig", allocationConfig);
  return await goWasm.sdk.createAllocation(
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

/**
 * Creates an allocation with the specified blobber config.
 *
 * @param {object} allocationConfig - The configuration object for the allocation.
 * @param {number} allocationConfig.datashards - The number of data shards for the allocation.
 * @param {number} allocationConfig.parityshards - The number of parity shards for the allocation.
 * @param {number} allocationConfig.size - The size of the allocation in bytes.
 * @param {number} allocationConfig.expiry - The expiry time of the allocation.
 * @param {number} allocationConfig.minReadPrice - The minimum price for reading from the allocation.
 * @param {number} allocationConfig.maxReadPrice - The maximum price for reading from the allocation.
 * @param {number} allocationConfig.minWritePrice - The minimum price for writing to the allocation.
 * @param {number} allocationConfig.maxWritePrice - The maximum price for writing to the allocation.
 * @param {number} allocationConfig.lock - The lock for the allocation.
 * @param {Array} allocationConfig.blobbers - An array of blobber addresses associated with the allocation.
 * @returns {Promise<any>} - A Promise that resolves to the result of creating the allocation.
 */
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

/**
 * Retrieves information about an allocation based on its ID.
 *
 * @param {string} allocationId - The ID of the allocation to retrieve information for.
 * @returns {Promise<object>} - A Promise that resolves to an object containing information about the allocation.
 */
export const getAllocation = async (allocationId) => {
  const allocation = await goWasm.sdk.getAllocation(allocationId);
  return allocation;
};

/**
 * Retrieves information about an allocation based on an authTicket.
 *
 * @param {string} authTicket - The authTicket associated with the allocation.
 * @returns {Promise<object>} - A Promise that resolves to an object containing information about the allocation.
 */
export const getAllocationFromAuthTicket = async (authTicket) => {
  console.log("getAllocationFromAuthTicket", authTicket);
  const allocation = await goWasm.sdk.getAllocationWith(authTicket);
  return allocation;
};

/**
 * Reloads information about an allocation based on its ID.
 *
 * @param {string} allocationId - The ID of the allocation to reload.
 * @returns {Promise<object>} - A Promise that resolves to an object containing the reloaded information about the allocation.
 */
export const reloadAllocation = async (allocationId) => {
  console.log("reloadAllocation");
  const allocation = await goWasm.sdk.reloadAllocation(allocationId);
  return allocation;
};

/**
 * Freezes an allocation based on its ID.
 *
 * @param {string} allocationId - The ID of the allocation to freeze.
 * @returns {Promise<string>} - A Promise that resolves to a string representing the hash of the frozen allocation.
 */
export const freezeAllocation = async (allocationId) => {
  console.log("freezeAllocation");
  const hash = await goWasm.sdk.freezeAllocation(allocationId);
  return hash;
};

/**
 * Cancels an allocation based on its ID.
 *
 * @param {string} allocationId - The ID of the allocation to cancel.
 * @returns {Promise<string>} - A Promise that resolves to a string representing the hash of the cancelled allocation.
 */
export const cancelAllocation = async (allocationId) => {
  console.log("cancelAllocation");
  const hash = await goWasm.sdk.cancelAllocation(allocationId);
  return hash;
};

/**
 * Updates an allocation with new parameters.
 *
 * allocationId string, size, expiry int64,lock int64, updateTerms bool,addBlobberId, removeBlobberId string
 *
 * @param {string} allocationId - The ID of the allocation to update.
 * @param {number} size - The new size of the allocation in bytes.
 * @param {number} expiry - The new expiry time of the allocation.
 * @param {boolean} lock - Flag indicating if the allocation should be locked.
 * @param {boolean} updateTerms - Flag indicating if the terms of the allocation should be updated.
 * @param {string} addBlobberId - The ID of the blobber to add to the allocation.
 * @param {string} removeBlobberId - The ID of the blobber to remove from the allocation.
 * @returns {Promise<string>} - A Promise that resolves to a string representing the hash of the updated allocation.
 */
export const updateAllocation = async (
  allocationId,
  size,
  expiry,
  lock,
  updateTerms,
  addBlobberId,
  removeBlobberId,
) => {
  console.log("updateAllocation", {
    allocationId,
    size,
    expiry,
    lock,
    updateTerms,
    addBlobberId,
    removeBlobberId,
  });
  const hash = await goWasm.sdk.updateAllocation(
    allocationId,
    size,
    expiry,
    lock,
    updateTerms,
    addBlobberId,
    removeBlobberId,
  );
  console.log("hash", hash);
  return hash;
};

/**
 * Performs a bulk upload of objects.
 *
 * @param {Array<object>} objects - An array of objects to be uploaded.
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the results of the bulk upload.
 */
export const bulkUpload = async (objects) => {
  console.log("bulkUpload objects", objects);
  const results = await goWasm.bulkUpload(objects);
  return results;
};

/**
 * Downloads a file from an allocation.
 *
 * allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int, callbackFuncName string
 *
 * @param {string} allocationID - The ID of the allocation containing the file.
 * @param {string} remotePath - The remote path of the file to download.
 * @param {string} authTicket - The authTicket associated with the allocation.
 * @param {string} lookupHash - The lookup hash of the file.
 * @param {boolean} downloadThumbnailOnly - Flag indicating if only the thumbnail of the file should be downloaded.
 * @param {number} numBlocks - The number of blocks to download.
 * @param {string} callbackFuncName - The name of the callback function to handle progress updates.
 * @returns {Promise<any>} - A Promise that resolves to the downloaded file.
 */
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

/**
 * Retrieves a faucet token.
 *
 * @returns {Promise<void>} - A Promise that resolves when the faucet token has been obtained.
 */
export const getFaucetToken = async () => {
  console.log("faucet before");
  await goWasm.sdk.faucet("pour", JSON.stringify("{Pay day}"), 0);
  console.log("faucet after");
};

/**
 * Executes a smart contract method.
 *
 * @param {string} address - The address of the smart contract.
 * @param {string} methodName - The name of the method to execute.
 * @param {string} input - The input data for the method.
 * @param {number} value - The value to send along with the method execution.
 * @returns {Promise<void>} - A Promise that resolves when the smart contract method execution is complete.
 */
export const executeSmartContract = async (address, methodName, input, value) => {
  console.log("executeSmartContract before", address, methodName, input, value);
  await goWasm.sdk.executeSmartContract(address, methodName, input, value);
  console.log("executeSmartContract after");
};

/**
 * Retrieves a list of objects in a given path within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation containing the objects.
 * @param {string} path - The path within the allocation to retrieve objects from.
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the list of objects.
 */
export const listObjects = async (allocationId, path) => {
  console.log("listObjects", allocationId, path);
  const { list = [] } = await goWasm.sdk.listObjects(allocationId, path);
  return list;
};

/**
 * Shares a file or directory within an allocation with another client.
 *
 * allocationId, filePath, clientId, encryptionPublicKey string, expireAt int, revoke bool,availableAfter string
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} filePath - The path of the file or directory within the allocation to share.
 * @param {string} clientId - The ID of the client to share the file or directory with.
 * @param {string} encryptionPublicKey - The public key used for encryption.
 * @param {number} expireAt - The expiration timestamp for the shared access.
 * @param {boolean} revoke - Indicates whether the shared access can be revoked.
 * @param {number} availableAfter - The timestamp indicating when the shared access becomes available.
 * @returns {Promise<string>} - A Promise that resolves to the authTicket for the shared access.
 */
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

/**
 * Shows the logs generated by the SDK.
 *
 * @returns {Promise<void>} - A Promise that resolves when the logs are shown.
 */
export const showLogs = async () => {
  console.log("showLogs");
  await goWasm.sdk.showLogs();
};

/**
 * Hides the logs generated by the SDK.
 *
 * @returns {Promise<void>} - A Promise that resolves when the logs are hidden.
 */
export const hideLogs = async () => {
  console.log("hideLogs");
  await goWasm.sdk.hideLogs();
};

/**
 * Deletes an object within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the object to delete within the allocation.
 * @returns {Promise<void>} - A Promise that resolves when the object is successfully deleted.
 */
export const deleteObject = async (allocationId, path) => {
  console.log("deleteObject");
  await goWasm.sdk.delete(allocationId, path);
};

/**
 * Renames an object within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the object to rename within the allocation.
 * @param {string} newName - The new name for the object.
 * @returns {Promise<void>} - A Promise that resolves when the object is successfully renamed.
 */
export const renameObject = async (allocationId, path, newName) => {
  console.log("renameObject");
  await goWasm.sdk.rename(allocationId, path, newName);
};

/**
 * Copies an object within an allocation to a new destination.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the object to copy within the allocation.
 * @param {string} destination - The destination path where the object should be copied to.
 * @returns {Promise<void>} - A Promise that resolves when the object is successfully copied.
 */
export const copyObject = async (allocationId, path, destination) => {
  console.log("copyObject");
  await goWasm.sdk.copy(allocationId, path, destination);
};

/**
 * Moves an object within an allocation to a new destination.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the object to move within the allocation.
 * @param {string} destination - The destination path where the object should be moved to.
 * @returns {Promise<void>} - A Promise that resolves when the object is successfully moved.
 */
export const moveObject = async (allocationId, path, destination) => {
  console.log("moveObject");
  await goWasm.sdk.move(allocationId, path, destination);
};

/**
 * Plays a file or stream from an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} remotePath - The remote path of the file or stream within the allocation.
 * @param {string} authTicket - The authTicket for accessing the allocation.
 * @param {string} lookupHash - The lookup hash of the file or stream.
 * @param {boolean} isLive - Indicates if the playback is in live mode.
 * @returns {Promise<void>} - A Promise that resolves when the playback starts.
 */
export const play = async (allocationId, remotePath, authTicket, lookupHash, isLive) => {
  console.log("play");
  await goWasm.sdk.play(allocationId, remotePath, authTicket, lookupHash, isLive);
};

/**
 * Stops the execution of the SDK.
 *
 * @returns {Promise<void>} - A Promise that resolves when the SDK has stopped.
 */
export const stop = async () => {
  console.log("stop");
  await goWasm.sdk.stop();
};

/**
 * Retrieves the next segment of data.
 *
 * @returns {Promise<ArrayBuffer>} - A Promise that resolves to the next segment of data as an ArrayBuffer.
 */
export const getNextSegment = async () => {
  console.log("getNextSegment");
  const buf = await goWasm.sdk.getNextSegment();
  console.log("buf", buf);
  return buf;
};

/**
 * Creates a directory within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the directory to create within the allocation.
 * @returns {Promise<void>} - A Promise that resolves when the directory is created successfully.
 */
export const createDir = async (allocationId, path) => {
  console.log("createDir", path);
  await goWasm.sdk.createDir(allocationId, path);
};

/**
 * Retrieves the statistics of a file within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the file within the allocation.
 * @returns {Promise<object>} - A Promise that resolves to the statistics of the file.
 */
export const getFileStats = async (allocationId, path) => {
  console.log("getFileStats", path);
  const fileStats = await goWasm.sdk.getFileStats(allocationId, path);
  console.log("fileStats", fileStats);
  return fileStats;
};

/**
 * Downloads blocks from an allocation.
 *
 * allocationID, remotePath, authTicket, lookupHash string, numBlocks int, startBlockNumber, endBlockNumber int64, callbackFuncName string
 *
 * @param {string} allocationID - The ID of the allocation.
 * @param {string} remotePath - The remote path of the file or directory within the allocation.
 * @param {string} authTicket - The authTicket for accessing the allocation.
 * @param {string} lookupHash - The lookup hash of the file or directory.
 * @param {number} numBlocks - The number of blocks to download.
 * @param {number} startBlockNumber - The starting block number.
 * @param {number} endBlockNumber - The ending block number.
 * @param {string} callbackFuncName - The name of the callback function to handle the downloaded blocks.
 * @returns {Promise<any>} - A Promise that resolves to the output of the downloadBlocks operation.
 */
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

/**
 * Retrieves the USD rate for a given symbol.
 *
 * @param {string} symbol - The symbol for the currency or asset.
 * @returns {Promise<number>} - A Promise that resolves to the USD rate for the specified symbol.
 */
export const getUSDRate = async (symbol) => {
  console.log("getUSDRate", symbol);
  const usdRate = await goWasm.sdk.getUSDRate(symbol);
  return usdRate;
};

/**
 * Checks if a given client ID is a valid wallet ID.
 *
 * @param {string} clientID - The client ID to check.
 * @returns {Promise<boolean>} - A Promise that resolves to a boolean value indicating if the client ID is a valid wallet ID.
 */
export const isWalletID = async (clientID) => {
  console.log("isWalletID", clientID);
  const result = await goWasm.sdk.isWalletID(clientID);
  return result;
};

/**
 * Retrieves the public encryption key corresponding to a mnemonic.
 *
 * @param {string} mnemonic - The mnemonic phrase associated with the wallet.
 * @returns {Promise<string>} - A Promise that resolves to the public encryption key.
 */
export const getPublicEncryptionKey = async (mnemonic) => {
  console.log("getPublicEncryptionKey", mnemonic);
  const publicKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);
  return publicKey;
};

/**
 * Retrieves the lookup hash for a file or directory within an allocation.
 *
 * @param {string} allocationId - The ID of the allocation.
 * @param {string} path - The path of the file or directory within the allocation.
 * @returns {Promise<string>} - A Promise that resolves to the lookup hash of the file or directory.
 */
export const getLookupHash = async (allocationId, path) => {
  console.log("getLookupHash", allocationId, path);
  const hash = await goWasm.sdk.getLookupHash(allocationId, path);
  return hash;
};

/**
 * Retrieves a list of blobbers suitable for allocation based on the provided parameters.
 *
 * referredBlobberURLs []string, dataShards, parityShards int, size, expiry int64, minReadPrice, maxReadPrice, minWritePrice, maxWritePrice int64
 *
 * @param {Array<string>} referredBlobberURLs - An array of referred blobber URLs.
 * @param {number} dataShards - The number of data shards.
 * @param {number} parityShards - The number of parity shards.
 * @param {number} size - The size of the allocation.
 * @param {number} expiry - The expiry duration of the allocation.
 * @param {number} minReadPrice - The minimum read price.
 * @param {number} maxReadPrice - The maximum read price.
 * @param {number} minWritePrice - The minimum write price.
 * @param {number} maxWritePrice - The maximum write price.
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the list of suitable blobbers for the allocation.
 */
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

/**
 * Retrieves the IDs of blobbers based on their URLs.
 *
 * blobberUrls []string
 *
 * @param {Array<string>} blobberUrls - An array of blobber URLs.
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the IDs of the blobbers.
 */
export const getBlobberIds = async (blobberUrls) => {
  console.log("getBlobberIds", blobberUrls);
  const blobberIds = await goWasm.sdk.getBlobberIds(blobberUrls);
  return blobberIds;
};

/**
 * Retrieves a list of blobbers.
 *
 * @returns {Promise<Array>} - A Promise that resolves to an array containing the list of blobbers.
 */
export const getBlobbers = async () => {
  console.log("getBlobbers");
  const blobberList = await goWasm.sdk.getBlobbers();
  return blobberList;
};

/**
 * Creates a read pool for the client.
 *
 * @returns {Promise<object>} - A Promise that resolves to the result of creating the read pool.
 */
export const createReadPool = async () => {
  console.log("createReadPool");
  const result = await goWasm.sdk.createReadPool();
  return result;
};

/**
 * Retrieves information about the read pool of a client.
 *
 * @param {string} clientID - The ID of the client to retrieve read pool information for.
 * @returns {Promise<object>} - A Promise that resolves to the read pool information.
 */
export const getReadPoolInfo = async (clientID) => {
  console.log("getReadPoolInfo", clientID);
  const readPool = await goWasm.sdk.getReadPoolInfo(clientID);
  return readPool;
};

/**
 * Locks the write pool of an allocation.
 *
 * allocationId string, tokens string, fee string
 *
 * @param {string} allocationId - The ID of the allocation to lock the write pool for.
 * @param {number} tokens - The number of tokens to lock in the write pool.
 * @param {number} fee - The fee to pay for locking the write pool.
 * @returns {Promise<string>} - A Promise that resolves to the hash of the lock write pool transaction.
 */
export const lockWritePool = async (allocationId, tokens, fee) => {
  console.log("lockWritePool", allocationId, tokens, fee);
  const hash = await goWasm.sdk.lockWritePool(allocationId, tokens, fee);
  return hash;
};

/**
 * Truncates an address string by removing characters from the start and end.
 *
 * @param {string} addressString - The address string to truncate.
 * @param {number} start - The number of characters to keep from the start of the address string. Default is 5.
 * @param {boolean} flag - Flag indicating whether to keep characters from the end of the address string. Default is true.
 * @param {number} end - The number of characters to keep from the end of the address string. Default is -4.
 * @returns {string} - The truncated address string.
 */
const truncateAddress = (addressString = "", start = 5, flag = true, end = -4) => {
  if (flag) {
    return `${addressString?.slice(0, start)}...${addressString?.slice(end)}`;
  } else {
    return `${addressString?.slice(0, start)}...`;
  }
};

/**
 * Converts a hexadecimal string to a byte array.
 *
 * @param {string} str - The hexadecimal string to convert.
 * @returns {Uint8Array} - The resulting byte array.
 */
const hexStringToByte = (str) => {
  if (!str) return new Uint8Array();

  const a = [];
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16));
  }

  return new Uint8Array(a);
};

/**
 * Creates wallet keys and mnemonic.
 *
 * @param {string} userMnemonic - (Optional) The user-provided mnemonic phrase.
 * @returns {Promise<object>} - A Promise that resolves to an object containing the wallet keys and mnemonic.
 */
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

/**
 * Creates a new wallet.
 *
 * @returns {Promise<object>} - A Promise that resolves to the newly created wallet object.
 */
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

/**
 * Recovers a wallet using a mnemonic phrase.
 *
 * @param {string} mnemonic - The mnemonic phrase used for wallet recovery.
 * @returns {Promise<object>} - A Promise that resolves to the recovered wallet object.
 */
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

/**
 * Decodes an authTicket.
 *
 * @param {string} authTicket - The authTicket to decode.
 * @returns {Promise<object>} - A Promise that resolves to the decoded authTicket as an object.
 */
export const decodeAuthTicket = async (authTicket) => {
  console.log("decodeAuthTicket", authTicket);
  let decoded = Buffer.from(authTicket, "base64");
  console.log("decoded", decoded);

  let output = {};
  try {
    output = JSON.parse(decoded);
  } catch (err) {
    console.error("error unmarshalling json", err);
  }
  return output;
};

/**
 * Initializes the bridge for interacting with the Ethereum network.
 *
 * ethereumAddress string, bridgeAddress string, authorizersAddress string, wzcnAddress string, ethereumNodeURL string, gasLimit uint64, value int64, consensusThreshold float64
 *
 * @param {string} ethereumAddress - The Ethereum address associated with the bridge.
 * @param {string} bridgeAddress - The address of the bridge contract on the Ethereum network.
 * @param {string} authorizersAddress - The address of the authorizers contract on the Ethereum network.
 * @param {string} wzcnAddress - The address of the WZCN token contract on the Ethereum network.
 * @param {string} ethereumNodeURL - The URL of the Ethereum node to connect to.
 * @param {number} gasLimit - The gas limit to use for Ethereum transactions.
 * @param {number} value - The value to send along with Ethereum transactions.
 * @param {number} consensusThreshold - The consensus threshold for Ethereum transaction confirmation.
 * @returns {Promise<void>} - A Promise that resolves when the bridge has been initialized.
 */
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

/**
 * Burns ZCN tokens.
 *
 * @param {number} amount - The amount of ZCN tokens to burn.
 * @returns {Promise<string>} - A Promise that resolves to the hash of the burn transaction.
 */
export const burnZCN = async (amount) => {
  console.log("burnZCN", amount);
  const hash = await goWasm.sdk.burnZCN(amount);
  return hash;
};

/**
 * Mints ZCN tokens based on a burn transaction hash.
 *
 * @param {string} burnTrxHash - The hash of the burn transaction.
 * @param {number} timeout - The timeout value for the minting process.
 * @returns {Promise<string>} - A Promise that resolves to the hash of the minting transaction.
 */
export const mintZCN = async (burnTrxHash, timeout) => {
  console.log("mintZCN", burnTrxHash, timeout);
  const hash = await goWasm.sdk.mintZCN(burnTrxHash, timeout);
  return hash;
};

/**
 * Retrieves the payload for minting WZCN tokens based on a burn transaction hash.
 *
 * @param {string} burnTrxHash - The hash of the burn transaction.
 * @returns {Promise<any>} - A Promise that resolves to the payload for minting WZCN tokens.
 */
export const getMintWZCNPayload = async (burnTrxHash) => {
  console.log("getMintWZCNPayload", burnTrxHash);
  const result = await goWasm.sdk.getMintWZCNPayload(burnTrxHash);
  return result;
};

/**
 * Retrieves the list of files inside a shared directory using lookup_hash.
 *
 * @param {string} lookup_hash - lookup_hash of the directory.
 * @param {string} allocation_id - the allocation the directory belongs to.
 * @param {string} walletId - client id of owner of the allocation.
 * @returns {Promise<any>} - A Promise that resolves to the list of files inside the directory.
 */
export const listSharedFiles = async (lookupHash, allocationId, walletId) => {
  const allocation = await getAllocation(allocationId);
  const randomIndex = Math.floor(Math.random() * allocation?.blobbers?.length);
  const blobber = allocation?.blobbers[randomIndex];
  const url = blobber.url + Endpoints.ALLOCATION_FILE_LIST + allocationId;
  return getReqBlobbers(url, { path_hash: lookupHash }, walletId);
};
