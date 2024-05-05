import {
  getBalanceUtil,
  submitTransaction,
  Endpoints,
  getReqBlobbers,
  getMinersAndShardersUtils,
  getBls,
  hexStringToByte,
} from "./utils";
import { createWasm } from "./zcn";
import * as bip39 from "bip39";
import { sha3_256 } from "js-sha3";
import { Buffer } from "buffer";
import { AccountEntity, Bridge, UploadObject } from "./types";

let bls = getBls();
let goWasm: Bridge["__proxy__"] | undefined = undefined;
const getWasm = () => {
  if (!goWasm) throw new Error("WASM not initialized. call init first");
  return goWasm;
};

const TransactionType = {
  SEND: 0, // A transaction to send tokens to another account, state is maintained by account
  DATA: 10, // A transaction to just store a piece of data on the block chain
  // STORAGE_WRITE : 101, // A transaction to write data to the blobber
  // STORAGE_READ  : 103,// A transaction to read data from the blobber
  SMART_CONTRACT: 1000, // A smart contract transaction type
} as const;

export type TTransactionType = (typeof TransactionType)[keyof typeof TransactionType];

let domain = "";
let shouldShowLogs = false;
const log = (...args: any) => shouldShowLogs && console.log(...args);

/**
 * Initializes the SDK with the provided configuration.
 *
 * @param config The configuration parameters for initializing the SDK.
 */
export const init = async (config: string[]) => {
  if (!config.length) throw new Error("Missing configuration parameters");

  log("config", config);
  domain = config[1]?.replace("https://", "")?.replace("http://", "")?.replace("/dns", "") || "";

  const wasm = await createWasm();
  log("wasm", wasm);

  if (shouldShowLogs) await wasm.sdk.showLogs();

  log(...config);
  await wasm.sdk.init(...config);

  bls = getBls();
  await bls.init(bls.BN254);

  goWasm = wasm;
  window.Buffer = Buffer;
};

/**
 * Retrieves the balance for a given client ID.
 *
 * @param clientId The client ID for which to retrieve the balance.
 * @returns {Promise<number>} A Promise that resolves to the balance of the client identified by the clientId parameter.
 */
export const getBalance = async (clientId: string) => {
  return getBalanceUtil(clientId, domain);
};

/**
 * Sends a transaction from one client to another.
 *
 * @param ae The user wallet object.
 * @param toClientId The client ID receiving the transaction.
 * @param val The value (amount in tokens) to be sent in the transaction.
 * @param note An optional note to be included with the transaction.
 * @returns A Promise that resolves to the result of submitting the transaction.
 */
export const sendTransaction = async (ae: AccountEntity, toClientId: string, val: number, note: string) => {
  log("sendTransaction from:", ae, "to:", toClientId, "value:", val, "note:", note);
  return submitTransaction(ae, toClientId, val, note, TransactionType.SEND, domain);
};

/**
 * Retrieves the balance for a given client ID using the WebAssembly module.
 *
 * @param {string} clientId The client ID for which to retrieve the balance.
 * @returns {Promise<object>} A Promise that resolves to an object representing the balance of the client identified by the clientId parameter.
 */
export const getBalanceWasm = async (clientId: string) => {
  const goWasm = getWasm();
  const balanceObj = await goWasm.sdk.getWalletBalance(clientId);
  return balanceObj;
};

/**
 * Sets the wallet information for a client, including the client ID, private key, public key, and mnemonic.
 *
 * @param clientID The client ID associated with the wallet.
 * @param privateKey The private key of the wallet.
 * @param publicKey The public key of the wallet.
 * @param mnemonic The mnemonic associated with the wallet.
 */
export const setWallet = async (clientID: string, privateKey: string, publicKey: string, mnemonic: string) => {
  log("START setWallet", { clientID, privateKey, publicKey, mnemonic });
  const goWasm = getWasm();
  await goWasm.setWallet(bls, clientID, privateKey, publicKey, mnemonic);
  log("END setWallet", { clientID, privateKey, publicKey, mnemonic });
};

