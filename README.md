# ZUS JS Client SDK

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

- [JS-SDK - a Javascript based SDK for 0Chain dStorage]()
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

## SDK Reference

Zus JS-sdk provides many functions for implemention blobber,allocation and file operation functionalities in web applications.

- See [gitbook](https://docs.zus.network/guides/zus-js-sdk/sdk-reference) for extensive list.

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
