# ---- Étape 1 : Builder le frontend ----
FROM node:18-alpine AS build-frontend

WORKDIR /app

# Copier uniquement ce qui est nécessaire pour vite
COPY client/package*.json ./client/
RUN cd client && npm install

# Copier le frontend
COPY client ./client

# Builder le frontend
RUN cd client && npm run build


# ---- Étape 2 : Builder le backend ----
FROM node:18-alpine AS build-backend

WORKDIR /app

# Copier les fichiers du backend
COPY package*.json ./
RUN npm install

COPY server ./server
COPY --from=build-frontend /app/client/dist ./dist/public

# Compiler le backend
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist


# ---- Étape finale ----
FROM node:18-alpine

WORKDIR /app

COPY --from=build-backend /app/dist ./dist
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
