import { Request, Response } from 'express';
import { cacheService } from '../services/cacheService.js';
import { b2Service } from '../services/b2Service.js';

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // Obtener estadísticas de caché
    const cacheStats = cacheService.stats();
    
    // Calcular tasa de aciertos
    const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0;

    // Obtener estadísticas de memoria
    const memoryUsage = process.memoryUsage();

    const stats = {
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        keys: cacheStats.keys,
        hitRate: hitRate.toFixed(2),
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(process.uptime()) + 's',
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 