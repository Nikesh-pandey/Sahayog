import React, { useState, useEffect } from "react";
import { Campaign } from "./types";
import { CampaignAlgorithms } from "./algorithms/CampaignAlgorithm";
import { Clock, ChartBar } from "lucide-react";

interface CampaignCardProps {
  campaign: Campaign;
  allCampaigns: Campaign[];
  onDonate: (campaign: Campaign) => void;
  onClaim: (campaign: Campaign) => void;
  account: string | null;
  isCampaignActive: (campaign: Campaign) => boolean;
  getCampaignStatus: (campaign: Campaign) => string;
  getTimeLeft: (deadline: number) => string;
}

export function CampaignCard({
  campaign,
  allCampaigns,
  onDonate,
  onClaim,
  account,
  isCampaignActive,
  getCampaignStatus,
  getTimeLeft,
}: CampaignCardProps) {
  const [showMetrics, setShowMetrics] = useState(false);
  const [similarityMetrics, setSimilarityMetrics] = useState<{
    mostSimilar: Campaign | null;
    similarity: number;
  }>({ mostSimilar: null, similarity: 0 });

  useEffect(() => {
    if (allCampaigns.length > 1) {
      const similar = CampaignAlgorithms.findSimilarCampaigns(
        allCampaigns,
        campaign,
        1
      );
      if (similar.length > 0) {
        setSimilarityMetrics({
          mostSimilar: similar[0],
          similarity: similar[0].similarityScore || 0,
        });
      }
    }
  }, [campaign, allCampaigns]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] duration-200">
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
                  (Number(campaign.amountCollected) / Number(campaign.target)) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Similarity Metrics Toggle */}
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ChartBar className="w-4 h-4" />
          {showMetrics ? "Hide Metrics" : "Show Metrics"}
        </button>

        {/* Similarity Metrics Panel */}
        {showMetrics && similarityMetrics.mostSimilar && (
          <div className="mt-2 p-3 bg-gray-800/50 rounded-lg text-sm">
            <div className="mb-2">
              <span className="text-gray-400">Similarity Score:</span>
              <span className="ml-2 text-purple-400 font-medium">
                {(similarityMetrics.similarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-gray-400">
              Most similar to:{" "}
              <span className="text-white">
                {similarityMetrics.mostSimilar.title}
              </span>
            </div>
          </div>
        )}
        {/* 
        <div className="pt-4 space-y-3">
          {account?.toLowerCase() === campaign.owner.toLowerCase() &&
            !campaign.claimed &&
            (campaign.deadline * 1000 < Date.now() ||
              Number(campaign.amountCollected) >= Number(campaign.target)) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(campaign);
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
              onDonate(campaign);
            }}
            disabled={!isCampaignActive(campaign)}
          >
            <span className="font-medium">{getCampaignStatus(campaign)}</span>
          </button>
        </div> */}
      </div>
    </div>
  );
}
