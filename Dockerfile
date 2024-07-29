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

# Update the NGINX configuration to listen on port 8080
RUN sed -i 's/listen 80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Command to run NGINX
CMD ["nginx", "-g", "daemon off;"]
