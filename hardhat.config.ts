import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import { HttpNetworkAccountsUserConfig, NetworkUserConfig } from "hardhat/types";
import "tsconfig-paths/register";
import dotenv from "dotenv";

dotenv.config();

import "./tasks";

const privateKey = process.env.PRIVATE_KEY;
const mnemonic = process.env.MNEMONIC;

const getAccounts = (networkName: string): HttpNetworkAccountsUserConfig => {
  if (networkName) {
    const envVar = `${networkName.replaceAll("-", "_").toUpperCase()}_MNEMONIC`;
    if (process.env[envVar]) {
      return {
        mnemonic: process.env[envVar],
        count: 10,
        path: "m/44'/60'/0'/0",
      };
    }
  }
  if (privateKey) {
    // can add as many private keys as you want
    return [
      `0x${privateKey}`,
    ];
  } else if (mnemonic) {
    return {
      mnemonic,
      count: 10,
      path: "m/44'/60'/0'/0",
    };
  } else {
    throw new Error("No private key or mnemonic found in env");
  }
};

function getAllNetworkConfigs(): Record<string, NetworkUserConfig> {
  const networks: Record<string, NetworkUserConfig> = {
    shape: {
      url: "https://mainnet.shape.network",
      chainId: 360,
      accounts: getAccounts("shape"),
    },
  };
  return networks;
}

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  defaultNetwork: "shape",
  networks: {
    ...getAllNetworkConfigs(),
  },
  namedAccounts: {
    otomToken: {
      shape: "0x2f9810789aebBB6cdC6c0332948fF3B6D11121E3"
    },
    otomDatabase: { // V2 impl: 0xf150b5263b3b6C6c04b30cAD45F56138b7c6c91D
      shape: "0x953761a771d6Ad9F888e41b3E7c9338a32b1A346"
    },
    otomEncoder: {
      shape: "0x624c7801C48046B4477aEbE2F128F09d4263288C"
    },
    otomAnnihilator: {
      shape: "0xca3088aedaAB138cAB3F0c135ceD77aF1a8b9063"
    },
    otomEnergy: {
      shape: "0x42276dF82BAb34c3CCcA9e5c058b6ff7EA4d07e3"
    },
    otomReactor: {
      shape: "0xB8874fCE9b702B191C306A21c7A4a101FB14a0fc"
    },
    otomReactionOutput: {
      shape: "0x7d5A370F277e1847E4f768a88758237c6E3456eD"
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache_hardhat",
    deploy: "./deploy",
    deployments: "./deployments",
    sources: "./src",
    tests: "./test/hardhat",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
