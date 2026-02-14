const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { extractStreamMetadata } = require('./streamMetadata');

const app = express();
app.use(cors());
app.use(express.json());

// All the usenet streamer instances from the scan
const ADDON_INSTANCES = [
  { url: "https://usenetstreamer.vps.1337010.xyz", key: "eo-zu-dem-wamba" },
  { url: "https://usenet.liquidstreams.top", key: "vcWsXwhjFLCTIkXcB4vcFRJCbiW4UU" },
  { url: "https://use.r4ckn3rd.top", key: "0f5384bb407fded9fcb8161be14d0b2b4b964ae411c000460eea4d0522debf61" },
  { url: "https://usenet.eintim.dev", key: "lL9vXKRHrkSTdxFjOsdcJfLqn2ygrBtA" },
  { url: "https://ahjaiii242.duckdns.org", key: "ajay" },
  { url: "https://tv.infimal.eu.org", key: "Boofle1968@" },
  { url: "https://wspeed.duckdns.org", key: "87i3to3wlzo8l5g4ztg" },
  { url: "https://mystreamerusenet.duckdns.org", key: "1q2w3e4r" },
  { url: "https://redx113.server329.seedhost.eu", key: "redx113" },
  { url: "https://tv.myzn.de", key: "gkj-Wwhj3s884Gvv3mE32D5ek3" },
  { url: "https://jonis-stream-world.duckdns.org", key: null },
  { url: "https://stream.kezza.vip", key: "Bittersweet1024$" },
  { url: "https://usestreams.ncho.net", key: "f6bcfe83-365c-423a-87a9-5d0765b7001d" },
  { url: "https://stremio.sourcheeks.com", key: null },
  { url: "https://usenetstreamer.kegre.com", key: "Jack0neil!" },
  { url: "https://usenet.majd-ai.com", key: "majd-666" },
  { url: "https://libreent.dpdns.org", key: "libretest123" },
  { url: "https://elmriver.duckdns.org", key: "elmriver" },
  { url: "https://usenetstreamer.rn.zssz.de", key: "9e4da666-7ec6-4fdb-aa05-d08fdec434ed" },
  { url: "https://traumastream.dpdns.org", key: "traumastream" },
  { url: "https://usenetstreamer254.duckdns.org", key: null },
  { url: "https://usenetstreamer.budakatly.app", key: "budakatly" },
  { url: "https://schmatzestream.dedyn.io", key: "msH290Az!VPS" },
  { url: "https://usenet-streamer.eushaun.xyz", key: "305maroubra" },
  { url: "https://alpstream.duckdns.org", key: "3229dad999416409e43545a775f6267d" },
  { url: "https://tadmou016.synology.me:7070", key: "@Degla016_stremio_2025" },
];

// Build the base URL for each addon
function getAddonBaseUrl(instance) {
  if (instance.key) {
    return `${instance.url}/${encodeURIComponent(instance.key)}`;
  }
  return instance.url;
}

// Manifest for our aggregator addon
const MANIFEST = {
  id: 'org.stremio.usenet.aggregator',
  version: '1.2.0',
  name: 'Usenet Streamer Aggregator (English Enhanced)',
  description: `Aggregates English streams from ${ADDON_INSTANCES.length} Usenet Streamer instances with enhanced metadata`,
  types: ['movie', 'series'],
  catalogs: [],
  resources: ['stream'],
  idPrefixes: ['tt'],
  behaviorHints: {
    configurable: false,
    configurationRequired: false
  }
};

/**
 * Format size in human-readable format
 */
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
}

/**
 * Build enhanced stream name with metadata
 */
function buildEnhancedStreamName(stream, hostname) {
  const title = stream.name || stream.title || '';
  const metadata = extractStreamMetadata(title);
  
  // Build metadata badges
  const parts = [];
  
  // Quality
  if (metadata.quality.resolution) {
    parts.push(`${metadata.quality.emoji} ${metadata.quality.resolution}`);
  }
  
  // Language
  if (metadata.language.flag) {
    parts.push(`${metadata.language.flag} ${metadata.language.name}`);
  }
  
  // HDR
  if (metadata.hdr) {
    parts.push(metadata.hdr);
  }
  
  // Source
  if (metadata.source) {
    parts.push(metadata.source);
  }
  
  // Codec
  if (metadata.codec) {
    parts.push(metadata.codec);
  }
  
  // Audio
  if (metadata.audio) {
    parts.push(metadata.audio);
  }
  
  // Size
  if (stream.meta && stream.meta.size) {
    parts.push(`💾 ${formatSize(stream.meta.size)}`);
  }
  
  // Cached/Instant indicator
  const text = title.toLowerCase();
  const isCached = stream.meta?.cached === true || 
                  stream.meta?.cachedFromHistory === true ||
                  text.includes('instant') ||
                  text.includes('cached') ||
                  text.includes('⚡') ||
                  text.includes('✓');
  
  if (isCached) {
    parts.push('⚡ INSTANT');
  }
  
  // Release group
  if (metadata.releaseGroup) {
    parts.push(metadata.releaseGroup);
  }
  
  // Source hostname
  parts.push(`🌐 ${hostname}`);
  
  return parts.join(' | ');
}

