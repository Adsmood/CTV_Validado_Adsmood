# Plataforma CTV Interactiva

Plataforma para la creación y gestión de anuncios interactivos para CTV (Connected TV) con soporte para DV360.

## Estructura del Proyecto

El proyecto está dividido en tres servicios principales:

### 1. Frontend (`/frontend`)
- Interfaz de usuario para la creación y edición de anuncios interactivos
- Construido con React + Vite + TypeScript
- Desplegado como sitio estático en Render.com

### 2. Assets Service (`/assets-service`)
- Servicio para la gestión y almacenamiento de archivos multimedia
- Integración con Backblaze B2
- API REST para subida y gestión de archivos

### 3. VAST API Service (`/vast-api-service`)
- Servicio para la generación dinámica de VAST XML 4.2
- Integración con DV360
- Soporte para tracking y macros dinámicas

## Requisitos

- Node.js >= 18.0.0
- PostgreSQL (proporcionado por Render.com)
- Cuenta en Backblaze B2 (para almacenamiento de archivos)

## Configuración

Cada servicio requiere su propia configuración. Consulta el README específico en cada directorio para más detalles:

- [Configuración del Frontend](/frontend/README.md)
- [Configuración del Assets Service](/assets-service/README.md)
- [Configuración del VAST API Service](/vast-api-service/README.md)

## Despliegue

El proyecto está configurado para desplegarse automáticamente en Render.com. La configuración se encuentra en `render.yaml`.

### Variables de Entorno Requeridas

#### Assets Service
- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_ID`
- `B2_FILE_URL`

#### VAST API Service
- `DATABASE_URL`

## Desarrollo Local

1. Clona el repositorio:
```bash
git clone https://github.com/Adsmood/CTV_Fronted_Datos_Ok_WebApi_ahora_21-02.git
cd CTV_Fronted_Datos_Ok_WebApi_ahora_21-02
```

2. Instala las dependencias de cada servicio:
```bash
# Frontend
cd frontend
npm install

# Assets Service
cd ../assets-service
npm install

# VAST API Service
cd ../vast-api-service
npm install
```

3. Configura las variables de entorno:
```bash
# Copia los archivos de ejemplo
cp frontend/.env.example frontend/.env
cp assets-service/.env.example assets-service/.env
cp vast-api-service/.env.example vast-api-service/.env
```

4. Inicia los servicios en modo desarrollo:
```bash
# Frontend
cd frontend
npm run dev

# Assets Service
cd ../assets-service
npm run dev

# VAST API Service
cd ../vast-api-service
npm run dev
```

## Licencia

ISC © Adsmood 