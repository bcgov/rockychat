# Use the official Node.js image
FROM node:20.11.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Command to run app
CMD ["npm", "run", "start"]
