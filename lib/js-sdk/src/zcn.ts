"use strict";

import { Bridge, UploadObject, globalCtx } from "./types";
import { hexStringToByte } from "./utils";

const g = globalCtx;

/** BRIDGE SETUP START */

/**
 * Signs a hash using BLS signature scheme.
 *
 * @param hash The hash to be signed.
 * @returns The serialized signature in hexadecimal format.
 */
async function blsSign(hash: string) {
  console.log("async blsSign", hash);

  const bridge = getBridge();
  if (!bridge.jsProxy || !bridge.jsProxy.secretKey) {
    const errMsg = "err: bls.secretKey is not initialized";
    console.warn(errMsg);
    throw new Error(errMsg);
  }

  const bytes = hexStringToByte(hash);
  const sig = bridge.jsProxy.secretKey.sign(bytes);

  if (!sig) {
    const errMsg = "err: wasm blsSign function failed to sign transaction";
    console.warn(errMsg);
    throw new Error(errMsg);
  }

  return sig.serializeToHexStr() as string;
}

export async function createObjectURL(buf: ArrayBuffer, mimeType: string) {
  var blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
}

const readChunk = (offset: number, chunkSize: number, file: File) =>
  new Promise<{ size: number; buffer: Uint8Array }>((res, rej) => {
    const fileReader = new FileReader();
    const blob = file.slice(offset, chunkSize + offset);
    fileReader.onload = e => {
      const t = e.target;
      if (t === null) {
        rej("err: fileReader onload target is null");
        return;
      }
      if (t.error == null) {
        const result = t.result as ArrayBuffer;
        res({
          size: result.byteLength,
          buffer: new Uint8Array(result),
        });
      } else {
        rej(t.error);
      }
    };

    fileReader.readAsArrayBuffer(blob);
  });

/**
 * Sleep is used when awaiting for Go Wasm to initialize.
 * It uses the lowest possible sane delay time (via requestAnimationFrame).
 * However, if the window is not focused, requestAnimationFrame never returns.
 * A timeout will ensure to be called after 50 ms, regardless of whether or not
 * the tab is in focus.
 *
 * @returns an always-resolving promise when a tick has been completed.
 */
const sleep = (ms = 1000) =>
  new Promise(res => {
    requestAnimationFrame(res);
    setTimeout(res, ms);
  });

/**
 * The maximum amount of time that we would expect Wasm to take to initialize.
 * If it doesn't initialize after this time, we send a warning to console.
 * Most likely something has gone wrong if it takes more than 3 seconds to
 * initialize.
 */
const maxTime = 10 * 1000;

/**
 * @returns Bridge object. This is an easier way to refer to the Go WASM object.
 */
const getBridge = (): Bridge => {
  const currBridge = g.__zcn_wasm__;
  if (currBridge) return currBridge;

  const newBridge: Bridge = {
    glob: {
      index: 0,
    },
    jsProxy: {
      secretKey: null,
      publicKey: null,
      sign: blsSign,
      verify: blsVerify,
      verifyWith: blsVerifyWith,
      createObjectURL,
      sleep,
    },
    sdk: {},
  };
  g.__zcn_wasm__ = newBridge;

  return newBridge;
};

getBridge();

/** BRIDGE SETUP END */

const getProxy = (bridge: Bridge) => {
  const proxy = bridge.__proxy__;
  if (!proxy) {
    throw new Error("The Bridge proxy (__proxy__) is not initialized. Make sure to call createWasm first.");
  }
  return proxy;
};

/**
 * Performs a bulk upload of multiple files.
 *
 * @param options An array of upload options for each file.
 * @returns A promise that resolves to the upload result.
 */
async function bulkUpload(options: UploadObject[]) {
  const bridge = getBridge();

  const start = bridge.glob.index;
  const opts = options.map(obj => {
    const i = bridge.glob.index;
    bridge.glob.index++;
    const readChunkFuncName = "__zcn_upload_reader_" + i.toString();
    const callbackFuncName = "__zcn_upload_callback_" + i.toString();
    g[readChunkFuncName] = async (offset: number, chunkSize: number) => {
      console.log(`bulk_upload: read chunk remotePath:${obj.remotePath} offset:${offset} chunkSize:${chunkSize}`);
      const chunk = await readChunk(offset, chunkSize, obj.file);
      return chunk.buffer;
    };

    if (obj.callback) {
      g[callbackFuncName] = async (totalBytes: number, completedBytes: number, error: any) =>
        obj.callback(totalBytes, completedBytes, error);
    }

    return {
      allocationId: obj.allocationId,
      remotePath: obj.remotePath,
      readChunkFuncName: readChunkFuncName,
      fileSize: obj.file.size,
      thumbnailBytes: obj.thumbnailBytes ? obj.thumbnailBytes.toString() : "",
      encrypt: obj.encrypt,
      isUpdate: obj.isUpdate,
      isRepair: obj.isRepair,
      numBlocks: obj.numBlocks,
      callbackFuncName: callbackFuncName,
    };
  });

  console.log("upload opts", opts);

  const end = bridge.glob.index;

  const proxy = getProxy(bridge);
  const result = await proxy.sdk.bulkUpload(JSON.stringify(opts));
  for (let i = start; i < end; i++) {
    g["__zcn_upload_reader_" + i.toString()] = null;
    g["__zcn_upload_callback_" + i.toString()] = null;
  }
  return result;
}

