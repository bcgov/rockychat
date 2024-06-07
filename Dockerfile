# Use the official Node.js image
FROM node:20.11.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Change config file path, because wedont have access to /npm
# TODO, don't use npm in deployment. use stages. 
ENV npm_config_cache /tmp/npm

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .


ENV GOOGLE_APPLICATION_CREDENTIALS=/app/google-cloud-service-account.json

# Build app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Command to run app
CMD ["npm", "run", "start"]