/**
 * Retrieves a list of allocations.
 *
 * @returns A Promise that resolves to an array containing the list of allocations.
 */
export const listAllocations = async () => {
  const goWasm = getWasm();
  const allocations = await goWasm.sdk.listAllocations();
  return allocations as any[]; // TODO
};

type AllocationConfig = {
  /** The number of data shards for the allocation. */
  datashards: number;
  /** The number of parity shards for the allocation. */
  parityshards: number;
  /** The size of the allocation in bytes. */
  size: number;
  /** The minimum price for reading from the allocation. */
  minReadPrice: number;
  /** The maximum price for reading from the allocation. */
  maxReadPrice: number;
  /** The minimum price for writing to the allocation. */
  minWritePrice: number;
  /** The maximum price for writing to the allocation. */
  maxWritePrice: number;
  /** The lock for the allocation. */
  lock: number;
};

/**
 * Creates an allocation with the specified configuration.
 * @returns a Promise that resolves when the allocation has been created.
 */
export const createAllocation = async (allocationConfig: AllocationConfig) => {
  log("allocationConfig", allocationConfig);
  const goWasm = getWasm();
  return await goWasm.sdk.createAllocation(
    allocationConfig.datashards,
    allocationConfig.parityshards,
    allocationConfig.size,
    allocationConfig.minReadPrice,
    allocationConfig.maxReadPrice,
    allocationConfig.minWritePrice,
    allocationConfig.maxWritePrice,
    allocationConfig.lock,
    []
  );
};

type AllocationConfigWithBlobbers = AllocationConfig & { blobbers: string[] };
/**
 * Creates an allocation with the specified blobber config.
 * @returns a Promise that resolves when the allocation has been created.
 */
export const createAllocationWithBlobbers = async (allocationConfig: AllocationConfigWithBlobbers) => {
  log("createAllocationWithBlobbers allocationConfig", allocationConfig);
  const goWasm = getWasm();
  const txn = await goWasm.sdk.createAllocation(
    allocationConfig.datashards,
    allocationConfig.parityshards,
    allocationConfig.size,
    allocationConfig.minReadPrice,
    allocationConfig.maxReadPrice,
    allocationConfig.minWritePrice,
    allocationConfig.maxWritePrice,
    allocationConfig.lock,
    allocationConfig.blobbers
  );
  return txn;
};

/**
 * Retrieves information about an allocation based on its ID.
 *
 * @param allocationId The ID of the allocation to retrieve information for.
 * @returns A Promise that resolves to an object containing information about the allocation.
 */
export const getAllocation = async (allocationId: string) => {
  const goWasm = getWasm();
  const allocation = await goWasm.sdk.getAllocation(allocationId);
  return allocation;
};

/**
 * Retrieves information about an allocation based on an authTicket.
 *
 * @param authTicket The authTicket associated with the allocation.
 * @returns A Promise that resolves to an object containing information about the allocation.
 */
export const getAllocationFromAuthTicket = async (authTicket: string) => {
  log("getAllocationFromAuthTicket", authTicket);
  const goWasm = getWasm();
  const allocation = await goWasm.sdk.getAllocationWith(authTicket);
  return allocation;
};

/**
 * Reloads information about an allocation based on its ID.
 *
 * @param allocationId The ID of the allocation to reload.
 * @returns A Promise that resolves to an object containing the reloaded information about the allocation.
 */
export const reloadAllocation = async (allocationId: string) => {
  log("reloadAllocation");
  const goWasm = getWasm();
  const allocation = await goWasm.sdk.reloadAllocation(allocationId);
  return allocation;
};

/**
 * Freezes an allocation based on its ID.
 *
 * @param allocationId The ID of the allocation to freeze.
 * @returns A Promise that resolves to a string representing the hash of the frozen allocation.
 */
export const freezeAllocation = async (allocationId: string) => {
  log("freezeAllocation");
  const goWasm = getWasm();
  const hash = await goWasm.sdk.freezeAllocation(allocationId);
  return hash as string;
};

