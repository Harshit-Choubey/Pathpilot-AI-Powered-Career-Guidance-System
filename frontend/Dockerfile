FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files
COPY . .

# Expose Vite port
EXPOSE 5173

# Start the dev server and expose to network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
