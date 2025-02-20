import { Request } from 'express';
import crypto from 'crypto';

class AuthService {
  private readonly API_KEYS: Map<string, string> = new Map();
  private readonly ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  private readonly ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adsmood2024';

  constructor() {
    // Generar API key inicial para el admin
    const initialApiKey = this.generateApiKey();
    this.API_KEYS.set('admin', initialApiKey);
    console.log('API Key inicial generada:', initialApiKey);
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(apiKey: string): boolean {
    return Array.from(this.API_KEYS.values()).includes(apiKey);
  }

  validateBasicAuth(authHeader: string): boolean {
    try {
      // Extraer credenciales del header Basic Auth
      const encoded = authHeader.split(' ')[1];
      const decoded = Buffer.from(encoded, 'base64').toString();
      const [username, password] = decoded.split(':');

      return username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD;
    } catch {
      return false;
    }
  }

  getAuthInfo(req: Request): { isAuthenticated: boolean; authMethod?: string } {
    // Verificar API Key
    const apiKey = req.header('X-API-Key');
    if (apiKey && this.validateApiKey(apiKey)) {
      return { isAuthenticated: true, authMethod: 'apiKey' };
    }

    // Verificar Basic Auth
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Basic ') && this.validateBasicAuth(authHeader)) {
      return { isAuthenticated: true, authMethod: 'basicAuth' };
    }

    return { isAuthenticated: false };
  }

  generateNewApiKey(username: string): string {
    const newApiKey = this.generateApiKey();
    this.API_KEYS.set(username, newApiKey);
    return newApiKey;
  }

  revokeApiKey(username: string): boolean {
    return this.API_KEYS.delete(username);
  }
}

export const authService = new AuthService(); 