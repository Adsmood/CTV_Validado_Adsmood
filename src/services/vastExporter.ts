import type { EditorState, Element, ElementType } from '../stores/editorStore';

interface VideoFormat {
  url: string;
  codec: 'H.264' | 'H.265';
  bitrate: number;
  width: number;
  height: number;
  delivery: 'progressive' | 'streaming';
}

interface VastOptions {
  baseUrl: string;
  impressionUrl: string;
  clickTrackingUrl: string;
  startTrackingUrl: string;
  completeTrackingUrl: string;
  skipTrackingUrl: string;
  interactionTrackingUrl: string;
  viewableImpressionUrl: string;
  doubleVerifyUrl?: string;
  quartileTrackingUrls: {
    firstQuartile: string;
    midpoint: string;
    thirdQuartile: string;
  };
  videoFormats: VideoFormat[];
  fallbackVideoUrl: string;
  platform?: 'roku' | 'fireTV' | 'appleTV' | 'androidTV' | 'other';
}

interface InteractiveElement {
  id: string;
  type: ElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  actions: {
    onClick?: string;
    onHover?: string;
    onFocus?: string;
    onKeyDown?: string;
    onKeyUp?: string;
  };
  tracking: {
    impressionUrl?: string;
    interactionUrl?: string;
  };
  remoteControl?: {
    focusable: boolean;
    focusOrder: number;
    navigationRules?: {
      up?: string;
      down?: string;
      left?: string;
      right?: string;
    };
  };
}

const generateInteractiveWrapper = (
  elements: InteractiveElement[], 
  background: any, 
  timeline: any,
  vastOptions: VastOptions,
  platform?: string
) => {
  return {
    version: "1.0",
    type: "CTV-Interactive",
    platform,
    layout: {
      aspectRatio: "16:9",
      videoPosition: {
        left: "20px",
        width: "60%"
      },
      safeZones: {
        title: { top: "5%", height: "15%" },
        action: { bottom: "10%", height: "20%" }
      }
    },
    elements,
    background,
    timeline,
    tracking: {
      enabled: true,
      events: ["impression", "interaction", "completion", "quartiles"]
    },
    remoteControl: {
      enabled: true,
      initialFocus: elements.find(el => el.remoteControl?.focusable)?.id,
      navigationMode: "grid"
    },
    fallback: {
      enabled: true,
      videoUrl: `${vastOptions.baseUrl}${vastOptions.fallbackVideoUrl}`
    }
  };
};

