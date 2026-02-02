FROM debian:12.5-slim

EXPOSE 80
WORKDIR /home

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js the Lampac way
RUN curl -fSL -o node.tar.gz https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.gz \
    && mkdir -p /usr/local/nodejs \
    && tar -xzf node.tar.gz -C /usr/local/nodejs --strip-components=1 \
    && rm node.tar.gz \
    && ln -s /usr/local/nodejs/bin/node /usr/local/bin/node \
    && ln -s /usr/local/nodejs/bin/npm /usr/local/bin/npm

# Download app from GitHub (replace with your repo URL)
RUN curl -L -o app.zip https://github.com/charles-bukow/unsagg/archive/refs/heads/noteng.zip \
    && unzip app.zip && rm app.zip \
    && mv unsagg-main/* . && rm -rf unsagg-main

# Install app dependencies
RUN npm install --production

# Replace port 7000 with port 80 in JavaScript files
# IMPORTANT: Use enhanced-addon.js as the main entry point
RUN if [ -f "enhanced-addon.js" ]; then \
        mv enhanced-addon.js index.js; \
    fi

# Replace port references
RUN find . -type f -name "*.js" -exec sed -i 's/const PORT = process\.env\.PORT || 7000/const PORT = process.env.PORT || 80/g' {} \; || true

# Create necessary directories with permissions
RUN mkdir -p data/cache log temp && chmod -R 777 data log temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Start the application
CMD ["node", "index.js"]