/**
 * Cancels an allocation based on its ID.
 *
 * @param allocationId The ID of the allocation to cancel.
 * @returns A Promise that resolves to a string representing the hash of the cancelled allocation.
 */
export const cancelAllocation = async (allocationId: string) => {
  log("cancelAllocation");
  const goWasm = getWasm();
  const hash = await goWasm.sdk.cancelAllocation(allocationId);
  return hash as string;
};

/**
 * Updates an allocation with new parameters.
 *
 * @param allocationId The ID of the allocation to update.
 * @param size The new size of the allocation in bytes.
 * @param extend Flag indicating if the allocation should be extended.
 * @param lock Flag indicating if the allocation should be locked.
 * @param updateTerms Flag indicating if the terms of the allocation should be updated.
 * @param addBlobberId The ID of the blobber to add to the allocation.
 * @param removeBlobberId The ID of the blobber to remove from the allocation.
 * @returns A Promise that resolves to a string representing the hash of the updated allocation.
 */
export const updateAllocation = async (
  allocationId: string,
  size: number,
  extend: boolean,
  lock: boolean,
  updateTerms: boolean,
  addBlobberId: string,
  removeBlobberId: string
) => {
  log("updateAllocation", {
    allocationId,
    size,
    extend,
    lock,
    updateTerms,
    addBlobberId,
    removeBlobberId,
  });
  const goWasm = getWasm();
  const hash = await goWasm.sdk.updateAllocation(
    allocationId,
    size,
    extend,
    lock,
    updateTerms,
    addBlobberId,
    removeBlobberId
  );
  log("hash", hash);
  return hash as string;
};

/**
 * Performs a bulk upload of objects.
 *
 * @param objects An array of objects to be uploaded.
 * @returns A Promise that resolves to an array containing the results of the bulk upload.
 */
export const bulkUpload = async (objects: UploadObject[]) => {
  log("bulkUpload objects", objects);
  const goWasm = getWasm();
  const results = await goWasm.bulkUpload(objects);
  return results;
};

/**
 * Downloads a file from an allocation.
 *
 * @param allocationID The ID of the allocation containing the file.
 * @param remotePath The remote path of the file to download.
 * @param authTicket The authTicket associated with the allocation.
 * @param lookupHash The lookup hash of the file.
 * @param downloadThumbnailOnly Flag indicating if only the thumbnail of the file should be downloaded.
 * @param numBlocks The number of blocks to download.
 * @param callbackFuncName The name of the callback function to handle progress updates.
 * @param isFinal Flag indicating if this is the final download request.
 * @returns A Promise that resolves to the downloaded file.
 */
export const download = async (
  allocationID: string,
  remotePath: string,
  authTicket: string,
  lookupHash: string,
  downloadThumbnailOnly: boolean,
  numBlocks: number,
  callbackFuncName: string,
  isFinal = true
) => {
  log("download allocationID", allocationID, "remotePath", remotePath);
  const goWasm = getWasm();
  const file = await goWasm.sdk.download(
    allocationID,
    remotePath,
    authTicket,
    lookupHash,
    downloadThumbnailOnly,
    numBlocks,
    callbackFuncName,
    isFinal
  );
  return file;
};

/**
 * Retrieves a faucet token.
 * @param amount Floating point number representing The amount of zcn tokens to retrieve.
 * @returns A Promise that resolves when the faucet token has been obtained.
 */
export const getFaucetToken = async (amount: number | string = 1) => {
  log("faucet before");
  const amountFloat64 = parseFloat(amount.toString());
  const goWasm = getWasm();
  await goWasm.sdk.faucet("pour", JSON.stringify("{Pay day}"), amountFloat64);
  log("faucet after");
};

/**
 * Executes a smart contract method.
 *
 * @param address The address of the smart contract.
 * @param methodName The name of the method to execute.
 * @param input The input data for the method.
 * @param value The value to send along with the method execution.
 * @returns A Promise that resolves when the smart contract method execution is complete.
 */
