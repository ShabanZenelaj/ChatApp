FROM node:20
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build application
RUN npm run build

# Expose express port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]