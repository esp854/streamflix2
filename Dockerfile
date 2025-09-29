FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Update package-lock.json to match package.json and install dependencies
RUN npm install --package-lock-only && npm ci --legacy-peer-deps

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Expose port (Railway will set PORT environment variable)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