export const executeSmartContract = async (address: string, methodName: string, input: string, value: number) => {
  log("executeSmartContract before", address, methodName, input, value);
  const goWasm = getWasm();
  await goWasm.sdk.executeSmartContract(address, methodName, input, value);
  log("executeSmartContract after");
};

/**
 * Retrieves a list of objects in a given path within an allocation.
 *
 * @param allocationId The ID of the allocation containing the objects.
 * @param path The path within the allocation to retrieve objects from.
 * @returns A Promise that resolves to an array containing the list of objects.
 */
export const listObjects = async (allocationId: string, path: string) => {
  log("listObjects", allocationId, path);
  const goWasm = getWasm();
  const { list = [] } = await goWasm.sdk.listObjects(allocationId, path);
  return list as any[];
};

/**
 * Shares a file or directory within an allocation with another client.
 *
 * @param allocationId The ID of the allocation.
 * @param filePath The path of the file or directory within the allocation to share.
 * @param clientId The ID of the client to share the file or directory with.
 * @param encryptionPublicKey The public key used for encryption.
 * @param expireAt The expiration timestamp for the shared access.
 * @param revoke Indicates whether the shared access can be revoked.
 * @param availableAfter The timestamp indicating when the shared access becomes available.
 * @returns A Promise that resolves to the authTicket for the shared access.
 */
export const share = async (
  allocationId: string,
  filePath: string,
  clientId: string,
  encryptionPublicKey: string,
  expireAt: number,
  revoke: boolean,
  availableAfter: number
) => {
  log("share allocationId", allocationId, "filePath", filePath);
  const goWasm = getWasm();
  const authTicket = await goWasm.sdk.share(
    allocationId,
    filePath,
    clientId,
    encryptionPublicKey,
    expireAt,
    revoke,
    availableAfter
  );

  log("authTicket after share", authTicket);
  return authTicket as string;
};

/**
 * Shows the logs generated by the SDK.
 *
 * @returns A Promise that resolves when the logs are shown.
 */
export const showLogs = async () => {
  shouldShowLogs = true;
  log("showLogs");
  const goWasm = getWasm();
  await goWasm.sdk.showLogs();
};

/**
 * Hides the logs generated by the SDK.
 *
 * @returns A Promise that resolves when the logs are hidden.
 */
export const hideLogs = async () => {
  shouldShowLogs = false;
  log("hideLogs");
  const goWasm = getWasm();
  await goWasm.sdk.hideLogs();
};

/**
 * Deletes an object within an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the object to delete within the allocation.
 * @returns A Promise that resolves when the object is successfully deleted.
 */
export const deleteObject = async (allocationId: string, path: string) => {
  log("deleteObject");
  const goWasm = getWasm();
  await goWasm.sdk.delete(allocationId, path);
};

/**
 * Renames an object within an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the object to rename within the allocation.
 * @param newName The new name for the object.
 * @returns A Promise that resolves when the object is successfully renamed.
 */
export const renameObject = async (allocationId: string, path: string, newName: string) => {
  log("renameObject");
  const goWasm = getWasm();
  await goWasm.sdk.rename(allocationId, path, newName);
};

/**
 * Copies an object within an allocation to a new destination.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the object to copy within the allocation.
 * @param destination The destination path where the object should be copied to.
 * @returns A Promise that resolves when the object is successfully copied.
 */
export const copyObject = async (allocationId: string, path: string, destination: string) => {
  log("copyObject");
  const goWasm = getWasm();
  await goWasm.sdk.copy(allocationId, path, destination);
};

/**
 * Moves an object within an allocation to a new destination.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the object to move within the allocation.
 * @param destination The destination path where the object should be moved to.
 * @returns A Promise that resolves when the object is successfully moved.
 */
export const moveObject = async (allocationId: string, path: string, destination: string) => {
  log("moveObject");
  const goWasm = getWasm();
  await goWasm.sdk.move(allocationId, path, destination);
};

