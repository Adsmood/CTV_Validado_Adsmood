import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LoggerService {
  private logDir: string;
  private errorLogPath: string;
  private accessLogPath: string;
  private vastLogPath: string;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.errorLogPath = path.join(this.logDir, 'error.log');
    this.accessLogPath = path.join(this.logDir, 'access.log');
    this.vastLogPath = path.join(this.logDir, 'vast.log');
    this.initializeLogDirectory();
  }

  private initializeLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}\n`;
  }

  private async writeLog(path: string, message: string): Promise<void> {
    try {
      await fs.promises.appendFile(path, message);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  async info(message: string, meta?: any): Promise<void> {
    const logMessage = this.formatLogMessage('INFO', message, meta);
    console.log(logMessage);
    await this.writeLog(this.accessLogPath, logMessage);
  }

  async error(message: string, error?: Error | unknown): Promise<void> {
    const meta = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;

    const logMessage = this.formatLogMessage('ERROR', message, meta);
    console.error(logMessage);
    await this.writeLog(this.errorLogPath, logMessage);
  }

  async vastRequest(adId: string, params: Record<string, any>, cacheHit: boolean): Promise<void> {
    const meta = {
      adId,
      params,
      cacheHit,
      timestamp: new Date().toISOString()
    };

    const logMessage = this.formatLogMessage('VAST_REQUEST', 
      `VAST request for adId: ${adId} (Cache: ${cacheHit ? 'HIT' : 'MISS'})`, 
      meta
    );

    await this.writeLog(this.vastLogPath, logMessage);
  }

  async vastError(adId: string, error: Error | unknown): Promise<void> {
    const meta = {
      adId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    };

    const logMessage = this.formatLogMessage('VAST_ERROR', 
      `Error generating VAST for adId: ${adId}`, 
      meta
    );

    await this.writeLog(this.vastLogPath, logMessage);
    await this.writeLog(this.errorLogPath, logMessage);
  }

  getLogStats(): Promise<{
    errorCount: number;
    vastRequestCount: number;
    vastErrorCount: number;
  }> {
    return new Promise((resolve) => {
      const stats = {
        errorCount: 0,
        vastRequestCount: 0,
        vastErrorCount: 0
      };

      // Implementar conteo de logs
      // TODO: Agregar implementación de estadísticas de logs

      resolve(stats);
    });
  }
}

export const logger = new LoggerService(); 