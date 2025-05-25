# Frontend Dockerfile for React application

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Use nginx to serve the built application
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=0 /app/build /usr/share/nginx/html

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
