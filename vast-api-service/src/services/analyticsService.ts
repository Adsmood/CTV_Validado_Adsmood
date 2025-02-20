import { prisma } from './prisma';
import type { Analytics } from '../types/index.js';

class AnalyticsService {
  async trackEvent(campaignId: string, eventType: Analytics['eventType'], metadata?: Record<string, any>): Promise<Analytics> {
    try {
      // Verificar que la campaña existe
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campaña no encontrada: ${campaignId}`);
      }

      // Registrar el evento
      const event = await prisma.analytics.create({
        data: {
          campaignId,
          eventType: eventType as Analytics['eventType'],
          metadata: metadata || {},
          timestamp: new Date()
        }
      });

      return event as Analytics;
    } catch (error) {
      console.error('Error al registrar evento:', error);
      throw error;
    }
  }

  async getCampaignStats(campaignId: string): Promise<{
    impressions: number;
    starts: number;
    completes: number;
    clicks: number;
    skips: number;
    completionRate: number;
  }> {
    try {
      const analytics = await prisma.analytics.groupBy({
        by: ['eventType'],
        where: {
          campaignId,
        },
        _count: {
          eventType: true
        }
      });

      const stats = analytics.reduce((acc: Record<string, number>, curr: { eventType: string; _count: { eventType: number } }) => {
        acc[curr.eventType] = curr._count.eventType;
        return acc;
      }, {} as Record<string, number>);

      const impressions = stats['impression'] || 0;
      const starts = stats['start'] || 0;
      const completes = stats['complete'] || 0;
      const clicks = stats['click'] || 0;
      const skips = stats['skip'] || 0;

      return {
        impressions,
        starts,
        completes,
        clicks,
        skips,
        completionRate: starts > 0 ? (completes / starts) * 100 : 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  async getTimelineStats(campaignId: string, startDate: Date, endDate: Date): Promise<{
    date: string;
    impressions: number;
    completes: number;
  }[]> {
    try {
      const analytics = await prisma.analytics.groupBy({
        by: ['timestamp', 'eventType'],
        where: {
          campaignId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          eventType: true
        }
      });

      const timelineMap = new Map<string, { impressions: number; completes: number }>();

      analytics.forEach((record: { timestamp: Date; eventType: string; _count: { eventType: number } }) => {
        const date = record.timestamp.toISOString().split('T')[0];
        const current = timelineMap.get(date) || { impressions: 0, completes: 0 };

        if (record.eventType === 'impression') {
          current.impressions = record._count.eventType;
        } else if (record.eventType === 'complete') {
          current.completes = record._count.eventType;
        }

        timelineMap.set(date, current);
      });

      return Array.from(timelineMap.entries()).map(([date, stats]) => ({
        date,
        ...stats
      }));
    } catch (error) {
      console.error('Error al obtener estadísticas de línea de tiempo:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService(); 