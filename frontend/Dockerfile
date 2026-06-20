# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and install packages
COPY package*.json ./
RUN npm install

# Copy source and compile
COPY . .
RUN npm run build

# Stage 2: Serve the build artifacts with Nginx
FROM nginx:stable-alpine

# Copy compiled files to Nginx static assets path
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
