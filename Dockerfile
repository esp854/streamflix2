FROM node:18-alpine

WORKDIR /app

# Copier tout le projet
COPY . .

# Installer les dépendances du frontend et backend
RUN cd client && npm install
RUN npm install

# Builder le frontend
RUN cd client && npm run build

# Compiler le backend
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
