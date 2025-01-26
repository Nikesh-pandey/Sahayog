import { Campaign } from "../types";
//types given
export interface SimilarityScore {
  score: number;
  details: {
    target: number;
    deadline: number;
    category: number;
  };
}

export interface CampaignWithSimilarity extends Campaign {
  similarityScores?: {
    [key: number]: SimilarityScore;  // Campaign ID -> Similarity Score ,id given
  };
  topSimilar?: number[];  // Array of campaign IDs, sorted by similarity,
}

export class CampaignAlgorithms {
  private static SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold

  static findSimilarCampaigns(campaigns: Campaign[], targetCampaign: Campaign, limit = 3): CampaignWithSimilarity[] {
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return [];
    }

    // Calculate similarity scores for the target campaign
    const campaignWithScores = this.calculateSimilarityScores(targetCampaign, campaigns);
    
    // Get the top similar campaigns
    const topSimilar = campaignWithScores.topSimilar || [];
    
    return topSimilar
      .slice(0, limit)
      .map(id => {
        const campaign = campaigns.find(c => c.id === id);// new camp  id chai excisiting c id sanga comp 
        if (!campaign) return null;
        return {
          ...campaign,
          similarityScore: campaignWithScores.similarityScores?.[id]?.score || 0,
          similarityDetails: campaignWithScores.similarityScores?.[id]?.details
        };
      })
      .filter((c): c is CampaignWithSimilarity => c !== null); //if chaina vane kei return grdaina
  }

  static calculateSimilarityScores(campaign: Campaign, allCampaigns: Campaign[]): CampaignWithSimilarity {
    const similarityScores: { [key: number]: SimilarityScore } = {};//  score lai store grna object banako

    // Calculate similarity with all other campaigns
    allCampaigns.forEach(otherCampaign => {
      if (campaign.id === otherCampaign.id) return;

      const details = {
        target: this.calculateTargetSimilarity(campaign, otherCampaign),
        deadline: this.calculateDeadlineSimilarity(campaign, otherCampaign),
        category: this.calculateCategorySimilarity(campaign, otherCampaign)
      };

      // Weighted similarity calculation
      const score = (
        details.target * 0.4 +
        details.deadline * 0.3 +
        details.category * 0.3
      );
// similar campaign lai eyta group ma
      similarityScores[otherCampaign.id] = {
        score,
        details
      };
    });

    // Sort campaigns by similarity score
    const topSimilar = Object.entries(similarityScores)
      .sort(([, a], [, b]) => b.score - a.score)
      .map(([id]) => parseInt(id));
// campaigns sanga compare gareko kun sanga najik cha tesko id ra latest campaign id chai match gareko
    return {
      ...campaign,
      similarityScores,
      topSimilar
    };
  }

  private static calculateTargetSimilarity(campaign1: Campaign, campaign2: Campaign): number {
    const target1 = parseFloat(campaign1.target);
    const target2 = parseFloat(campaign2.target);
    const maxTarget = Math.max(target1, target2);
    const difference = Math.abs(target1 - target2);
    return 1 - (difference / maxTarget);
  }

  private static calculateDeadlineSimilarity(campaign1: Campaign, campaign2: Campaign): number {
    const maxTimeframe = 30 * 24 * 60 * 60; // 30 days in seconds
    const difference = Math.abs(campaign1.deadline - campaign2.deadline);
    return 1 - Math.min(difference / maxTimeframe, 1);
  }

  private static calculateCategorySimilarity(campaign1: Campaign, campaign2: Campaign): number {
    // Using title and description for category similarity
    const words1 = (campaign1.title + " " + campaign1.description).toLowerCase().split(/\s+/);
    const words2 = (campaign2.title + " " + campaign2.description).toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  static explainSimilarity(campaign1: Campaign, campaign2: Campaign): string {
    const details = {
      target: this.calculateTargetSimilarity(campaign1, campaign2),
      deadline: this.calculateDeadlineSimilarity(campaign1, campaign2),
      category: this.calculateCategorySimilarity(campaign1, campaign2)
    };

    return `
      These campaigns are similar because:
      ${details.target > 0.8 ? '- They have very similar target amounts\n' : ''}
      ${details.deadline > 0.8 ? '- Their deadlines are close to each other\n' : ''}
      ${details.category > 0.8 ? '- They belong to similar categories\n' : ''}
      
      Similarity Breakdown:
      - Target Amount Match: ${(details.target * 100).toFixed(1)}%
      - Deadline Match: ${(details.deadline * 100).toFixed(1)}%
      - Category Match: ${(details.category * 100).toFixed(1)}%
    `;
  }
}
