import { create } from 'xmlbuilder2';
import { AdConfig, InteractiveElement } from '../types/vast';
import { config } from '../config';

export class VastGenerator {
  private readonly version = config.vast.defaultVersion;
  private readonly trackingDomain = config.vast.trackingDomain;

  constructor(private readonly adConfig: AdConfig) {}

  private generateTrackingUrls(eventType: string, urls: string[]): string[] {
    return urls.map(url => {
      // Reemplazar macros de DV360 si existen
      let finalUrl = url;
      if (this.adConfig.dv360Macros) {
        Object.entries(this.adConfig.dv360Macros).forEach(([key, value]) => {
          finalUrl = finalUrl.replace(`[${key}]`, value);
        });
      }
      return finalUrl;
    });
  }

  private generateInteractiveElement(element: InteractiveElement) {
    const interactiveXML = {
      InteractiveCreativeFile: {
        '@type': element.type,
        '@apiFramework': 'VPAID',
        '@width': element.size.width,
        '@height': element.size.height,
        '@maintainAspectRatio': 'true',
        Timeline: {
          '@startTime': element.timeline.start,
          '@duration': element.timeline.end - element.timeline.start,
        },
        Content: {
          '@text': element.content.text,
          '@imageUrl': element.content.imageUrl,
        },
      },
    };

    if (element.content.action) {
      interactiveXML.InteractiveCreativeFile.Action = {
        '@type': element.content.action.type,
        '@url': element.content.action.url,
      };
    }

    return interactiveXML;
  }

  public generate(): string {
    const vast = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('VAST', { version: this.version })
      .ele('Ad', { id: this.adConfig.name })
      .ele('InLine')
      .ele('AdSystem').txt('Adsmood CTV').up()
      .ele('AdTitle').txt(this.adConfig.name).up()
      .ele('Description').txt(this.adConfig.description || '').up()
      .ele('Error').txt(`${this.trackingDomain}/error`).up();

    // Agregar URLs de tracking
    const impressions = vast.ele('Impressions');
    this.generateTrackingUrls('impression', this.adConfig.tracking.impressionUrls)
      .forEach(url => {
        impressions.ele('Impression').txt(url);
      });

    // Creatives
    const creatives = vast.ele('Creatives').ele('Creative');

    // Linear
    const linear = creatives.ele('Linear');
    if (this.adConfig.skipOffset) {
      linear.att('skipoffset', `${this.adConfig.skipOffset}s`);
    }

    // Duration
    linear.ele('Duration')
      .txt(`${Math.floor(this.adConfig.duration / 60)}:${this.adConfig.duration % 60}:00`);

    // TrackingEvents
    const trackingEvents = linear.ele('TrackingEvents');
    Object.entries(this.adConfig.tracking).forEach(([eventType, urls]) => {
      if (eventType !== 'impressionUrls' && eventType !== 'clickUrls') {
        this.generateTrackingUrls(eventType, urls).forEach(url => {
          trackingEvents.ele('Tracking', { event: eventType.replace('Urls', '') }).txt(url);
        });
      }
    });

    // VideoClicks
    const videoClicks = linear.ele('VideoClicks');
    this.generateTrackingUrls('click', this.adConfig.tracking.clickUrls)
      .forEach(url => {
        videoClicks.ele('ClickTracking').txt(url);
      });

    // MediaFiles
    const mediaFiles = linear.ele('MediaFiles');
    mediaFiles.ele('MediaFile', {
      delivery: 'progressive',
      type: 'video/mp4',
      width: '1920',
      height: '1080',
    }).txt(this.adConfig.videoUrl);

    // Interactive Creative
    if (this.adConfig.interactiveElements.length > 0) {
      const interactive = creatives.ele('Creative').ele('Interactive');
      this.adConfig.interactiveElements.forEach(element => {
        interactive.importDocument(this.generateInteractiveElement(element));
      });
    }

    return vast.end({ prettyPrint: true });
  }
} 