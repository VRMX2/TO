FROM node:20-slim

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package*.json ./

RUN npm install

# Copy the rest of the source
COPY . .

EXPOSE 5173

# --host 0.0.0.0 is required so the Vite server is reachable outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