/**
 * Plays a file or stream from an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param remotePath The remote path of the file or stream within the allocation.
 * @param authTicket The authTicket for accessing the allocation.
 * @param lookupHash The lookup hash of the file or stream.
 * @param isLive Indicates if the playback is in live mode.
 * @returns A Promise that resolves when the playback starts.
 */
export const play = async (
  allocationId: string,
  remotePath: string,
  authTicket: string,
  lookupHash: string,
  isLive: boolean
) => {
  log("play");
  const goWasm = getWasm();
  await goWasm.sdk.play(allocationId, remotePath, authTicket, lookupHash, isLive);
};

/**
 * Stops the execution of the SDK.
 *
 * @returns A Promise that resolves when the SDK has stopped.
 */
export const stop = async () => {
  log("stop");
  const goWasm = getWasm();
  await goWasm.sdk.stop();
};

/**
 * Retrieves the next segment of data.
 */
export const getNextSegment = async () => {
  log("getNextSegment");
  const goWasm = getWasm();
  const buf = await goWasm.sdk.getNextSegment();
  log("buf", buf);
  return buf as ArrayBuffer;
};

/**
 * Creates a directory within an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the directory to create within the allocation.
 * @returns A Promise that resolves when the directory is created successfully.
 */
export const createDir = async (allocationId: string, path: string) => {
  log("createDir", path);
  const goWasm = getWasm();
  await goWasm.sdk.createDir(allocationId, path);
};

/**
 * Retrieves the statistics of a file within an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the file within the allocation.
 * @returns  A Promise that resolves to the statistics of the file.
 */
export const getFileStats = async (allocationId: string, path: string) => {
  log("getFileStats", path);
  const goWasm = getWasm();
  const fileStats = await goWasm.sdk.getFileStats(allocationId, path);
  log("fileStats", fileStats);
  return fileStats;
};

/**
 * Downloads blocks from an allocation.
 *
 * @param allocationID The ID of the allocation.
 * @param remotePath The remote path of the file or directory within the allocation.
 * @param authTicket The authTicket for accessing the allocation.
 * @param lookupHash The lookup hash of the file or directory.
 * @param numBlocks The number of blocks to download.
 * @param startBlockNumber The starting block number.
 * @param endBlockNumber The ending block number.
 * @param callbackFuncName The name of the callback function to handle the downloaded blocks.
 * @returns A Promise that resolves to the output of the downloadBlocks operation.
 */
export const downloadBlocks = async (
  allocationID: string,
  remotePath: string,
  authTicket: string,
  lookupHash: string,
  numBlocks: number,
  startBlockNumber: number,
  endBlockNumber: number,
  callbackFuncName: string
) => {
  log("downloadBlocks allocationID", allocationID, "remotePath", remotePath);
  const goWasm = getWasm();
  const output = await goWasm.sdk.downloadBlocks(
    allocationID,
    remotePath,
    authTicket,
    lookupHash,
    numBlocks,
    startBlockNumber,
    endBlockNumber,
    callbackFuncName
  );
  return output;
};

/**
 * Retrieves the USD rate for a given symbol.
 *
 * @param symbol The symbol for the currency or asset.
 * @returns A Promise that resolves to the USD rate for the specified symbol.
 */
export const getUSDRate = async (symbol: string) => {
  log("getUSDRate", symbol);
  const goWasm = getWasm();
  const usdRate = await goWasm.sdk.getUSDRate(symbol);
  return usdRate as number;
};

/**
 * Checks if a given client ID is a valid wallet ID.
 *
 * @param clientID The client ID to check.
 * @returns A Promise that resolves to a boolean value indicating if the client ID is a valid wallet ID.
 */
export const isWalletID = async (clientID: string) => {
  log("isWalletID", clientID);
  const goWasm = getWasm();
  const result = await goWasm.sdk.isWalletID(clientID);
  return result as boolean;
};

/**
 * Retrieves the public encryption key corresponding to a mnemonic.
 *
 * @param mnemonic The mnemonic phrase associated with the wallet.
 * @returns A Promise that resolves to the public encryption key.
 */