/**
 * Verifies a BLS signature against a given hash.
 *
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerify(signature: string, hash: string) {
  const bridge = getBridge();

  if (!bridge.jsProxy || !bridge.jsProxy.publicKey) {
    const errMsg = "err: bls.publicKey is not initialized";
    console.warn(errMsg);
    throw new Error(errMsg);
  }

  const bytes = hexStringToByte(hash);
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature);
  return bridge.jsProxy.publicKey.verify(sig, bytes);
}

/**
 * Verifies a BLS signature against a given hash and public key.
 *
 * @param pk The public key.
 * @param signature The serialized BLS signature.
 * @param hash The hash to verify the signature against.
 * @returns A boolean indicating whether the signature is valid or not.
 */
async function blsVerifyWith(pk: string, signature: string, hash: string) {
  const bridge = getBridge();

  const publicKey = bridge.jsProxy.bls.deserializeHexStrToPublicKey(pk);
  const bytes = hexStringToByte(hash);
  const sig = bridge.jsProxy.bls.deserializeHexStrToSignature(signature);
  return publicKey.verify(sig, bytes);
}

/**
 * Sets the wallet information in the bridge and the Go instance.
 *
 * @param bls The BLS object from bls-wasm script.
 * @param clientID The client ID.
 * @param sk The serialized secret key.
 * @param pk The serialized public key.
 * @param mnemonic The mnemonic.
 */
async function setWallet(bls: any, clientID: string, sk: string, pk: string, mnemonic: string) {
  if (!bls) throw new Error("bls is undefined, on wasm setWallet fn");
  if (!sk) throw new Error("secret key is undefined, on wasm setWallet fn");
  if (!pk) throw new Error("public key is undefined, on wasm setWallet fn");

  const bridge = getBridge();

  if (bridge.walletId !== clientID) {
    console.log("setWallet: ", clientID, sk, pk);
    bridge.jsProxy.bls = bls;
    bridge.jsProxy.secretKey = bls.deserializeHexStrToSecretKey(sk);
    bridge.jsProxy.publicKey = bls.deserializeHexStrToPublicKey(pk);
    console.log(
      "inside setWallet- bls:",
      bls,
      ",secretKey:",
      bridge.jsProxy.secretKey,
      ",publicKey:",
      bridge.jsProxy.publicKey
    );

    // use proxy.sdk to detect if sdk is ready
    const proxy = bridge.__proxy__;
    if (!proxy) {
      throw new Error("The Bridge proxy (__proxy__) is not initialized. Make sure to call createWasm first.");
    }
    await proxy.sdk.setWallet(clientID, pk, sk, mnemonic);
    bridge.walletId = clientID;
  }
}

/**
 * Loads the WebAssembly (Wasm) module and runs it within the Go instance.
 *
 * @param go The Go instance.
 */
async function loadWasm(go: InstanceType<Window["Go"]>) {
  // If instantiateStreaming doesn't exists, polyfill/create it on top of instantiate
  if (!WebAssembly?.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return await WebAssembly.instantiate(source, importObject);
    };
  }

  const result = await WebAssembly.instantiateStreaming(await fetch("zcn.wasm"), go.importObject);

  setTimeout(() => {
    if (g.__zcn_wasm__?.__wasm_initialized__ !== true) {
      console.warn("wasm window.__zcn_wasm__ (zcn.__wasm_initialized__) still not true after max time");
    }
  }, maxTime);

  go.run(result.instance);
}

/**
 * Creates a WebAssembly (Wasm) instance and returns a proxy object for accessing SDK methods.
 * @returns The proxy object for accessing SDK methods.
 */
export async function createWasm() {
  const bridge = getBridge();

  if (bridge.__proxy__) {
    return bridge.__proxy__;
  }

  const go = new g.Go();

  loadWasm(go);

  const sdkProxy = new Proxy(
    {},
    {
      get: (_, key) => {
        return (...args: any[]) => {
          return new Promise(async (resolve, reject) => {
            if (!go || go.exited) {
              return reject(new Error("The Go instance is not active."));
            }

            while (bridge.__wasm_initialized__ !== true) {
              await sleep(1000);
            }

            if (typeof bridge.sdk[key] !== "function") {
              resolve(bridge.sdk[key]);

              if (args.length !== 0) {
                reject(new Error("Retrieved value from WASM returned function type, however called with arguments."));
              }
              return;
            }

            try {
              let resp = bridge.sdk[key].apply(undefined, args);

              // support wasm.BindAsyncFunc
              if (resp && typeof resp.then === "function") {
                resp = await Promise.race([resp]);
              }

              if (resp && resp.error) {
                reject(resp.error);
              } else {
                resolve(resp);
              }
            } catch (e) {
              reject(e);
            }
          });
        };
      },
    }
  );

  const jsProxy = new Proxy(
    {},
    {
      get: <T extends keyof Bridge["jsProxy"]>(_: {}, key: T) => {
        const bridge = getBridge();
        return bridge.jsProxy[key];
      },
      set: <T extends keyof Bridge["jsProxy"]>(_: {}, key: T, value: Bridge["jsProxy"][T]) => {
        const bridge = getBridge();

        bridge.jsProxy[key] = value;
        return true;
      },
    }
  );

  const proxy: Bridge["__proxy__"] = {
    bulkUpload: bulkUpload,
    setWallet: setWallet,
    sdk: sdkProxy,
    jsProxy,
  };

  bridge.__proxy__ = proxy;

  return proxy;
}

const jsProxyMethods = {
  sign: blsSign,
  verify: blsVerify,
  verifyWith: blsVerifyWith,
  createObjectURL,
  sleep,
};
export type JsProxyMethods = typeof jsProxyMethods;

const sdkProxyMethods = {
  bulkUpload,
  setWallet,
};
export type SdkProxyMethods = typeof sdkProxyMethods;
