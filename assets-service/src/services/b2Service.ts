import B2 from 'backblaze-b2';
import { config } from '../config.js';

class B2Service {
  private b2: B2;
  private uploadUrl: string | null = null;
  private uploadAuthToken: string | null = null;

  constructor() {
    this.b2 = new B2({
      applicationKeyId: config.b2.keyId,
      applicationKey: config.b2.key,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.b2.authorize();
      
      // Configurar el bucket con las reglas CORS
      try {
        await this.b2.updateBucket({
          bucketId: config.b2.bucketId,
          bucketType: 'allPublic',
          corsRules: [
            {
              allowedOrigins: ["*"],
              allowedHeaders: ["*"],
              allowedOperations: [
                "b2_download_file_by_id",
                "b2_download_file_by_name"
              ],
              exposeHeaders: ["x-bz-content-sha1"],
              maxAgeSeconds: 3600
            }
          ],
          lifecycleRules: []
        });
        console.log('Bucket configuration updated successfully');
      } catch (bucketError) {
        console.error('Error updating bucket configuration:', bucketError);
      }

      const response = await this.b2.getUploadUrl({
        bucketId: config.b2.bucketId,
      });
      this.uploadUrl = response.data.uploadUrl;
      this.uploadAuthToken = response.data.authorizationToken;
    } catch (error) {
      console.error('Error initializing B2:', error);
      throw new Error('Failed to initialize B2');
    }
  }

  async validateUploadedFile(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const contentType = response.headers.get('content-type');
      return response.ok && (contentType?.includes('video') || contentType?.includes('mp4') || false);
    } catch (error) {
      console.error('Error validating file:', error);
      return false;
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      if (!this.uploadUrl || !this.uploadAuthToken) {
        await this.initialize();
      }

      const response = await this.b2.uploadFile({
        uploadUrl: this.uploadUrl!,
        uploadAuthToken: this.uploadAuthToken!,
        fileName,
        data: buffer,
        contentType,
        info: {
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=31536000'
        }
      });

      const fileUrl = `${config.b2.fileUrl}/${response.data.fileName}`;
      
      // Esperar un momento para que el archivo esté disponible
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validar que el archivo se subió correctamente
      const isValid = await this.validateUploadedFile(fileUrl);
      if (!isValid) {
        console.error('File validation failed:', fileUrl);
        throw new Error('File upload validation failed');
      }

      console.log('File uploaded successfully:', fileUrl);
      return fileUrl;
    } catch (error: unknown) {
      console.error('Error uploading file to B2:', error);
      if (error instanceof Error && 
          (error.message?.includes('expired') || error.message?.includes('unauthorized'))) {
        await this.initialize();
        return this.uploadFile(buffer, fileName, contentType);
      }
      throw new Error('Failed to upload file to B2');
    }
  }

  async getFileInfo(fileName: string): Promise<any> {
    try {
      const response = await this.b2.getFileInfo({
        fileId: fileName
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file info');
    }
  }
}

export const b2Service = new B2Service(); 