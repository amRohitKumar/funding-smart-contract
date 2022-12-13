const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async function () {
        // as name suggests, this function get called before every test
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture(["all"]); // will deploy all of our contracts
        fundMe = await ethers.getContract("FundMe", deployer); // will give the most resent deployment of FundMe contract
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });
      describe("constructor", async function () {
        it("Sets the aggregator address correctly", async function () {
          const response = await fundMe.s_pricefeed();
          assert(mockV3Aggregator.address, response);
        });
      });
      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("Update the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.s_addressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Update the funder array", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.s_funders(0);
          assert.equal(response, deployer);
        });
      });
      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });
        it("Withdraw ETH from a single user", async function () {
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingUserBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingUserBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingContractBalance, 0);
          assert.equal(
            endingUserBalance.add(gasCost).toString(),
            startingUserBalance.add(startingContractBalance).toString()
          );
        });
        it("Reset the funder array", async function () {
          await fundMe.withdraw();
          const response = await fundMe.s_funders.length;
          assert.equal(response, 0);
        });
        it("Only allows owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const anotherUser = accounts[1];
          const anotherConnectedFundMe = await fundMe.connect(anotherUser);
          await expect(
            anotherConnectedFundMe.withdraw()
          ).to.be.revertedWithCustomError(
            anotherConnectedFundMe,
            "FundMe__NotOwner"
          );
        });
      });
    });
