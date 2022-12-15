import { ethers } from "./ethers-5.2.esm.min.js";
import { ABI, ADDRESS } from "./constants.js";

const connectBtn = document.getElementById("connectBtn");
const currBalance = document.getElementById("balance");
const fundForm = document.getElementById("fundForm");

const displayBanner = (message, delay) => {
  const banner = document.getElementById("banner");
  banner.innerText = message;
  banner.style.transform = "scale(1)";
  setTimeout(() => {
    banner.style.transform = "scale(0)";
  }, delay * 1000);
};

connectBtn.addEventListener("click", async () => {
  try {
    if (typeof window.ethereum !== undefined) {
      await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Metamask connected !");
      connectBtn.innerText = "Connected";
      connectBtn.setAttribute("disabled", "");
      displayBanner("Connected successfully !", 1);
    }
  } catch (e) {
    console.log(e);
  }
});

currBalance.addEventListener("click", async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const res = await provider.getBalance(ADDRESS);
    document.getElementById(
      "displayBalance"
    ).innerText = `Current balance is : ${res.toString()} wei`;
  } catch (e) {
    console.log(e);
  }
});

const fund = async (ethAmount) => {
  try {
    if (typeof window.ethereum !== undefined) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI, signer);
      const transactionResponse = await contract.fund({
        value: ethAmount.toString(),
      });
      console.log(transactionResponse);
      console.log(`Mining ${transactionResponse.hash}`);
      const transactionReceipt = await transactionResponse.wait();
      console.log(transactionReceipt);
      displayBanner("Amount funded successfully", 2);
    }
  } catch (e) {
    console.log(e);
  }
};

fundForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ethAmount = new FormData(fundForm).get("ethAmount");
  fund(ethAmount);
  document.getElementById("ethAmount").value = "";
});
