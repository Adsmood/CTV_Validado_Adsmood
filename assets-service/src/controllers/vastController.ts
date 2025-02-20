import { Request, Response } from 'express';
import { config } from '../config.js';

interface VastParams {
  adId: string;
  clickUrl?: string;
  errorUrl?: string;
  impressionUrl?: string;
  timestamp?: string;
  cacheBuster?: string;
}

export const generateDynamicVast = async (req: Request, res: Response) => {
  try {
    const { adId } = req.params;
    const {
      clickUrl = '[CLICK_URL_ENC]',
      errorUrl = '[ERROR_URL]',
      impressionUrl = '[IMPRESSION_URL]',
      timestamp = '[TIMESTAMP]',
      cacheBuster = '[CACHEBUSTER]'
    } = req.query as VastParams;

    // TODO: En el futuro, obtener estos datos de la base de datos
    const videoUrl = `${config.b2.fileUrl}/${adId}.mp4`;

    const vastXml = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="${timestamp}">
    <InLine>
      <AdSystem version="2.0">Adsmood CTV Interactive</AdSystem>
      <AdTitle>Adsmood ${adId}</AdTitle>
      <Error><![CDATA[${errorUrl}]]></Error>
      <Impression><![CDATA[${impressionUrl}&cb=${cacheBuster}]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <VideoClicks>
              <ClickThrough><![CDATA[${clickUrl}]]></ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile 
                delivery="progressive" 
                type="video/mp4" 
                width="1920" 
                height="1080" 
                bitrate="2000"
                codec="H.264"
                maintainAspectRatio="true">
                <![CDATA[${videoUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
      <Extensions>
        <Extension type="IAS">
          <AdVerifications>
            <Verification vendor="ias">
              <JavaScriptResource>
                <![CDATA[https://pixel.adsafeprotected.com/jload?anId=${adId}&campId=${timestamp}]]>
              </JavaScriptResource>
              <VerificationParameters>
                <![CDATA[campaign_id=${adId}&ias_dspid=68&ias_placement=${timestamp}]]>
              </VerificationParameters>
            </Verification>
          </AdVerifications>
        </Extension>
        <Extension type="AdServingData">
          <AppBundle>com.adsmood.ctv</AppBundle>
          <AdServingVersion>1.0</AdServingVersion>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    res.send(vastXml);

  } catch (error) {
    console.error('Error generando VAST dinámico:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error generando VAST',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 