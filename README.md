# Stremio Usenet Aggregator

A Stremio addon that aggregates streams from 98 Usenet Streamer instances into a single addon.

## Features

- Aggregates streams from 98 different Usenet Streamer instances
- Parallel fetching with 5-second timeout per source
- Automatic quality sorting (4K > 1080p > 720p > 480p)
- Source identification in stream names
- Health check and stats endpoints

## Installation

```bash
npm install
npm start
```

The addon will start on port 7000 (or the PORT environment variable).

## Stremio Installation

Add this addon to Stremio using the manifest URL:

```
http://localhost:7000/manifest.json
```

Or if running on a server:
```
http://your-server:7000/manifest.json
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /manifest.json` | Stremio addon manifest |
| `GET /stream/:type/:id.json` | Get aggregated streams for a movie/series |
| `GET /health` | Health check |
| `GET /stats` | Check which source addons are online |

## How It Works

1. When Stremio requests streams for a movie/series, the aggregator:
   - Sends parallel requests to all 98 Usenet Streamer instances
   - Waits up to 5 seconds for each response
   - Collects all successful streams
   - Sorts by quality (resolution)
   - Returns the combined results

2. Each stream is tagged with its source hostname so you can identify which server it comes from.

## Configuration

You can modify the timeout and other settings in `index.js`:

- `timeout` parameter in `fetchStreamsFromAddon()` - default 5000ms
- `PORT` environment variable - default 7000

## Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 7000
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t stremio-aggregator .
docker run -p 7000:7000 stremio-aggregator
```

## Stats Example

```bash
curl http://localhost:7000/stats
```

Returns:
```json
{
  "total": 98,
  "online": 45,
  "offline": 53,
  "instances": [...]
}
```

## Notes

- Some instances may be offline or slow to respond
- The aggregator includes all instances from the scan, but not all may be active
- Streams are deduplicated by their URL to avoid showing the same stream twice
