# Servicio VAST API

API para la generación dinámica de VAST XML 4.2 con soporte para anuncios interactivos en CTV.

## Características

- Generación de VAST XML 4.2
- Soporte para elementos interactivos (botones, carruseles, galerías, trivias, QR)
- Integración con DV360 (macros dinámicas)
- Tracking de eventos (impresiones, clics, cuartiles)
- Almacenamiento y gestión de proyectos y anuncios
- Validación de datos con Zod
- TypeScript para tipo seguro
- Integración con PostgreSQL mediante Prisma

## Requisitos

- Node.js >= 18.0.0
- PostgreSQL
- TypeScript

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Generar el cliente de Prisma:
```bash
npm run prisma:generate
```

4. Ejecutar las migraciones:
```bash
npm run prisma:migrate
```

## Desarrollo

```bash
npm run dev
```

## Construcción

```bash
npm run build
```

## Producción

```bash
npm start
```

## API Endpoints

### Proyectos

- `GET /api/projects` - Listar todos los proyectos
- `POST /api/projects` - Crear un nuevo proyecto
- `GET /api/projects/:id` - Obtener un proyecto específico
- `PUT /api/projects/:id` - Actualizar un proyecto
- `DELETE /api/projects/:id` - Eliminar un proyecto
- `GET /api/projects/:id/ads` - Listar anuncios de un proyecto

### VAST

- `POST /api/vast/generate` - Generar un nuevo VAST XML
- `GET /api/vast/:id` - Obtener un VAST XML específico
- `GET /api/vast/:id/tracking/:type` - Endpoint de tracking

## Ejemplo de Uso

### Generar VAST XML

```typescript
const adConfig = {
  name: "Mi Anuncio Interactivo",
  description: "Anuncio con botón interactivo",
  videoUrl: "https://example.com/video.mp4",
  duration: 30,
  skipOffset: 5,
  interactiveElements: [
    {
      id: "button1",
      type: "button",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      content: {
        text: "¡Comprar ahora!",
        action: {
          type: "link",
          url: "https://example.com/comprar"
        }
      },
      timeline: {
        start: 5,
        end: 25
      }
    }
  ],
  tracking: {
    impressionUrls: ["https://example.com/impression"],
    startUrls: ["https://example.com/start"],
    firstQuartileUrls: ["https://example.com/firstQuartile"],
    midpointUrls: ["https://example.com/midpoint"],
    thirdQuartileUrls: ["https://example.com/thirdQuartile"],
    completeUrls: ["https://example.com/complete"],
    clickUrls: ["https://example.com/click"]
  },
  dv360Macros: {
    TIMESTAMP: "1234567890",
    CACHEBUSTER: "[CACHEBUSTER]"
  }
};

fetch('http://localhost:3002/api/vast/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(adConfig)
})
.then(response => response.json())
.then(data => console.log(data));
```

## Estructura del Proyecto

```
vast-api-service/
├── src/
│   ├── config/         # Configuración
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middleware
│   ├── routes/         # Rutas
│   ├── services/       # Servicios
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades
│   └── index.ts        # Punto de entrada
├── prisma/
│   └── schema.prisma   # Esquema de la base de datos
├── __tests__/         # Tests
├── .env.example       # Ejemplo de variables de entorno
├── package.json       # Dependencias y scripts
└── tsconfig.json      # Configuración de TypeScript
```

## Licencia

ISC © Adsmood 