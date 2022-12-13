const { network } = require("hardhat");
const { networkCofig, developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/vefify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const { chainId } = network.config;
  log(chainId);
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkCofig[chainId]["ethUsdPriceFeed"];
  }

  const args = [ethUsdPriceFeedAddress];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });
  log("-----------------------------------------------------");

  if (!developmentChains.includes(network.name)) {
    await verify(fundMe.address, args);
  }
};

module.exports.tags = ["all", "fundme"];
