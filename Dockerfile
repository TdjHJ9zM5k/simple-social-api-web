# Use an official Node.js runtime as a parent image
FROM node:18 AS build

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the React application
RUN npm run build

# Use an official NGINX runtime as the base image for the production build
FROM nginx:alpine

# Copy the built files from the previous stage to the NGINX html directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 8080 to the outside world (as required by Google Cloud Run)
EXPOSE 8080

# Copy the custom NGINX configuration file to the appropriate location
COPY nginx.conf /etc/nginx/nginx.conf

# Copy custom server configuration to the appropriate directory
COPY default.conf /etc/nginx/conf.d/default.conf

# Command to run NGINX
CMD ["nginx", "-g", "daemon off;"]
