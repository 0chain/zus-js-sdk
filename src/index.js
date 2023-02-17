import { getBalanceUtil, submitTransaction } from "./utils";
import { createWasm } from "./zcn";

let bls;
let goWasm;

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

export const getAllocation = async (allocationId) => {
  const allocation = await goWasm.sdk.getAllocation(allocationId);
  return allocation;
};

export const bulkUpload = async (objects) => {
  console.log("bulkUpload objects", objects);
  const results = await goWasm.bulkUpload(objects);
  return results;
};

//allocationID, remotePath, authTicket, lookupHash string, downloadThumbnailOnly bool, numBlocks int
export const download = async (
  allocationID,
  remotePath,
  authTicket,
  lookupHash,
  downloadThumbnailOnly,
  numBlocks,
) => {
  console.log("download allocationID", allocationID, "remotePath", remotePath);
  const file = await goWasm.sdk.download(
    allocationID,
    remotePath,
    authTicket,
    lookupHash,
    downloadThumbnailOnly,
    numBlocks,
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
