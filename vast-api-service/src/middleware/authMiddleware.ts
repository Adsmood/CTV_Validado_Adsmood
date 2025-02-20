import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authInfo = authService.getAuthInfo(req);

  if (!authInfo.isAuthenticated) {
    return res.status(401).json({
      error: 'No autorizado',
      details: 'Se requiere autenticación válida'
    });
  }

  // Agregar información de autenticación a la request para uso posterior
  req.auth = authInfo;
  next();
};

// Middleware específico para rutas públicas (sin autenticación)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authInfo = authService.getAuthInfo(req);
  req.auth = authInfo;
  next();
};

// Middleware para rate limiting de rutas públicas
export const rateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutos por defecto
  maxRequests: number = 100 // 100 requests por ventana por defecto
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Limpiar entradas expiradas
    if (requests.has(clientIp)) {
      const request = requests.get(clientIp)!;
      if (now > request.resetTime) {
        requests.delete(clientIp);
      }
    }

    // Inicializar o actualizar contador
    if (!requests.has(clientIp)) {
      requests.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      const request = requests.get(clientIp)!;
      if (request.count >= maxRequests) {
        return res.status(429).json({
          error: 'Demasiadas solicitudes',
          details: `Por favor, intente nuevamente después de ${new Date(request.resetTime).toLocaleTimeString()}`
        });
      }
      request.count++;
    }

    next();
  };
};

// Middleware para validación de tokens VAST
export const validateVastToken = (req: Request, res: Response, next: NextFunction) => {
  const vastToken = req.query.vastToken as string;
  
  if (!vastToken) {
    return res.status(400).json({
      error: 'Token VAST requerido',
      details: 'Se requiere un token VAST válido para acceder al recurso'
    });
  }

  try {
    // Validar formato del token (ejemplo: timestamp_campaignId_hash)
    const [timestamp, campaignId, hash] = vastToken.split('_');
    const now = Date.now();
    const tokenTime = parseInt(timestamp);

    // Validar que el token no haya expirado (24 horas)
    if (now - tokenTime > 24 * 60 * 60 * 1000) {
      return res.status(401).json({
        error: 'Token VAST expirado',
        details: 'El token VAST ha expirado, por favor solicite uno nuevo'
      });
    }

    // Agregar información del token a la request
    req.vastToken = {
      timestamp: tokenTime,
      campaignId,
      hash
    };

    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Token VAST inválido',
      details: 'El formato del token VAST es inválido'
    });
  }
}; 