export const getPublicEncryptionKey = async (mnemonic: string) => {
  log("getPublicEncryptionKey", mnemonic);
  const goWasm = getWasm();
  const publicKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);
  return publicKey as string;
};

/**
 * Retrieves the lookup hash for a file or directory within an allocation.
 *
 * @param allocationId The ID of the allocation.
 * @param path The path of the file or directory within the allocation.
 * @returns A Promise that resolves to the lookup hash of the file or directory.
 */
export const getLookupHash = async (allocationId: string, path: string) => {
  log("getLookupHash", allocationId, path);
  const goWasm = getWasm();
  const hash = await goWasm.sdk.getLookupHash(allocationId, path);
  return hash as string;
};

/**
 * Retrieves a list of blobbers suitable for allocation based on the provided parameters.
 *
 * @param referredBlobberURLs An array of referred blobber URLs.
 * @param dataShards The number of data shards.
 * @param parityShards The number of parity shards.
 * @param size The size of the allocation.
 * @param minReadPrice The minimum read price.
 * @param maxReadPrice The maximum read price.
 * @param minWritePrice The minimum write price.
 * @param maxWritePrice The maximum write price.
 * @returns A Promise that resolves to an array containing the list of suitable blobbers for the allocation.
 */
export const getAllocationBlobbers = async (
  referredBlobberURLs: string[],
  dataShards: number,
  parityShards: number,
  size: number,
  minReadPrice: number,
  maxReadPrice: number,
  minWritePrice: number,
  maxWritePrice: number
) => {
  log("getAllocationBlobbers", referredBlobberURLs);
  const goWasm = getWasm();
  const blobberList = await goWasm.sdk.getAllocationBlobbers(
    referredBlobberURLs,
    dataShards,
    parityShards,
    size,
    minReadPrice,
    maxReadPrice,
    minWritePrice,
    maxWritePrice
  );
  return blobberList as any[];
};

/**
 * Retrieves the IDs of blobbers based on their URLs.
 *
 * @param blobberUrls An array of blobber URLs.
 * @returns A Promise that resolves to an array containing the IDs of the blobbers.
 */
export const getBlobberIds = async (blobberUrls: string[]) => {
  log("getBlobberIds", blobberUrls);
  const goWasm = getWasm();
  const blobberIds = await goWasm.sdk.getBlobberIds(blobberUrls);
  return blobberIds as string[];
};

/**
 * Retrieves a list of blobbers.
 *
 * @returns A Promise that resolves to an array containing the list of blobbers.
 */
export const getBlobbers = async () => {
  log("getBlobbers");
  const goWasm = getWasm();
  const blobberList = await goWasm.sdk.getBlobbers();
  return blobberList as any[];
};

/**
 * Creates a read pool for the client.
 *
 * @returns A Promise that resolves to the result of creating the read pool.
 */
export const createReadPool = async () => {
  log("createReadPool");
  const goWasm = getWasm();
  const result = await goWasm.sdk.createReadPool();
  return result;
};

/**
 * Retrieves information about the read pool of a client.
 *
 * @param {string} clientID The ID of the client to retrieve read pool information for.
 * @returns A Promise that resolves to the read pool information.
 */
export const getReadPoolInfo = async (clientID: string) => {
  log("getReadPoolInfo", clientID);
  const goWasm = getWasm();
  const readPool = await goWasm.sdk.getReadPoolInfo(clientID);
  return readPool;
};

/**
 * Locks the write pool of an allocation.
 *
 * allocationId string, tokens string, fee string
 *
 * @param allocationId The ID of the allocation to lock the write pool for.
 * @param tokens The number of tokens to lock in the write pool.
 * @param fee The fee to pay for locking the write pool.
 * @returns A Promise that resolves to the hash of the lock write pool transaction.
 */
export const lockWritePool = async (allocationId: string, tokens: number, fee: number) => {
  log("lockWritePool", allocationId, tokens, fee);
  const goWasm = getWasm();
  const hash = await goWasm.sdk.lockWritePool(allocationId, tokens, fee);
  return hash as string;
};