export const generateVastXml = (state: Pick<EditorState, 'elements' | 'background' | 'timeline'>, options: VastOptions): string => {
  const { elements, background, timeline } = state;
  
  // Transform elements to include tracking and CTV-specific properties
  const interactiveElements = elements.map((el: Element): InteractiveElement => ({
    ...el,
    actions: {
      onClick: `${options.baseUrl}/track/click/${el.id}`,
      onHover: `${options.baseUrl}/track/hover/${el.id}`,
      onFocus: `${options.baseUrl}/track/focus/${el.id}`,
      onKeyDown: `${options.baseUrl}/track/keydown/${el.id}`,
      onKeyUp: `${options.baseUrl}/track/keyup/${el.id}`
    },
    tracking: {
      impressionUrl: `${options.baseUrl}/track/impression/${el.id}`,
      interactionUrl: `${options.baseUrl}/track/interaction/${el.id}`
    },
    remoteControl: {
      focusable: true,
      focusOrder: elements.indexOf(el),
      navigationRules: {
        up: elements.find((other: Element) => 
          other.id !== el.id && 
          other.position.y < el.position.y && 
          Math.abs(other.position.x - el.position.x) < 100
        )?.id,
        down: elements.find((other: Element) => 
          other.id !== el.id && 
          other.position.y > el.position.y && 
          Math.abs(other.position.x - el.position.x) < 100
        )?.id,
        left: elements.find((other: Element) => 
          other.id !== el.id && 
          other.position.x < el.position.x && 
          Math.abs(other.position.y - el.position.y) < 100
        )?.id,
        right: elements.find((other: Element) => 
          other.id !== el.id && 
          other.position.x > el.position.x && 
          Math.abs(other.position.y - el.position.y) < 100
        )?.id
      }
    }
  }));

  // Función para formatear la duración en formato HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const interactiveCreativeData = generateInteractiveWrapper(
    interactiveElements,
    background ? {
      ...background,
      url: `${options.baseUrl}${background.url}`
    } : null,
    timeline,
    options,
    options.platform
  );

  const vast = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="adsmood-${Date.now()}">
    <InLine>
      <AdSystem version="2.0">Adsmood CTV Interactive</AdSystem>
      <AdTitle>Interactive CTV Ad</AdTitle>
      <Description>Interactive CTV Advertisement with Enhanced Tracking</Description>
      <Error><![CDATA[${options.baseUrl}/error]]></Error>
      <Impression><![CDATA[${options.impressionUrl}]]></Impression>
      <ViewableImpression>
        <Viewable><![CDATA[${options.viewableImpressionUrl}]]></Viewable>
      </ViewableImpression>
      <Category authority="IAB">Interactive</Category>
      <Creatives>
        <Creative>
          <UniversalAdId idRegistry="Adsmood">adsmood-${Date.now()}</UniversalAdId>
          <Linear>
            <Duration>${formatDuration(Math.floor(timeline.duration))}</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[${options.startTrackingUrl}]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[${options.quartileTrackingUrls.firstQuartile}]]></Tracking>
              <Tracking event="midpoint"><![CDATA[${options.quartileTrackingUrls.midpoint}]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[${options.quartileTrackingUrls.thirdQuartile}]]></Tracking>
              <Tracking event="complete"><![CDATA[${options.completeTrackingUrl}]]></Tracking>
              <Tracking event="skip"><![CDATA[${options.skipTrackingUrl}]]></Tracking>
              <Tracking event="otherAdInteraction"><![CDATA[${options.interactionTrackingUrl}]]></Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickTracking><![CDATA[${options.clickTrackingUrl}]]></ClickTracking>
            </VideoClicks>
            <MediaFiles>
              ${options.videoFormats.map(format => `
              <MediaFile 
                delivery="${format.delivery}" 
                type="video/${format.codec === 'H.264' ? 'mp4' : 'hevc'}" 
                width="${format.width}" 
                height="${format.height}" 
                bitrate="${format.bitrate}"
                codec="${format.codec}"
                maintainAspectRatio="true">
                <![CDATA[${options.baseUrl}${format.url}]]>
              </MediaFile>
              `).join('')}
              <MediaFile delivery="progressive" type="video/mp4" width="1920" height="1080" maintainAspectRatio="true">
                <![CDATA[${options.baseUrl}${options.fallbackVideoUrl}]]>
              </MediaFile>
            </MediaFiles>
            <AdParameters><![CDATA[${JSON.stringify(interactiveCreativeData)}]]></AdParameters>
          </Linear>
          <CreativeExtensions>
            <CreativeExtension type="AdsmoodInteractive">
              <InteractiveCreativeData>
                <![CDATA[${JSON.stringify(interactiveCreativeData)}]]>
              </InteractiveCreativeData>
            </CreativeExtension>
          </CreativeExtensions>
        </Creative>
      </Creatives>
      <Extensions>
        <Extension type="AdVerification">
          <VerificationParameters>
            <![CDATA[${JSON.stringify({
              trackingUrls: {
                impression: options.impressionUrl,
                complete: options.completeTrackingUrl,
                interaction: options.interactionTrackingUrl
              },
              doubleVerify: options.doubleVerifyUrl,
              platform: options.platform
            })}]]>
          </VerificationParameters>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;

  return vast;
};

export const validateVastXml = (xml: string): { isValid: boolean; errors: string[] } => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parserErrors = Array.from(doc.getElementsByTagName('parsererror'));
    
    const errors: string[] = [];
    
    // Check for parser errors
    if (parserErrors.length > 0) {
      errors.push(...parserErrors.map(error => error.textContent || 'XML parsing error'));
    }
    
    // Validate required VAST elements
    const requiredElements = ['VAST', 'Ad', 'InLine', 'AdSystem', 'AdTitle', 'Impression', 'Creatives'];
    requiredElements.forEach(element => {
      if (!doc.getElementsByTagName(element).length) {
        errors.push(`Missing required element: ${element}`);
      }
    });
    
    // Validate Interactive Creative File
    const interactiveCreative = doc.getElementsByTagName('InteractiveCreativeFile')[0];
    if (interactiveCreative) {
      try {
        const content = JSON.parse(interactiveCreative.textContent || '');
        if (!content.version || !content.type || !content.elements) {
          errors.push('Invalid Interactive Creative File structure');
        }
      } catch (e) {
        errors.push('Invalid JSON in Interactive Creative File');
      }
    } else {
      errors.push('Missing Interactive Creative File');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating VAST XML:', error);
    return {
      isValid: false,
      errors: [(error as Error).message]
    };
  }
};

export const downloadVastXml = (xml: string, projectName: string = 'ad'): void => {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adsmood-vast-${projectName}-${Date.now()}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 