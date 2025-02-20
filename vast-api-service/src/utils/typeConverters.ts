import type { Project, Campaign, Analytics, VastConfig } from '../types/index.js';
import { Prisma } from '@prisma/client';

export function convertPrismaProject(project: any): Project {
  return {
    ...project,
    description: project.description || undefined,
    campaigns: project.campaigns.map(convertPrismaCampaign)
  };
}

export function convertPrismaCampaign(campaign: any): Campaign {
  return {
    ...campaign,
    startDate: campaign.startDate || undefined,
    endDate: campaign.endDate || undefined,
    vastConfig: campaign.vastConfig as VastConfig,
    analytics: campaign.analytics?.map(convertPrismaAnalytics) || []
  };
}

export function convertPrismaAnalytics(analytics: any): Analytics {
  return {
    ...analytics,
    metadata: analytics.metadata || undefined
  };
} 