/**
 * Truncates an address string by removing characters from the start and end.
 *
 * @param addressString The address string to truncate.
 * @param start The number of characters to keep from the start of the address string. Default is 5.
 * @param flag Flag indicating whether to keep characters from the end of the address string. Default is true.
 * @param end The number of characters to keep from the end of the address string. Default is -4.
 * @returns The truncated address string.
 */
const truncateAddress = (addressString = "", start = 5, flag = true, end = -4) => {
  if (flag) {
    return `${addressString?.slice(0, start)}...${addressString?.slice(end)}`;
  } else {
    return `${addressString?.slice(0, start)}...`;
  }
};

export { hexStringToByte } from "./utils";

/**
 * Creates wallet keys and mnemonic.
 *
 * @param userMnemonic (Optional) The user-provided mnemonic phrase.
 * @returns A Promise that resolves to an object containing the wallet keys and mnemonic.
 */
const createWalletKeys = async (userMnemonic?: string) => {
  const mnemonic = userMnemonic || bip39.generateMnemonic(256);
  log("mnemonic", mnemonic);

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
 * @returns A Promise that resolves to the newly created wallet object.
 */
export const createWallet = async () => {
  log("before createWalletKeys");
  const { keys, mnemonic } = await createWalletKeys();
  log("after createWalletKeys");
  const { publicKey, walletId } = keys;
  log("createWallet", keys, mnemonic);
  const goWasm = getWasm();
  const pubEncKey = await goWasm.sdk.getPublicEncryptionKey(mnemonic);
  log("pubEncKey", pubEncKey);
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
 * @param mnemonic The mnemonic phrase used for wallet recovery.
 * @returns A Promise that resolves to the recovered wallet object.
 */
export const recoverWallet = async (mnemonic: string) => {
  log("before createWalletKeys");
  const { keys } = await createWalletKeys(mnemonic);

  const clientId = keys.walletId;
  const goWasm = getWasm();
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
 * @param authTicket The authTicket to decode.
 * @returns decoded authTicket as an object.
 */
export const decodeAuthTicket = async (authTicket: string) => {
  log("decodeAuthTicket", authTicket);
  const decoded = Buffer.from(authTicket, "base64");
  log("decoded authTicket", decoded);

  let output = {};
  try {
    // output = JSON.parse(decoded);
    output = JSON.parse(decoded.toString("utf8"));
  } catch (err) {
    console.error("error unmarshalling json", err);
  }
  return output;
};

/**
 * Initializes the bridge for interacting with the Ethereum network.
 *
 * @param ethereumAddress The Ethereum address associated with the bridge.
 * @param bridgeAddress The address of the bridge contract on the Ethereum network.
 * @param authorizersAddress The address of the authorizers contract on the Ethereum network.
 * @param wzcnAddress The address of the WZCN token contract on the Ethereum network.
 * @param ethereumNodeURL The URL of the Ethereum node to connect to.
 * @param gasLimit The gas limit to use for Ethereum transactions.
 * @param value The value to send along with Ethereum transactions.
 * @param consensusThreshold The consensus threshold for Ethereum transaction confirmation.
 * @returns A Promise that resolves when the bridge has been initialized.
 */
export const initBridge = async (
  ethereumAddress: string,
  bridgeAddress: string,
  authorizersAddress: string,
  wzcnAddress: string,
  ethereumNodeURL: string,
  gasLimit: number,
  value: number,
  consensusThreshold: number
) => {
  log(
    "initBridge",
    ethereumAddress,
    bridgeAddress,
    authorizersAddress,
    wzcnAddress,
    ethereumNodeURL,
    gasLimit,
    value,
    consensusThreshold
  );
  const goWasm = getWasm();
  await goWasm.sdk.initBridge(
    ethereumAddress,
    bridgeAddress,
    authorizersAddress,
    wzcnAddress,
    ethereumNodeURL,
    gasLimit,
    value,
    consensusThreshold
  );
};

/**
 * Burns ZCN tokens.
 *
 * @param amount The amount of ZCN tokens to burn.
 * @returns A Promise that resolves to the hash of the burn transaction.
 */
export const burnZCN = async (amount: number) => {
  log("burnZCN", amount);
  const goWasm = getWasm();
  const hash = await goWasm.sdk.burnZCN(amount);
  return hash as string;
};

/**
 * Mints ZCN tokens based on a burn transaction hash.
 *
 * @param burnTrxHash The hash of the burn transaction.
 * @param timeout The timeout value for the minting process.
 * @returns A Promise that resolves to the hash of the minting transaction.
 */
export const mintZCN = async (burnTrxHash: string, timeout: number) => {
  log("mintZCN", burnTrxHash, timeout);
  const goWasm = getWasm();
  const hash = await goWasm.sdk.mintZCN(burnTrxHash, timeout);
  return hash as string;
};

/**
 * Retrieves the payload for minting WZCN tokens based on a burn transaction hash.
 *
 * @param burnTrxHash The hash of the burn transaction.
 * @returns A Promise that resolves to the payload for minting WZCN tokens.
 */
export const getMintWZCNPayload = async (burnTrxHash: string) => {
  log("getMintWZCNPayload", burnTrxHash);
  const goWasm = getWasm();
  const result = await goWasm.sdk.getMintWZCNPayload(burnTrxHash);
  return result;
};

/**
 * Retrieves the list of files inside a shared directory using lookup_hash.
 *
 * @param lookup_hash lookup_hash of the directory.
 * @param allocationId the allocation the directory belongs to.
 * @param walletId client id of owner of the allocation.
 * @returns A Promise that resolves to the list of files inside the directory.
 */
export const listSharedFiles = async (lookupHash: string, allocationId: string, walletId: string) => {
  const allocation = await getAllocation(allocationId);
  const randomIndex = Math.floor(Math.random() * allocation?.blobbers?.length);
  const blobber = allocation?.blobbers[randomIndex];
  const url = blobber.url + Endpoints.ALLOCATION_FILE_LIST + allocationId;
  return getReqBlobbers(url, { path_hash: lookupHash }, walletId);
};

/**
 * Upload multiple files to the blobbers.
 * @param jsonBulkUploadOptions Json stringified `BulkUploadOption[]`
 */
export const multiUpload = async (jsonBulkUploadOptions: string) => {
  const goWasm = getWasm();
  const res = await goWasm.sdk.multiUpload(jsonBulkUploadOptions);
  return res;
};

/**
 * Retrieves the list of miners and sharders.
 * @returns A Promise that resolves to the list of miners and sharders.
 */
export const getMinersAndSharders = async () => {
  return await getMinersAndShardersUtils(domain);
};

/**
 * Download files from an allocation.
 *
 * @param allocId ID of the allocation to download from.
 * @param files JSON string of the files to download.
 * @param authTicket AuthTicket of the directory to download from.
 * @param callbackFuncName Name of the callback function to call when a file is downloaded.
 * @returns A Promise that resolves to the list of files downloaded files.
 */
export const multiDownload = async (allocId: string, files: string, authTicket: string, callbackFuncName: string) => {
  const goWasm = getWasm();
  return goWasm.sdk.multiDownload(allocId, files, authTicket, callbackFuncName);
};

/**
 * Multi Operation do copy, move, delete and createdir operation concurrently.
 *
 * @param allocId ID of the allocation to download from.
 * @param jsonMultiOperationOptions Json Array of MultiOperationOption. eg: `"[{"operationType":"move","remotePath":"/README.md","destPath":"/folder1/"},{"operationType":"delete","remotePath":"/t3.txt"}]"`
 * @returns A Promise that resolves to the list of files downloaded files.
 */
export const multiOperation = async (allocId: string, jsonMultiOperationOptions: string) => {
  const goWasm = getWasm();
  return goWasm.sdk.multiOperation(allocId, jsonMultiOperationOptions);
};
