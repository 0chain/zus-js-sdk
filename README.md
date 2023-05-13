# ZÜS JS Client SDK

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

The Züs SDK is a JavaScript client library that provides a convenient interface for interacting with the Züs Network. It allows developers to perform various operations such as creating and managing allocations, uploading and downloading files, executing smart contracts, and more.

## Get Started

This sections aims at getting you started with the Züs SDK. For a detailed documentation and reference, please refer to the [SDK documentation](https://docs.zus.network/guides/zus-js-sdk/get-started).

### Install

```bash
npm install @zerochain/zus-sdk

# or

yarn add @zerochain/zus-sdk
```

## Usage

To use the Züs SDK in your project, import the necessary functions and utilities:

```js
import { init, createWasm, getBalance, sendTransaction } from "@zerochain/zus-sdk";
```

### Initialize WebAssembly

Before using the Züs SDK, you need to initialize the WebAssembly module by calling the init function:

```js
const config = {
  // configuration options
};

await init(config);
const wasm = await createWasm();
```

The `init` function initializes the Züs SDK with the provided configuration, and `createWasm` returns the WebAssembly instance.

### Get Balance

To get the balance of a client, use the `getBalance` function:

```js
const clientId = "client_id";
const balance = await getBalance(clientId);

console.log(balance);
```

The `getBalance` function retrieves the balance of the specified client from the Züs Network.

### Send Transaction

To send a transaction from one client to another, use the `sendTransaction` function:

```js
const fromClient = "sender_client_id";
const toClient = "recipient_client_id";
const value = 10; // transaction value
const note = "Transaction note";

const response = await sendTransaction(fromClient, toClient, value, note);

console.log(response);
```

The `sendTransaction` function sends a transaction from the specified sender client to the recipient client with the specified value and note.

Refer to the [SDK documentation](https://docs.zus.network/guides/zus-js-sdk/get-started) for detailed information about the usage and detailed references.

## Utilities

The Züs SDK also provides some utility functions that may be helpful during development:

- `createWallet()`: Generates a new wallet with a random mnemonic and returns the wallet information.
- `recoverWallet(mnemonic: string)`: Recovers a wallet using a given mnemonic and returns the wallet information.
- `decodeAuthTicket(authTicket: string)`: Decodes an authentication ticket and returns the decoded object.
- `truncateAddress(addressString: string, start: number, flag: boolean, end: number): string`: Truncates an address string for display purposes.
- `hexStringToByte(str: string): Uint8Array`: Converts a hexadecimal string to a Uint8Array.

These utility functions can be imported and used as needed in your application.

With the provided functions and utilities, developers can easily interact with the ZeroChain network, perform transactions, retrieve balances, and utilize various utility functions.

Please refer to the [SDK documentation](https://docs.zus.network/guides/zus-js-sdk/get-started) for more details and usage examples.

## Contributing

We'd love to accept your patches and contributions to this project. There are just a few guidelines you need to follow.

### [Code of Conduct](.github/CODE_OF_CONDUCT.md)

This project follows [Contributor Covenant](https://www.contributor-covenant.org/)
as it's Code of Conduct, and we expect all project participants to adhere to it.
Please read the [full guide](.github/CODE_OF_CONDUCT.md) so that you can understand
what actions will not be tolerated.

### [Contributing Guide](.github/CONTRIBUTING.md)

Read our [contributing guide](.github/CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to project.

### [LICENSE](./LICENSE)

The SDK is released under the [MIT License](./LICENSE).
