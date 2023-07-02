const CONTRACTS = require("./contracts");
const ADDRESS = require("./address");
const PROVIDERS = require("./providers");
const ABI = require("./abi")

const CHAINIDTONAME = {
    1115511: "SEPOLIA",
    80001: "MUMBAI"

}

module.exports = {
  CONTRACTS,
  ADDRESS,
  PROVIDERS,
  ABI,
  CHAINIDTONAME
};