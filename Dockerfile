# Establecer la imagen base de Node.js
ARG NODE_VERSION=16.17.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"

# Directorio de trabajo de la aplicación NodeJS
WORKDIR /app

# Establecer el entorno de producción
ENV NODE_ENV=production

# Etapa de construcción para reducir el tamaño de la imagen final
FROM base as build

# Copiar los archivos de configuración de la aplicación
COPY package*.json ./

# Instalar las dependencias de desarrollo
RUN npm install --production=false

# Copiar el código de la aplicación
COPY . .

# Construir la aplicación
RUN npm run build

# Eliminar las dependencias de desarrollo
RUN npm prune --production

# Etapa final para la imagen de la aplicación
FROM base

# Copiar la aplicación construida
COPY --from=build /app /app

# Iniciar el servidor por defecto, esto puede ser sobrescrito en tiempo de ejecución
CMD [ "npm", "run", "start" ]
