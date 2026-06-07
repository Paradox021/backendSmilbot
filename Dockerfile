# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose port (default 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
