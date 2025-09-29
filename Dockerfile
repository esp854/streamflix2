# ---- Étape 1 : Builder le frontend ----
FROM node:18-alpine AS build-frontend

WORKDIR /app

# Copier seulement package.json et package-lock.json du frontend pour installer les dépendances
COPY client/package*.json ./client/
RUN cd client && npm install

# Copier tout le frontend
COPY client ./client

# Builder le frontend avec Vite
RUN cd client && npm run build


# ---- Étape 2 : Builder le backend ----
FROM node:18-alpine AS build-backend

WORKDIR /app

# Copier package.json et installer backend
COPY package*.json ./
RUN npm install

# Copier le backend
COPY server ./server

# Copier le build frontend depuis l'étape précédente
COPY --from=build-frontend /app/client/dist ./dist/public

# Compiler le backend avec esbuild
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist


# ---- Étape finale : image légère ----
FROM node:18-alpine

WORKDIR /app

# Copier uniquement le nécessaire depuis build-backend
COPY --from=build-backend /app/dist ./dist
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
