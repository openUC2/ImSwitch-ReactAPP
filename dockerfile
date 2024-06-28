# docker build -t microscope-app .
# docker run -p 5000:5000 microscope-app
# Use an official Node.js runtime as a parent image
FROM arm32v7/node:14 
#FROM node:14


# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Clone the app
RUN git clone https://github.com/beniroquai/imswitch-aiortc-react /appMicroscope

# Set the working directory to the cloned repository
WORKDIR /appMicroscope

# Install dependencies for the cloned repository
RUN npm install
RUN npm install @mui/material @emotion/react @emotion/styled

# Replace the homepage string in package.json
RUN sed -i 's|"homepage": "https://youseetoo.github.io/imswitch"|"homepage": "https://youseetoo.github.io/"|' package.json

# Build the application
RUN npm run build

# Install serve globally to serve the build directory
RUN npm install -g serve

# Set the command to serve the app
CMD ["serve", "-s", "build"]

# Expose the port the app runs on
EXPOSE 5000
