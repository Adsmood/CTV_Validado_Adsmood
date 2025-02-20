import { Request, Response } from 'express';
import { config } from '../config.js';
import { cacheService } from '../services/cacheService.js';
import { logger } from '../services/loggerService.js';

interface VastParams {
  adId: string;
  clickUrl?: string;
  errorUrl?: string;
  impressionUrl?: string;
  timestamp?: string;
  cacheBuster?: string;
}

interface IASConfig {
  anId: string;
  campId: string;
  pubId?: string;
  placementId?: string;
  custom?: string;
}

const generateIASVerification = (params: IASConfig) => {
  const iasParams = new URLSearchParams({
    anId: params.anId,
    campId: params.campId,
    pubId: params.pubId || '',
    placementId: params.placementId || '',
    custom: params.custom || ''
  }).toString();

  return `
    <Extension type="AdVerifications">
      <VerificationParameters>
        <![CDATA[
          {
            "context": "ctv",
            "verificationParameters": "${iasParams}",
            "trackingEvents": {
              "viewable": "[VIEWABLE_IMPRESSION]",
              "notViewable": "[NOT_VIEWABLE_IMPRESSION]",
              "viewUndetermined": "[VIEWABILITY_UNDETERMINED]"
            },
            "brandSafetyParameters": {
              "ias_dspid": "68",
              "ias_placement": "${params.placementId || params.campId}",
              "ias_mode": 1
            }
          }
        ]]>
      </VerificationParameters>
      <TrackingEvents>
        <Tracking event="verificationNotExecuted">
          <![CDATA[https://pixel.adsafeprotected.com/mon?anId=${params.anId}&campId=${params.campId}&ias_errorCode=[REASON]]]>
        </Tracking>
      </TrackingEvents>
      <JavaScriptResource>
        <![CDATA[https://pixel.adsafeprotected.com/jload?${iasParams}]]>
      </JavaScriptResource>
    </Extension>`;
};

export const generateDynamicVast = async (req: Request, res: Response) => {
  try {
    const adId = req.params.adId;
    if (!adId) {
      throw new Error('adId es requerido');
    }

    // Validar y convertir query params
    const queryParams = {
      clickUrl: String(req.query.clickUrl || '[CLICK_URL_ENC]'),
      errorUrl: String(req.query.errorUrl || '[ERROR_URL]'),
      impressionUrl: String(req.query.impressionUrl || '[IMPRESSION_URL]'),
      timestamp: String(req.query.timestamp || '[TIMESTAMP]'),
      cacheBuster: String(req.query.cacheBuster || '[CACHEBUSTER]')
    };

    // Generar clave de caché
    const cacheKey = cacheService.generateVastKey(adId, queryParams);
    
    // Verificar si existe en caché
    const cachedVast = cacheService.get(cacheKey);
    if (cachedVast) {
      await logger.vastRequest(adId, queryParams, true);
      console.log('VAST encontrado en caché:', cacheKey);
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.header('X-Cache', 'HIT');
      res.send(cachedVast);
      return;
    }

    await logger.vastRequest(adId, queryParams, false);

    // Configuración IAS
    const iasVerification = generateIASVerification({
      anId: adId,
      campId: queryParams.timestamp,
      placementId: `adsmood_${adId}`,
      pubId: 'adsmood',
      custom: 'ctv_vast'
    });

    // TODO: En el futuro, obtener estos datos de la base de datos
    const videoUrl = `${config.b2.fileUrl}/${adId}.mp4`;

    const vastXml = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="${queryParams.timestamp}">
    <InLine>
      <AdSystem version="2.0">Adsmood CTV Interactive</AdSystem>
      <AdTitle>Adsmood ${adId}</AdTitle>
      <Error><![CDATA[${queryParams.errorUrl}]]></Error>
      <Impression><![CDATA[${queryParams.impressionUrl}&cb=${queryParams.cacheBuster}]]></Impression>
      <ViewableImpression>
        <Viewable><![CDATA[[VIEWABLE_IMPRESSION]]]></Viewable>
        <NotViewable><![CDATA[[NOT_VIEWABLE_IMPRESSION]]]></NotViewable>
        <ViewUndetermined><![CDATA[[VIEWABILITY_UNDETERMINED]]]></ViewUndetermined>
      </ViewableImpression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <VideoClicks>
              <ClickThrough><![CDATA[${queryParams.clickUrl}]]></ClickThrough>
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
            <TrackingEvents>
              <Tracking event="start"><![CDATA[[START]]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[[FIRST_QUARTILE]]]></Tracking>
              <Tracking event="midpoint"><![CDATA[[MIDPOINT]]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[[THIRD_QUARTILE]]]></Tracking>
              <Tracking event="complete"><![CDATA[[COMPLETE]]]></Tracking>
              <Tracking event="mute"><![CDATA[[MUTE]]]></Tracking>
              <Tracking event="unmute"><![CDATA[[UNMUTE]]]></Tracking>
              <Tracking event="pause"><![CDATA[[PAUSE]]]></Tracking>
              <Tracking event="resume"><![CDATA[[RESUME]]]></Tracking>
              <Tracking event="skip"><![CDATA[[SKIP]]]></Tracking>
            </TrackingEvents>
          </Linear>
        </Creative>
      </Creatives>
      <Extensions>
        ${iasVerification}
        <Extension type="AdServingData">
          <AppBundle>com.adsmood.ctv</AppBundle>
          <AdServingVersion>1.0</AdServingVersion>
        </Extension>
      </Extensions>
    </InLine>
  </Ad>
</VAST>`;

    // Guardar en caché
    cacheService.set(cacheKey, vastXml);
    await logger.info('VAST guardado en caché', { cacheKey, adId });

    // Configurar headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.header('X-Cache', 'MISS');
    res.header('ETag', `"${adId}-${queryParams.timestamp}"`);
    res.header('Last-Modified', new Date().toUTCString());

    res.send(vastXml);

  } catch (error) {
    await logger.vastError(req.params.adId || 'unknown', error);
    console.error('Error generando VAST dinámico:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error generando VAST',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 