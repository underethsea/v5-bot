const { ethers } = require("ethers");

const GetLogs = (receipt, abi) => {
    let iface = new ethers.utils.Interface(abi);
    var logs = receipt.logs.map(log => {
      var parsedLog = null;
      try {
        parsedLog = iface.parseLog(log);
      } catch (e) {
        return null;
      }
      return parsedLog;
    }).filter(log => log !== null);
    return logs;
  };

  module.exports = {GetLogs}