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
      
      // La configuración CORS se maneja desde la interfaz web de B2
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
      
      if (!response.ok) {
        console.error('Error al validar archivo:', response.status);
        return false;
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      console.log('Validación de archivo:', {
        url,
        contentType,
        contentLength
      });

      // Validar por tipo de contenido
      if (contentType?.includes('video/')) {
        // Para videos, verificar tamaño mínimo
        return parseInt(contentLength || '0') >= 1000000; // 1MB
      } else if (contentType?.includes('image/')) {
        // Para imágenes, verificar que no estén vacías
        return parseInt(contentLength || '0') >= 1024; // 1KB
      }

      return false;
    } catch (error) {
      console.error('Error validando archivo:', error);
      return false;
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      console.log('Iniciando subida de archivo:', {
        fileName,
        contentType,
        bufferSize: buffer.length,
      });

      if (!this.uploadUrl || !this.uploadAuthToken) {
        console.log('No hay URL de subida o token, inicializando...');
        await this.initialize();
      }

      if (buffer.length === 0) {
        throw new Error('Buffer vacío');
      }

      // Validar tamaño mínimo según tipo de archivo
      if (contentType.startsWith('video/') && buffer.length < 1000000) {
        throw new Error('Los archivos de video deben ser al menos 1MB');
      }

      if (contentType.startsWith('image/') && buffer.length < 1024) {
        throw new Error('Las imágenes deben ser al menos 1KB');
      }

      console.log('Subiendo archivo a B2...');
      const response = await this.b2.uploadFile({
        uploadUrl: this.uploadUrl!,
        uploadAuthToken: this.uploadAuthToken!,
        fileName,
        data: buffer,
        contentType
      });

      console.log('Respuesta de B2:', {
        fileId: response.data.fileId,
        fileName: response.data.fileName,
        size: buffer.length
      });

      const fileUrl = `${config.b2.fileUrl}/${response.data.fileName}`;
      
      // Esperar un momento para que el archivo esté disponible
      console.log('Esperando a que el archivo esté disponible...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Validar que el archivo se subió correctamente
      console.log('Validando archivo subido...');
      const isValid = await this.validateUploadedFile(fileUrl);
      if (!isValid) {
        console.error('File validation failed:', fileUrl);
        throw new Error('File upload validation failed');
      }

      console.log('Archivo subido y validado exitosamente:', fileUrl);
      return fileUrl;
    } catch (error: unknown) {
      console.error('Error detallado al subir archivo a B2:', {
        error,
        fileName,
        contentType,
        bufferSize: buffer.length
      });
      
      if (error instanceof Error && 
          (error.message?.includes('expired') || error.message?.includes('unauthorized'))) {
        console.log('Token expirado o no autorizado, reintentando...');
        await this.initialize();
        return this.uploadFile(buffer, fileName, contentType);
      }
      throw new Error('Failed to upload file to B2');
    }
  }
}

export const b2Service = new B2Service(); 