// Fetch streams from a single addon with timeout
async function fetchStreamsFromAddon(instance, type, id, timeout = 5000) {
  const baseUrl = getAddonBaseUrl(instance);
  const streamUrl = `${baseUrl}/stream/${type}/${id}.json`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(streamUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Stremio-Aggregator/1.2'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { streams: [], source: instance.url, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    const hostname = new URL(instance.url).hostname;
    
    const streams = (data.streams || []).map(stream => {
      const enhancedName = buildEnhancedStreamName(stream, hostname);
      
      return {
        ...stream,
        name: enhancedName,
        _source: instance.url,
        _originalName: stream.name || stream.title
      };
    });
    
    return { streams, source: instance.url };
  } catch (error) {
    clearTimeout(timeoutId);
    return { streams: [], source: instance.url, error: error.message };
  }
}

// Fetch streams from all addons in parallel
async function fetchAllStreams(type, id) {
  const results = await Promise.allSettled(
    ADDON_INSTANCES.map(instance => fetchStreamsFromAddon(instance, type, id))
  );
  
  const allStreams = [];
  const stats = { success: 0, failed: 0, total: ADDON_INSTANCES.length };
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.streams.length > 0) {
        allStreams.push(...result.value.streams);
        stats.success++;
      } else if (result.value.error) {
        stats.failed++;
      }
    } else {
      stats.failed++;
    }
  }
  
  // Filter by size: max 75GB for movies, 10GB for series
  const MAX_MOVIE_SIZE = 75 * 1024 * 1024 * 1024;  // 75 GB
  const MAX_SERIES_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
  
  const sizeFilteredStreams = allStreams.filter(stream => {
    const meta = stream.meta || {};
    const size = meta.size || 0;
    
    // If no size info, let it through
    if (size === 0) return true;
    
    // Apply size limit based on content type
    if (type === 'movie') {
      return size <= MAX_MOVIE_SIZE;
    } else if (type === 'series') {
      return size <= MAX_SERIES_SIZE;
    }
    
    return true;
  });
  
  // Sort streams: instant/cached first, then by quality, then by size
  sizeFilteredStreams.sort((a, b) => {
    const text_a = (a._originalName || a.name || '').toLowerCase();
    const text_b = (b._originalName || b.name || '').toLowerCase();
    const meta_a = a.meta || {};
    const meta_b = b.meta || {};
    
    // Check if stream is instant/cached
    const isInstant = (stream, text, meta) => {
      if (meta.cached === true) return true;
      if (meta.cachedFromHistory === true) return true;
      if (text.includes('instant')) return true;
      if (text.includes('cached')) return true;
      if (text.includes('⚡')) return true;
      if (text.includes('✓')) return true;
      if (text.includes('tick')) return true;
      return false;
    };
    
    const instant_a = isInstant(a, text_a, meta_a);
    const instant_b = isInstant(b, text_b, meta_b);
    
    // Instant streams first
    if (instant_a && !instant_b) return -1;
    if (!instant_a && instant_b) return 1;
    
    // Then by resolution
    const getResolution = (text) => {
      if (text.includes('2160') || text.includes('4k') || text.includes('uhd')) return 4;
      if (text.includes('1080')) return 3;
      if (text.includes('720')) return 2;
      if (text.includes('480')) return 1;
      return 0;
    };
    
    const res_a = getResolution(text_a);
    const res_b = getResolution(text_b);
    
    if (res_b !== res_a) return res_b - res_a;
    
    // Then by size (larger = better quality usually)
    const size_a = meta_a.size || 0;
    const size_b = meta_b.size || 0;
    return size_b - size_a;
  });
  
  console.log(`[${type}/${id}] Found ${allStreams.length} total streams, ${sizeFilteredStreams.length} after size filter (max ${type === 'movie' ? '75GB' : '10GB'}) from ${stats.success} sources`);
  
  return sizeFilteredStreams;
}

// Routes
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(MANIFEST);
});

app.get('/stream/:type/:id.json', async (req, res) => {
  const { type, id } = req.params;
  
  console.log(`Stream request: ${type}/${id}`);
  
  try {
    const streams = await fetchAllStreams(type, id);
    res.setHeader('Content-Type', 'application/json');
    res.json({ streams });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ streams: [], error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    addons: ADDON_INSTANCES.length,
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  const results = await Promise.allSettled(
    ADDON_INSTANCES.map(async (instance) => {
      const baseUrl = getAddonBaseUrl(instance);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${baseUrl}/manifest.json`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return { url: instance.url, online: response.ok };
      } catch {
        return { url: instance.url, online: false };
      }
    })
  );
  
  const stats = results.map(r => r.status === 'fulfilled' ? r.value : { url: 'unknown', online: false });
  const online = stats.filter(s => s.online).length;
  
  res.json({
    total: ADDON_INSTANCES.length,
    online,
    offline: ADDON_INSTANCES.length - online,
    instances: stats
  });
});

// Root redirect to manifest
app.get('/', (req, res) => {
  res.redirect('/manifest.json');
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Stremio Usenet Aggregator running on port ${PORT}`);
  console.log(`Manifest: http://localhost:${PORT}/manifest.json`);
  console.log(`Aggregating ${ADDON_INSTANCES.length} addon instances`);
  console.log(`Enhanced metadata extraction enabled`);
});
