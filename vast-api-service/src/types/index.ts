export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  campaigns: Campaign[];
}

export interface Campaign {
  id: string;
  projectId: string;
  name: string;
  videoUrl: string;
  vastConfig: VastConfig;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  analytics: Analytics[];
}

export interface Analytics {
  id: string;
  campaignId: string;
  eventType: 'impression' | 'start' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'complete' | 'click' | 'skip';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface VastConfig {
  version: '2.0' | '3.0' | '4.0' | '4.1' | '4.2';
  adTitle: string;
  description?: string;
  duration: number;
  skipOffset?: number;
  clickThroughUrl?: string;
  impressionUrls: string[];
  trackingEvents: {
    start?: string[];
    firstQuartile?: string[];
    midpoint?: string[];
    thirdQuartile?: string[];
    complete?: string[];
    click?: string[];
    skip?: string[];
  };
  mediaFiles: {
    url: string;
    type: string;
    bitrate: number;
    width: number;
    height: number;
    delivery: 'progressive' | 'streaming';
    codec?: string;
  }[];
  interactiveElements?: {
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    content: any;
    clickThroughUrl?: string;
  }[];
  verificationVendors?: {
    vendor: string;
    verificationParameters: string;
    trackingEvents: Record<string, string[]>;
  }[];
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface SuccessResponse<T> {
  data: T;
  message?: string;
} 