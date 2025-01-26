import React, { useEffect, useState } from "react";
import { useWeb3 } from "./context/Web3Context";
import { CampaignGrid } from "./CampaignGrid";

import { Campaign, Transaction } from "./types";
import {
  PlusCircle,
  Wallet,
  Clock,
  Target,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface Campaign {
  id: number;
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  image: string;
  claimed: boolean;
}

function App() {
  const {
    account,
    connectWallet,
    createCampaign,
    getCampaigns,
    donateToCampaign,
    claimFunds,
    getSimilarCampaigns,
  } = useWeb3();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

  // Add this state in the App component
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev].slice(0, 10)); // Keep last 10 transactions
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });

  const getTimeLeft = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline * 1000 - now;

    if (timeLeft <= 0) return "Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleClaimFunds = async (campaign: Campaign) => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await claimFunds(campaign.id);
      // Add transaction to history
      addTransaction({
        from: campaign.owner,
        to: account,
        amount: campaign.amountCollected,
        timestamp: Date.now(),
        type: "claim",
      });
      alert("Funds claimed successfully!");
      await loadCampaigns();
    } catch (err: any) {
      console.error("Failed to claim funds:", err);
      alert(err.message || "Failed to claim funds. Please try again.");
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(
        "Failed to load campaigns. Please make sure your wallet is connected."
      );
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadCampaigns();
    }
  }, [account]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);
      await createCampaign(
        formData.title,
        formData.description,
        formData.target,
        deadline,
        formData.image
      );
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        target: "",
        deadline: "",
        image: "",
      });
      await loadCampaigns();
    } catch (err) {
      console.error("Failed to create campaign:", err);
      alert("Failed to create campaign. Please try again.");
    }
  };

  const handleDonate = async (campaign: Campaign) => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    if (campaign.claimed) {
      alert("This campaign has ended and funds have been claimed.");
      return;
    }

    if (campaign.deadline * 1000 < Date.now()) {
      alert("This campaign has ended.");
      return;
    }

    const amount = prompt("Enter amount to donate (ETH):");
    if (!amount) return;

    const remainingAmount =
      Number(campaign.target) - Number(campaign.amountCollected);
    if (remainingAmount <= 0) {
      alert("This campaign has reached its target amount.");
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      alert("Please enter a valid donation amount greater than 0 ETH");
      return;
    }
    if (donationAmount > remainingAmount) {
      alert(
        `Maximum donation amount for this campaign is ${remainingAmount} ETH`
      );
      return;
    }

    try {
      await donateToCampaign(campaign.id, amount);
      alert("Thank you for your donation!");
      await loadCampaigns();
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Failed to process donation. Please try again.");
    }
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const isCampaignActive = (campaign: Campaign) => {
    const isNotClaimed = !campaign.claimed;
    const hasNotExpired = campaign.deadline * 1000 > Date.now();
    const hasNotReachedTarget =
      Number(campaign.amountCollected) < Number(campaign.target);
    return isNotClaimed && hasNotExpired && hasNotReachedTarget;
  };

  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.claimed) return "Campaign Completed";
    if (campaign.deadline * 1000 < Date.now()) return "Deadline Passed";
    if (Number(campaign.amountCollected) >= Number(campaign.target))
      return "Target Reached";
    return "Donate";
  };

  const stats = {
    totalRaised: campaigns
      .reduce((acc, campaign) => acc + Number(campaign.amountCollected), 0)
      .toFixed(2),
    totalCampaigns: campaigns.length,
    uniqueDonors: 156,
    successRate: "89%",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900">
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full animate-spin-slow">
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full animate-spin-slow-reverse">
            <div className="absolute bottom-1/2 right-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <h1 className="text-2xl font-bold text-white">Sahayog</h1>
            </div>
            <div className="flex gap-4">
              {account && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create Campaign
                </button>
              )}
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                <Wallet className="w-5 h-5" />
                {account
                  ? `${account.slice(0, 6)}...${account.slice(-4)}`
                  : "Connect Wallet"}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 text-center px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white bg-clip-text">
              Decentralized Crowdfunding for the Future
            </h1>
            <p className="text-gray-300 text-lg">
              Launch your campaign, support great ideas, and make a difference
              in the world through blockchain technology.
            </p>
            {!account && (
              <button
                onClick={connectWallet}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Stats */}
          {account && (
            <div className="max-w-7xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-purple-500/10 text-purple-400 mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.totalRaised} ETH
                </div>
                <div className="text-gray-400 text-sm">Total Raised</div>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-pink-500/10 text-pink-400 mx-auto">
                  <Target className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.totalCampaigns}
                </div>
                <div className="text-gray-400 text-sm">Total Campaigns</div>
              </div>
              {/* <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-blue-500/10 text-blue-400 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.uniqueDonors}
                </div>
                <div className="text-gray-400 text-sm">Unique Donors</div>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-green-500/10 text-green-400 mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.successRate}
                </div>
                <div className="text-gray-400 text-sm">Success Rate</div>
              </div> */}
            </div>
          )}
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          {/* Test Campaigns Button */}
          {/* {account && !loading && (
            <button
              onClick={() => setCampaigns(testCampaigns)}
              className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              Load Test Campaigns
            </button>
          )} */}

          {showForm && (
            <div className="glass-card mb-8 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Create New Campaign
              </h2>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Target Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.target}
                    onChange={(e) =>
                      setFormData({ ...formData, target: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20"
                  >
                    Create Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {account && !loading && !error && campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="glass-card rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] duration-200 cursor-pointer"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  <img
                    src={
                      campaign.image ||
                      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                    }
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {campaign.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>{getTimeLeft(campaign.deadline)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Target</span>
                        <span className="text-white font-medium">
                          {campaign.target} ETH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Raised</span>
                        <span className="text-white font-medium">
                          {campaign.amountCollected} ETH
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2 mt-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (Number(campaign.amountCollected) /
                                Number(campaign.target)) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      {account?.toLowerCase() ===
                        campaign.owner.toLowerCase() &&
                        !campaign.claimed &&
                        (campaign.deadline * 1000 < Date.now() ||
                          Number(campaign.amountCollected) >=
                            Number(campaign.target)) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimFunds(campaign);
                            }}
                            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-all duration-200 shadow-lg shadow-green-500/20"
                          >
                            <span className="font-medium">Claim Funds</span>
                          </button>
                        )}

                      <button
                        className={`w-full py-2 px-4 rounded-xl transition-all duration-200 ${
                          !isCampaignActive(campaign)
                            ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDonate(campaign);
                        }}
                        disabled={!isCampaignActive(campaign)}
                      >
                        <span className="font-medium">
                          {getCampaignStatus(campaign)}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading and Error States */}
          {!account && (
            <div className="glass-card text-center py-12 rounded-2xl">
              <p className="text-gray-300 text-lg">
                Please connect your wallet to view campaigns
              </p>
            </div>
          )}

          {account && loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-300 text-lg">Loading campaigns...</p>
            </div>
          )}

          {account && error && (
            <div className="glass-card text-center py-12 rounded-2xl">
              <p className="text-red-400 text-lg font-medium">{error}</p>
            </div>
          )}

          {/* Similar Campaigns Section */}
          {/* {selectedCampaign && (
            <SimilarCampaigns
              selectedCampaign={selectedCampaign}
              allCampaigns={campaigns}
              onCampaignClick={handleCampaignClick}
            />
          )} */}

          {/* {selectedCampaign && (
            <AlgorithmDemo
              selectedCampaign={selectedCampaign}
              allCampaigns={campaigns}
            />
          )} */}
          {account && !loading && !error && campaigns.length > 0 && (
            <CampaignGrid
              campaigns={campaigns}
              selectedCampaign={selectedCampaign}
              onDonate={handleDonate}
              onClaim={handleClaimFunds}
              account={account}
              isCampaignActive={isCampaignActive}
              getCampaignStatus={getCampaignStatus}
              getTimeLeft={getTimeLeft}
            />
          )}

          {/* {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              allCampaigns={campaigns}
              onDonate={handleDonate}
              onClaim={handleClaimFunds}
              account={account}
              isCampaignActive={isCampaignActive}
              getCampaignStatus={getCampaignStatus}
              getTimeLeft={getTimeLeft}
            />
          ))} */}

          {/* {account && !loading && !error && campaigns.length > 0 && (
            <CampaignGroups
              campaigns={campaigns}
              onCampaignClick={handleCampaignClick}
            />
          )} */}
        </main>
      </div>
    </div>
  );
}

export default App;
