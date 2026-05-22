FROM node:20-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

RUN npm install

# Copy the rest of the source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
