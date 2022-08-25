# ZUS JS Client SDK

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

ZUS SDK is a JS Client SDK to interact with 0Chain network.

## Get Started

### Install

```bash
npm install zus-sdk
```

### Usage

```js
import ZUS from 'zus-sdk';

const zus = new ZUS().init({
  provider: 'http://localhost:8545',
  networkId: '1',
  chainId: '1',
  gasPrice: '1000000000',
  gasLimit: '21000',
  from: '0x0000000000000000000000000000000000000000',
  privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
});

zus.getBalance('0x0000000000000000000000000000000000000000').then(console.log);

zus.getTransactionCount('0x0000000000000000000000000000000000000000').then(console.log);


zus.getBlockNumber().then(console.log);

```

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

This project is licensed under the [MIT License](./LICENSE), meaning that you're free to modify, distribute, and / or use it for any commercial or private project.
