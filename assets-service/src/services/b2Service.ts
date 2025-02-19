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

  async initialize() {
    try {
      await this.b2.authorize();
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

  async uploadFile(buffer: Buffer, fileName: string, contentType: string) {
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
      });

      return `${config.b2.fileUrl}/${response.data.fileName}`;
    } catch (error) {
      console.error('Error uploading file to B2:', error);
      // Si el error es por token expirado, intentamos reinicializar
      if (error.message?.includes('expired') || error.message?.includes('unauthorized')) {
        await this.initialize();
        return this.uploadFile(buffer, fileName, contentType);
      }
      throw new Error('Failed to upload file to B2');
    }
  }
}

export const b2Service = new B2Service(); 