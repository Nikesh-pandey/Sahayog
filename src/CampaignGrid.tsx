import { CampaignCard } from "./CampaignCard";
import { Campaign } from "./types";
import { CampaignAlgorithms } from "./algorithms/CampaignAlgorithm";

interface CampaignGridProps {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  onDonate: (campaign: Campaign) => void;
  onClaim: (campaign: Campaign) => void;
  account: string | null;
  isCampaignActive: (campaign: Campaign) => boolean;
  getCampaignStatus: (campaign: Campaign) => string;
  getTimeLeft: (deadline: number) => string;
}

export function CampaignGrid({
  campaigns,
  selectedCampaign,
  onDonate,
  onClaim,
  account,
  isCampaignActive,
  getCampaignStatus,
  getTimeLeft,
}: CampaignGridProps) {
  // Group campaigns by similarity clusters
  const groupCampaigns = () => {
    if (!selectedCampaign) return { groups: [], other: campaigns };

    // Create similarity matrix for all campaigns
    const similarityMatrix: { [key: string]: Campaign[] } = {};

    // First pass: Calculate similarities and create initial groups
    campaigns.forEach((campaign1) => {
      campaigns.forEach((campaign2) => {
        if (campaign1.id === campaign2.id) return;

        const similar = CampaignAlgorithms.findSimilarCampaigns(
          [campaign2],
          campaign1,
          1
        );
        const similarity = similar[0]?.similarityScore || 0;

        // If similarity is above threshold, add to matrix
        if (similarity >= 0.7) {
          const groupKey = `group_${campaign1.id}`;
          if (!similarityMatrix[groupKey]) {
            similarityMatrix[groupKey] = [campaign1];
          }
          if (!similarityMatrix[groupKey].find((c) => c.id === campaign2.id)) {
            similarityMatrix[groupKey].push(campaign2);
          }
        }
      });
    });

    // Second pass: Merge overlapping groups
    const mergedGroups = Object.values(similarityMatrix).reduce(
      (acc, group) => {
        const overlappingGroupIndex = acc.findIndex((existingGroup) =>
          existingGroup.some((campaign1) =>
            group.some((campaign2) => campaign1.id === campaign2.id)
          )
        );

        if (overlappingGroupIndex >= 0) {
          // Merge with existing group
          group.forEach((campaign) => {
            if (!acc[overlappingGroupIndex].find((c) => c.id === campaign.id)) {
              acc[overlappingGroupIndex].push(campaign);
            }
          });
        } else {
          // Create new group
          acc.push(group);
        }

        return acc;
      },
      [] as Campaign[][]
    );

    // Find campaigns that aren't in any group
    const groupedCampaignIds = new Set(
      mergedGroups.flat().map((campaign) => campaign.id)
    );
    const otherCampaigns = campaigns.filter(
      (campaign) => !groupedCampaignIds.has(campaign.id)
    );

    return { groups: mergedGroups, other: otherCampaigns };
  };

  const { groups, other } = groupCampaigns();

  return (
    <div className="space-y-12">
      {groups.map((group, index) => (
        <div key={index}>
          <h2 className="text-xl font-semibold mb-6 text-white mt-6">
            Campaign Group {index + 1}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                allCampaigns={campaigns}
                onDonate={onDonate}
                onClaim={onClaim}
                account={account}
                isCampaignActive={isCampaignActive}
                getCampaignStatus={getCampaignStatus}
                getTimeLeft={getTimeLeft}
              />
            ))}
          </div>
        </div>
      ))}

      {other.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 text-white mt-6">
            Other Campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {other.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                allCampaigns={campaigns}
                onDonate={onDonate}
                onClaim={onClaim}
                account={account}
                isCampaignActive={isCampaignActive}
                getCampaignStatus={getCampaignStatus}
                getTimeLeft={getTimeLeft}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
