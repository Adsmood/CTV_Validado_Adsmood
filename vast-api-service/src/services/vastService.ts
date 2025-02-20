import type { Campaign, VastConfig } from '../types/index.js';

class VastService {
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  private generateVerificationSection(vendors?: VastConfig['verificationVendors']): string {
    if (!vendors?.length) return '';

    return vendors.map((vendor) => `
      <Extension type="AdVerifications">
        <VerificationParameters>
          <![CDATA[${vendor.verificationParameters}]]>
        </VerificationParameters>
        ${Object.entries(vendor.trackingEvents).map(([event, urls]) => 
          (urls || []).map((url) => `<Tracking event="${event}"><![CDATA[${url}]]></Tracking>`).join('\n')
        ).join('\n')}
      </Extension>
    `).join('\n');
  }

  private generateInteractiveSection(elements?: VastConfig['interactiveElements']): string {
    if (!elements?.length) return '';

    return `
      <CreativeExtensions>
        <CreativeExtension type="InteractiveCreativeFile">
          <![CDATA[${JSON.stringify({
            version: "1.0",
            elements: elements.map((el) => ({
              type: el.type,
              position: el.position,
              size: el.size,
              content: el.content,
              clickThroughUrl: el.clickThroughUrl
            }))
          })}]]>
        </CreativeExtension>
      </CreativeExtensions>
    `;
  }

  private generateTrackingEvents(events: VastConfig['trackingEvents']): string {
    if (!events) return '';
    
    return Object.entries(events)
      .filter(([_, urls]) => urls && urls.length > 0)
      .map(([event, urls]) => 
        (urls || []).map(url => `<Tracking event="${event}"><![CDATA[${url}]]></Tracking>`).join('\n')
      ).join('\n');
  }

  private generateMediaFiles(files: VastConfig['mediaFiles']): string {
    return files.map((file: VastConfig['mediaFiles'][0]) => `
      <MediaFile 
        delivery="${file.delivery}" 
        type="${file.type}" 
        width="${file.width}" 
        height="${file.height}" 
        bitrate="${file.bitrate}"
        ${file.codec ? `codec="${file.codec}"` : ''}
        maintainAspectRatio="true">
        <![CDATA[${file.url}]]>
      </MediaFile>
    `).join('\n');
  }

  generateVastXml(campaign: Campaign): string {
    const { vastConfig } = campaign;
    const vastXml = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${vastConfig.version}">
  <Ad id="${campaign.id}">
    <InLine>
      <AdSystem version="1.0">Adsmood CTV</AdSystem>
      <AdTitle>${vastConfig.adTitle}</AdTitle>
      ${vastConfig.description ? `<Description>${vastConfig.description}</Description>` : ''}
      ${vastConfig.impressionUrls.map(url => `<Impression><![CDATA[${url}]]></Impression>`).join('\n')}
      <Creatives>
        <Creative>
          <Linear ${vastConfig.skipOffset ? `skipoffset="${vastConfig.skipOffset}"` : ''}>
            <Duration>${this.formatDuration(vastConfig.duration)}</Duration>
            <TrackingEvents>
              ${this.generateTrackingEvents(vastConfig.trackingEvents)}
            </TrackingEvents>
            ${vastConfig.clickThroughUrl ? `
            <VideoClicks>
              <ClickThrough><![CDATA[${vastConfig.clickThroughUrl}]]></ClickThrough>
            </VideoClicks>
            ` : ''}
            <MediaFiles>
              ${this.generateMediaFiles(vastConfig.mediaFiles)}
            </MediaFiles>
          </Linear>
          ${this.generateInteractiveSection(vastConfig.interactiveElements)}
        </Creative>
      </Creatives>
      <Extensions>
        ${this.generateVerificationSection(vastConfig.verificationVendors)}
        <Extension type="AdServingData">
          <AppBundle>com.adsmood.ctv</AppBundle>
          <AdServingVersion>1.0</AdServingVersion>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;

    return vastXml;
  }

  validateVastConfig(config: VastConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!config.mediaFiles || config.mediaFiles.length === 0) {
      errors.push('MediaFile: El archivo de video es demasiado pequeño');
      isValid = false;
    }

    if (config.interactiveElements) {
      config.interactiveElements.forEach((element) => {
        if (!element.type) {
          errors.push(`Elemento interactivo: Tipo es requerido`);
          isValid = false;
        }
        if (!element.position || typeof element.position.x !== 'number' || typeof element.position.y !== 'number') {
          errors.push(`Elemento interactivo: Posición inválida`);
          isValid = false;
        }
      });
    }

    return { isValid, errors };
  }
}

export const vastService = new VastService(); 