import { Campaign } from "./types";
import {
  CampaignAlgorithms,
  CampaignWithSimilarity,
} from "./algorithms/CampaignAlgorithm";
import { ChartBar, ArrowRight } from "lucide-react";

interface SimilarCampaignsProps {
  selectedCampaign: Campaign;
  allCampaigns: Campaign[];
  onCampaignClick: (campaign: Campaign) => void;
}

export function SimilarCampaigns({
  selectedCampaign,
  allCampaigns,
  onCampaignClick,
}: SimilarCampaignsProps) {
  const similarCampaigns = CampaignAlgorithms.findSimilarCampaigns(
    allCampaigns,
    selectedCampaign
  );

  if (similarCampaigns.length === 0) return null;

  return (
    <div className="mt-12 glass-card p-6 rounded-2xl">
      <h1>this is similarCampaigns</h1>

      <div className="flex items-center gap-2 mb-6">
        <ChartBar className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Similar Campaigns
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarCampaigns.map((campaign: CampaignWithSimilarity) => (
          <div
            key={campaign.id}
            className="relative bg-gray-800/50 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            onClick={() => onCampaignClick(campaign)}
          >
            <div className="absolute top-3 right-3 bg-purple-500/90 text-white px-2 py-1 rounded-lg text-sm">
              {((campaign.similarityScore || 0) * 100).toFixed(1)}% Match
            </div>

            <img
              src={campaign.image}
              alt={campaign.title}
              className="w-full h-32 object-cover"
            />

            <div className="p-4">
              <h3 className="font-medium text-white mb-2">{campaign.title}</h3>

              {campaign.similarityDetails && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Target Match</span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{
                          width: `${campaign.similarityDetails.target * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Timeline Match</span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-pink-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            campaign.similarityDetails.deadline * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Progress Match</span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            campaign.similarityDetails.progress * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  onCampaignClick(campaign);
                }}
              >
                View Campaign
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
