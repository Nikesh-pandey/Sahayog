import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CampaignAlgorithms } from "../algorithms/CampaignAlgorithm";
import type { Campaign, Web3ContextType } from "../types";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function createCampaign(string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image) public returns (uint256)",
  "function donateToCampaign(uint256 _id) public payable",
  "function getCampaign(uint256 _id) public view returns (address owner, string memory title, string memory description, uint256 target, uint256 deadline, uint256 amountCollected, string memory image, bool claimed)",
  "function numberOfCampaigns() public view returns (uint256)",
  "function claimFunds(uint256 _id) public",
  "event FundsClaimed(uint256 indexed id, address indexed owner, uint256 amount)",
  "event DonationMade(uint256 indexed id, address indexed donor, uint256 amount)",
];

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setContract(null);
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = await provider.getSigner();

      const crowdFundingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      crowdFundingContract.on("FundsClaimed", (id, owner, amount, event) => {
        console.log("Funds claimed:", {
          id: id.toString(),
          owner,
          amount: ethers.formatEther(amount),
          transactionHash: event.transactionHash,
        });
      });

      crowdFundingContract.on("DonationMade", (id, donor, amount, event) => {
        console.log("Donation made:", {
          id: id.toString(),
          donor,
          amount: ethers.formatEther(amount),
          transactionHash: event.transactionHash,
        });
      });

      setAccount(accounts[0]);
      setContract(crowdFundingContract);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  const createCampaign = async (
    title: string,
    description: string,
    target: string,
    deadline: number,
    image: string
  ) => {
    try {
      if (!contract) throw new Error("Contract not initialized");

      const parsedAmount = ethers.parseEther(target);
      const tx = await contract.createCampaign(
        title,
        description,
        parsedAmount,
        deadline,
        image
      );
      await tx.wait();
    } catch (error) {
      console.error("Failed to create campaign:", error);
      throw error;
    }
  };

  const getCampaigns = async () => {
    try {
      if (!contract) throw new Error("Contract not initialized");

      const numberOfCampaigns = await contract.numberOfCampaigns();
      const campaigns: Campaign[] = [];

      for (let i = 0; i < Number(numberOfCampaigns); i++) {
        const campaign = await contract.getCampaign(i);
        campaigns.push({
          id: i,
          owner: campaign[0].toLowerCase(),
          title: campaign[1],
          description: campaign[2],
          target: ethers.formatEther(campaign[3]),
          deadline: Number(campaign[4]),
          amountCollected: ethers.formatEther(campaign[5]),
          image: campaign[6],
          claimed: campaign[7],
        });
      }

      return campaigns;
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      throw error;
    }
  };

  const donateToCampaign = async (id: number, amount: string) => {
    try {
      if (!contract) throw new Error("Contract not initialized");

      const campaign = await contract.getCampaign(id);
      const currentAmount = ethers.formatEther(campaign[5]);
      const target = ethers.formatEther(campaign[3]);

      console.log("Pre-donation:", {
        currentAmount,
        target,
        willReachTarget:
          parseFloat(currentAmount) + parseFloat(amount) >= parseFloat(target),
      });

      const parsedAmount = ethers.parseEther(amount);
      const tx = await contract.donateToCampaign(id, { value: parsedAmount });
      const receipt = await tx.wait();

      console.log("Donation transaction:", {
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
      });

      const updatedCampaign = await contract.getCampaign(id);
      console.log("Post-donation:", {
        amountCollected: ethers.formatEther(updatedCampaign[5]),
        claimed: updatedCampaign[7],
      });
    } catch (error) {
      console.error("Failed to donate:", error);
      throw error;
    }
  };

  const claimFunds = async (id: number) => {
    try {
      if (!contract) throw new Error("Contract not initialized");

      const campaign = (await getCampaigns())[id];
      if (!isOwner(campaign)) {
        throw new Error("Only the campaign owner can claim funds");
      }
      if (!isCampaignClaimable(campaign)) {
        throw new Error("Campaign is not claimable yet");
      }

      const tx = await contract.claimFunds(id);
      const receipt = await tx.wait();

      console.log("Claim transaction:", {
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
      });
    } catch (error) {
      console.error("Failed to claim funds:", error);
      throw error;
    }
  };

  const isCampaignClaimable = (campaign: Campaign) => {
    const now = Date.now();
    const deadlineReached = now > campaign.deadline * 1000;
    const hasBalance = parseFloat(campaign.amountCollected) > 0;
    const targetReached =
      parseFloat(campaign.amountCollected) >= parseFloat(campaign.target);

    return (
      !campaign.claimed && hasBalance && (deadlineReached || targetReached)
    );
  };

  const isOwner = (campaign: Campaign) => {
    return account?.toLowerCase() === campaign.owner.toLowerCase();
  };

  const fetchAndCacheCampaigns = async () => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      const fetchedCampaigns = await getCampaigns();
      setCampaigns(fetchedCampaigns);
      return fetchedCampaigns;
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      throw error;
    }
  };

  const getSimilarCampaigns = async (campaignId: number) => {
    const currentCampaigns = await fetchAndCacheCampaigns();
    const targetCampaign = currentCampaigns.find((c) => c.id === campaignId);
    if (!targetCampaign) throw new Error("Campaign not found");
    return CampaignAlgorithms.findSimilarCampaigns(
      currentCampaigns,
      targetCampaign
    );
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        connectWallet,
        createCampaign,
        getCampaigns,
        donateToCampaign,
        claimFunds,
        isCampaignClaimable,
        isOwner,
        getSimilarCampaigns,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
