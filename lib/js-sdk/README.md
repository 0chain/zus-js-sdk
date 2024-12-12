# ZÜS JS Client SDK

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

The Züs SDK is a JavaScript client library that provides a convenient interface for interacting with the Züs Network. It allows developers to perform various operations such as creating and managing allocations, uploading and downloading files, executing smart contracts, and more.

## Züs Overview

[Züs](https://zus.network/) is a high-performance cloud on a fast blockchain offering privacy and configurable uptime. It is an alternative to traditional cloud S3 and has shown better performance on a test network due to its parallel data architecture. The technology uses erasure code to distribute the data between data and parity servers. Züs storage is configurable to provide flexibility for IT managers to design for desired security and uptime, and can design a hybrid or a multi-cloud architecture with a few clicks using [Blimp's](https://blimp.software/) workflow, and can change redundancy and providers on the fly.

For instance, the user can start with 10 data and 5 parity providers and select where they are located globally, and later decide to add a provider on-the-fly to increase resilience, performance, or switch to a lower cost provider.

Users can also add their own servers to the network to operate in a hybrid cloud architecture. Such flexibility allows the user to improve their regulatory, content distribution, and security requirements with a true multi-cloud architecture. Users can also construct a private cloud with all of their own servers rented across the globe to have a better content distribution, highly available network, higher performance, and lower cost.

[The QoS protocol](https://medium.com/0chain/qos-protocol-weekly-debrief-april-12-2023-44524924381f) is time-based where the blockchain challenges a provider on a file that the provider must respond within a certain time based on its size to pass. This forces the provider to have a good server and data center performance to earn rewards and income.

The [privacy protocol](https://zus.network/build) from Züs is unique where a user can easily share their encrypted data with their business partners, friends, and family through a proxy key sharing protocol, where the key is given to the providers, and they re-encrypt the data using the proxy key so that only the recipient can decrypt it with their private key.

Züs has ecosystem apps to encourage traditional storage consumption such as [Blimp](https://blimp.software/), a S3 server and cloud migration platform, and [Vult](https://vult.network/), a personal cloud app to store encrypted data and share privately with friends and family, and [Chalk](https://chalk.software/), a zero upfront cost permanent storage solution for NFT artists.

Other apps are [Bolt](https://bolt.holdings/), a wallet that is very secure with air-gapped 2FA split-key protocol to prevent hacks from compromising your digital assets, and it enables you to stake and earn from the storage providers; [Atlus](https://atlus.cloud/), a blockchain explorer and [Chimney](https://demo.chimney.software/), which allows anyone to join the network and earn using their server or by just renting one, with no prior knowledge required.

## Get Started

This sections aims at getting you started with the Züs SDK.

- [Installation](#installation)
- [SDK Reference](#sdk-reference)
- [Contributing](#contributing)

## Installation

### Prerequisites

#### Yarn Package Manager

##### Linux

```
sudo apt update
sudo apt install curl
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt install yarn -y
```

##### Mac

In Mac Yarn can be installed using the Homebrew package manager. To install Yarn on macOS, open a terminal and type:

```
brew install yarn
```

Note: Make sure that Homebrew is installed properly using the command below

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

##### Windows

Download yarn windows based msi installer from [here](https://github.com/yarnpkg/yarn/releases/download/v1.22.19/yarn-1.22.19.msi)

### Install zus-sdk

Add the zus-sdk package for use in your project

```
yarn add @zerochain/zus-sdk
```

---

## SDK Reference

Zus JS-sdk provides many functions for implemention blobber,allocation and file operation functionalities in web applications.

To get a comprehensive understanding of the functions exposed by the JS SDK, you can refer to the [index file](https://github.com/0chain/zus-js-sdk/blob/main/lib/js-sdk/src/index.ts) in the SDK repository. 

Most of the functions are well-documented using JS Docs comments, making it easy to understand their usage and parameters.

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

## Example Applications

Explore the following example applications to understand how the Züs JS SDK can be used in real-world scenarios:

### **[Next.js Example Application](https://github.com/0chain/zus-example-webapp/tree/72c7a550a05323503691e69c0d36c1c227e7a4e8)**  
This web application demonstrates integrating the Züs JS SDK with a Next.js project. It showcases key functionalities for interacting with the Züs blockchain, including wallet creation, allocation management, and token-based transactions.  

**Supported Features**:  
- **Bolt**: Integrates the cryptocurrency wallet functionality to manage ZCN and Ethereum tokens, including staking and rewards.  
- **Vult**: Implements decentralized anonymous file-sharing where users can upload and securely share files.  

Live Preview: [https://dev-zus-webapp.zus.network](https://dev-zus-webapp.zus.network)

### **[Static Website Example](https://github.com/0chain/zus-example-website)**  
This static website illustrates how to use the Züs JS SDK to integrate decentralized storage into a traditional web app. It features real-time asset management using the Züs storage backend and IndexedDB caching for enhanced performance.  

**Core Highlights**:  
- Guide to downloading assets from Züs allocations using an `authTicket`.  
- Integration of Züs storage for hosting website assets securely and efficiently.  
- Step-by-step implementation of the Züs SDK methods, including wallet creation, file sharing, and asset caching in IndexedDB.  

Live Preview: [https://dev-zus-website.zus.network](https://dev-zus-website.zus.network)


## Utilities

The Züs SDK also provides some utility functions that may be helpful during development:

- `createWallet()`: Generates a new wallet with a random mnemonic and returns the wallet information.
- `recoverWallet(mnemonic: string)`: Recovers a wallet using a given mnemonic and returns the wallet information.
- `decodeAuthTicket(authTicket: string)`: Decodes an authentication ticket and returns the decoded object.
- `truncateAddress(addressString: string, start: number, flag: boolean, end: number): string`: Truncates an address string for display purposes.
- `hexStringToByte(str: string): Uint8Array`: Converts a hexadecimal string to a Uint8Array.

These utility functions can be imported and used as needed in your application.

With the provided functions and utilities, developers can easily interact with the ZeroChain network, perform transactions, retrieve balances, and utilize various utility functions.

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
