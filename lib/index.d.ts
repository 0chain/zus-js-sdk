export function init(config: any[]): Promise<void>;
export function getBalance(clientId: string): Promise<number>;
export function sendTransaction(ae: object, toClientId: string, val: number, note: string): Promise<any>;
export function getBalanceWasm(clientId: string): Promise<object>;
export function setWallet(clientID: string, privateKey: string, publicKey: string, mnemonic: string): Promise<void>;
export function listAllocations(): Promise<any[]>;
export function createAllocation(allocationConfig: {
    datashards: number;
    parityshards: number;
    size: number;
    minReadPrice: number;
    maxReadPrice: number;
    minWritePrice: number;
    maxWritePrice: number;
    lock: number;
}): Promise<void>;
export function createFreeAllocation(fundingMarker: object, wallet: any): Promise<void>;
export function createAllocationWithBlobbers(allocationConfig: {
    datashards: number;
    parityshards: number;
    size: number;
    minReadPrice: number;
    maxReadPrice: number;
    minWritePrice: number;
    maxWritePrice: number;
    lock: number;
    blobbers: any[];
}): Promise<any>;
export function getAllocation(allocationId: string): Promise<object>;
export function getAllocationFromAuthTicket(authTicket: string): Promise<object>;
export function reloadAllocation(allocationId: string): Promise<object>;
export function freezeAllocation(allocationId: string): Promise<string>;
export function cancelAllocation(allocationId: string): Promise<string>;
export function updateAllocation(allocationId: string, size: number, extend: bool, lock: boolean, updateTerms: boolean, addBlobberId: string, removeBlobberId: string): Promise<string>;
export function getAllocationMinLock(dataShards: number, size: number, parityShards: number, calculatedMaxWritePrice: number): Promise<number>;
export function getUpdateAllocationMinLock(allocationID: string, size: number, extend: boolean, addBlobberId: string, removeBlobberId: string): Promise<number>;
export function bulkUpload(objects: Array<object>): Promise<any[]>;
export function download(allocationID: string, remotePath: string, authTicket: string, lookupHash: string, downloadThumbnailOnly: boolean, numBlocks: number, callbackFuncName: string, isFinal?: boolean): Promise<any>;
export function getFaucetToken(amount?: number): Promise<void>;
export function executeSmartContract(address: string, methodName: string, input: string, value: number): Promise<void>;
export function listObjects(allocationId: string, path: string, offset?: number, limit?: number): Promise<any[]>;
export function share(allocationId: string, filePath: string, clientId: string, encryptionPublicKey: string, expireAt: number, revoke: boolean, availableAfter: number): Promise<string>;
export function showLogs(): Promise<void>;
export function hideLogs(): Promise<void>;
export function deleteObject(allocationId: string, path: string): Promise<void>;
export function renameObject(allocationId: string, path: string, newName: string): Promise<void>;
export function copyObject(allocationId: string, path: string, destination: string): Promise<void>;
export function moveObject(allocationId: string, path: string, destination: string): Promise<void>;
export function play(allocationId: string, remotePath: string, authTicket: string, lookupHash: string, isLive: boolean): Promise<void>;
export function stop(): Promise<void>;
export function getNextSegment(): Promise<ArrayBuffer>;
export function createDir(allocationId: string, path: string): Promise<void>;
export function getFileStats(allocationId: string, path: string): Promise<object>;
export function downloadBlocks(allocationID: string, remotePath: string, authTicket: string, lookupHash: string, numBlocks: number, startBlockNumber: number, endBlockNumber: number, callbackFuncName: string): Promise<any>;
export function getUSDRate(symbol: string): Promise<number>;
export function isWalletID(clientID: string): Promise<boolean>;
export function getPublicEncryptionKey(mnemonic: string): Promise<string>;
export function getLookupHash(allocationId: string, path: string): Promise<string>;
export function getAllocationBlobbers(referredBlobberURLs: Array<string>, dataShards: number, parityShards: number, size: number, minReadPrice: number, maxReadPrice: number, minWritePrice: number, maxWritePrice: number): Promise<any[]>;
export function getBlobberIds(blobberUrls: Array<string>): Promise<any[]>;
export function getBlobbers(): Promise<any[]>;
export function createReadPool(): Promise<object>;
export function getReadPoolInfo(clientID: string): Promise<object>;
export function lockWritePool(allocationId: string, tokens: number, fee: number): Promise<string>;
export function lockStakePool(providerType: string, txnValue: number, fee: number, providerId: string): Promise<string>;
export function unlockStakePool(providerType: string, fee: number, providerId: string): Promise<number>;
export function createWallet(): Promise<object>;
export function recoverWallet(mnemonic: string): Promise<object>;
export function decodeAuthTicket(authTicket: string): Promise<object>;
export function initBridge(ethereumAddress: string, bridgeAddress: string, authorizersAddress: string, wzcnAddress: string, ethereumNodeURL: string, gasLimit: number, value: number, consensusThreshold: number): Promise<void>;
export function burnZCN(amount: number): Promise<string>;
export function mintZCN(burnTrxHash: string, timeout: number): Promise<string>;
export function getMintWZCNPayload(burnTrxHash: string): Promise<any>;
export function listSharedFiles(lookupHash: any, allocationId: any, walletId: string): Promise<any>;
export function multiUpload(jsonBulkUploadOptions: object): Promise<any>;
export function cancelUpload(allocId: any, remotePath: string): Promise<any>;
export function getMinersAndSharders(): Promise<any>;
export function multiDownload(allocId: string, files: string, authTicket: string, callbackFuncName: string): Promise<any>;
export function multiOperation(allocId: string, jsonMultiOperationOptions: string): Promise<any>;
export function refreshJwtToken(phoneNumber: string, jwtToken: string): Promise<any>;
export function makeSCRestAPICall(scType: string, endpoint: string, stringifiedParams: string): Promise<any>;
export function searchContainers(props: any[]): Promise<any>;
export function updateContainer(props: any[]): Promise<any>;
export function updateBlobberSettings(props: Object): Promise<any>;
