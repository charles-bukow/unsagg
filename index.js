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
  { url: "https://usestreamer.ankittulsian.in", key: "Anj@li1234567890" },
  { url: "https://usen.mywieck.com", key: "5678901234" },
  { url: "https://koernelbroylz.duckdns.org", key: "6709f4fbf549885908f" },
  { url: "https://usenetstreamer08.duckdns.org", key: "c1746fb7a9c208aeb3e03bc387ae4b02" },
  { url: "https://usenet.traumasimae.world", key: null },
  { url: "https://rohirrim.hornburg.dpdns.org", key: "o!2!WJcu7Hdg7gWV" },
  { url: "https://astralusenet.duckdns.org", key: "007acce876d8a50dd9e5dc0e2b022925" },
  { url: "https://streamer.dimenzion.cc", key: "nhpd46c12345" },
  { url: "https://auro2026.duckdns.org", key: "tiu2025" },
  { url: "https://aashishselfhosted.duckdns.org", key: "randomsecret492357816" },
  { url: "https://usenet.kubricko.lat", key: "Misawa123" },
  { url: "https://usenetstreamer.092777.xyz", key: "d9f4c28a73b54e8fa927bdb5e2a31c67" },
  { url: "https://addon.usepbe.de", key: "Enter-some-random-string-here-as-token" },
  { url: "https://de-addon.duckdns.org", key: "BenandJerrys2024" },
  { url: "https://stremio-addon.duckdns.org", key: "super-secret-token" },
  { url: "https://vandubi.duckdns.org", key: "f0e90cd5-54f9-4d0f-a27c-f627aa267c35" },
  { url: "https://nbustreamer.duckdns.org", key: "1189password" },
  { url: "https://themomotaro.duckdns.org", key: "Torrow858" },
  { url: "https://chrostream.duckdns.org", key: "sebstream" },
  { url: "https://us.vincentserver.com", key: "super-secret-token" },
  { url: "https://mmstream.duckdns.org", key: "xwlXPPF77Pb7qfUq7VI6ZB1vdQQBgkHC" },
  { url: "https://peenandbean.duckdns.org", key: "Reina&Ellie" },
  { url: "https://rakamahatta.duckdns.org", key: "qf5j3a8HgMlK8vuCHB5sPUEi82vci7CIS4WDGOUiBe8oUEx6VuBKvm4H2OQdOJEC" },
  { url: "https://davon-streams.duckdns.org", key: null },
  { url: "https://beck-aio.duckdns.org", key: "beck-secret" },
  { url: "https://stremio-pankner.duckdns.org", key: "trIC01Q00zyBV8eKxoyg" },
  { url: "https://this-ma-subdomain-yo.duckdns.org", key: "this-ma-ultra-super-duper-secure-token-yo" },
  { url: "https://mystreamer.controld.live", key: "MySecureStream77" },
  { url: "https://usestreams.ncho.dev", key: "f6bcfe83-365c-423a-87a9-5d0765b7001d" },
  { url: "https://usenetstreamer.bkserver1.chickenkiller.com", key: "Bruno0808" },
  { url: "https://majordudenet.duckdns.org", key: "fezstremio" },
  { url: "https://uns-vps.treeshare.ddnsgeek.com", key: "Drgreenthumb95!117" },
  { url: "https://usenetstreamer.lukkie.be", key: "LukkieRandomToken543" },
  { url: "https://usenetstreamer-privatize-clever-anytime.duckdns.org", key: "n8UDb55Re5ANA3SyT78a2Fvdt42sHxgn33VAsmYBJGAHJi98tDRwujdtAH2LmG4c" },
  { url: "https://usenet.huwey.de", key: "xlfdNieNsXQxsG8LnAwNSFp7sdlrzgwe9p0z6fM" },
  { url: "https://usenetstreamer.daputza.ddnss.de", key: "muellermilch" },
  { url: "https://usenetstreamer.tmoliver.boo", key: "4c1b8d08ad509eab4c1a5f15c8e8affa" },
  { url: "https://usenetstreamer.oracle.willipi.uk", key: "Mein-UsenetStreamer-Token" },
  { url: "https://usenetstreamer.sustav.xyz", key: "893a1189abac0c9181a0808a056bab6a67ccdf7594643b8751c734157d47666a" },
  { url: "https://usenet.mustangarr.com", key: "7b5e897eb2a10f7660b3d8076b288cd7" },
  { url: "https://usausnet.duckdns.org", key: "tiu2025" },
  { url: "https://streamuse.duckdns.org:4443", key: "1E1C2280B90B3F01AD84CD8DF4858B1B1995012814F3CA8893BCC3BA3848EDEC" },
  { url: "https://albaz.duckdns.org", key: "JubjH5U75vtrWrsW" },
  { url: "https://uns.a.zelli.dev", key: "asdhAHSDBHJhasdbhSADHB123123HNHAdajkejnadnadwuojla" },
  { url: "https://miyustreams.de", key: "WYCZO8HjV_ZQ5lQw,wP23--tqEy00xiwf,iPZW2Q7KDnVAsFh2,hHaFAF_rysHRw5kX,M2UfP7Mcb7ejI9Ox" },
  { url: "https://usenet.fraven.xyz", key: "Nospe86842020Nospe86842020" },
  { url: "https://stream.notobooks.com", key: "r4N9QeT7KpX2LZ8mA5YcD1H6" },
  { url: "https://usenetstreamer212.duckdns.org", key: "stremio" },
  { url: "https://stream.h0rs.com", key: "1bK0!mTz85@.oPntY2*RRk5fD9" },
  { url: "https://nzbn.duckdns.org", key: "k11111" },
  { url: "https://usenetstream125d31.duckdns.org", key: "super-secret-token" },
  { url: "https://whatwhatwhat.duckdns.org", key: "QZB9y7kqB8VvE3iWzU1o9P2j" },
  { url: "https://usenet-streamer.pushstyle.myds.me", key: "qKgPWBFG4i9RR1+53XACdrflvy32WxBZD+P51HxOsGQ=" },
  { url: "https://tonestream1.duckdns.org", key: "myserver11" },
  { url: "https://mystreamermax.duckdns.org", key: null },
  { url: "https://usenetmirac.duckdns.org", key: "aXnfinFgepv44BpvvUQPFlB0OXGa3Jjutz4L8Ly1YP7ycGu88I" },
  { url: "https://mystreamy.duckdns.org", key: "doggystyle" },
  { url: "https://usenetstreamer.philipg.dev", key: "phnzb1337x" },
  { url: "https://usenet.mumbai.jeewanvps.xyz", key: "your-secret-token" },
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
