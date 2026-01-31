// ============================================================================
// streamMetadata.js - Enhanced language and metadata detection for NZB streams
// ============================================================================

/**
 * Detect if content has English dubbed audio track
 * @param {string} title - Release title/filename
 * @returns {Object} - { isDubbed: boolean, confidence: string, reason: string }
 */
function detectEnglishDub(title) {
  const titleLower = title.toLowerCase();
  
  // Check if English is explicitly mentioned
  const hasEnglish = /\b(eng|english)\b/i.test(titleLower);
  
  // Check for non-English language pairs (the RARE case where dual doesn't mean English)
  const hasNonEnglishPair = 
    /\b(mandarin|cantonese)[\s._-]+(mandarin|cantonese)\b/i.test(titleLower) ||
    /\b(hindi|tamil)[\s._-]+(telugu|malayalam)\b/i.test(titleLower) ||
    /\[(kor|jpn|chi|hin|tam)[\s._+-]+(kor|jpn|chi|hin|tam)\]/i.test(titleLower);
  
  // Patterns that indicate multi-audio (ASSUME English unless proven otherwise)
  const multiAudioPatterns = [
    /dual[\s._-]?audio/i,
    /multi[\s._-]?audio/i,
    /[\s._-](dubbed|dub)[\s._-]/i,
    /[\s._-](dubbed|dub)\d/i
  ];
  
  // STRONG POSITIVE INDICATORS (explicit English mentions)
  const strongDubPatterns = [
    /\b(eng|english)[\s._-]?(dub|dubbed)\b/i,
    /\b(dub|dubbed)[\s._-]?(eng|english)\b/i,
    /\[(eng|english)\+(jpn|jap|kor|chi|spa|ita|fre|ger|hin)\]/i,
    /\[(jpn|jap|kor|chi|spa|ita|fre|ger|hin)\+(eng|english)\]/i,
    /audio[\s._-]?(eng|english)/i,
    /(eng|english)[\s._-]?audio/i,
    
    // Language + English combinations
    /\b(kor|korean)[\s._-]+(eng|english)\b/i,
    /\b(eng|english)[\s._-]+(kor|korean)\b/i,
    /\b(jpn|jap|japanese)[\s._-]+(eng|english)\b/i,
    /\b(eng|english)[\s._-]+(jpn|jap|japanese)\b/i,
    /\b(chi|chinese|mandarin|cantonese)[\s._-]+(eng|english)\b/i,
    /\b(eng|english)[\s._-]+(chi|chinese|mandarin|cantonese)\b/i,
    /\b(hindi|tamil|telugu|malayalam)[\s._-]+(eng|english)\b/i,
    /\b(eng|english)[\s._-]+(hindi|tamil|telugu|malayalam)\b/i,
    /\b(spa|spanish|ger|german|fre|french|ita|italian|rus|russian)[\s._-]+(eng|english)\b/i,
    /\b(eng|english)[\s._-]+(spa|spanish|ger|german|fre|french|ita|italian|rus|russian)\b/i
  ];
  
  // NEGATIVE INDICATORS (definitely NOT dubbed, just subs)
  const subOnlyPatterns = [
    /sub(title)?s?[\s._-]?(eng|english)/i,
    /(eng|english)[\s._-]?sub(title)?s?\b/i,
    /\[(eng|english)[\s._-]?sub\]/i,
    /\(eng[\s._-]?sub(s)?\)/i,
    /(soft|hard)[\s._-]?sub/i,
    /vostfr/i
  ];
  
  // Check for sub-only first (takes priority)
  if (subOnlyPatterns.some(pattern => pattern.test(titleLower))) {
    return {
      isDubbed: false,
      confidence: 'high',
      reason: 'subtitle_keywords'
    };
  }
  
  // Check for strong/explicit English dub indicators
  if (strongDubPatterns.some(pattern => pattern.test(titleLower))) {
    return {
      isDubbed: true,
      confidence: 'high',
      reason: 'explicit_english_dub'
    };
  }
  
  // Check for generic multi-audio patterns
  // ASSUME English unless it's a rare non-English pair
  if (multiAudioPatterns.some(pattern => pattern.test(titleLower))) {
    if (hasNonEnglishPair) {
      // Rare case: two non-English languages
      return {
        isDubbed: false,
        confidence: 'high',
        reason: 'non_english_multi_audio'
      };
    }
    // Common case: assume English is one of the tracks
    return {
      isDubbed: true,
      confidence: 'medium',
      reason: 'generic_multi_audio_assumes_english'
    };
  }
  
  // Just "eng" or "english" alone (ambiguous - could be subs or original)
  if (hasEnglish) {
    return {
      isDubbed: false,
      confidence: 'low',
      reason: 'ambiguous_english_tag'
    };
  }
  
  return {
    isDubbed: false,
    confidence: 'unknown',
    reason: 'no_dual_audio_indicators'
  };
}

/**
 * Detect if content has multiple audio tracks (non-English dual/multi audio)
 * @param {string} title - Release title/filename
 * @returns {boolean} - true if multi-lingual
 */
function detectMultiLingual(title) {
  const titleLower = title.toLowerCase();
  
  // Patterns that indicate multiple audio tracks (excluding English patterns)
  const multiLingualPatterns = [
    // Non-English dual audio patterns
    /\b(kor|korean)[\s._-]+(jpn|jap|japanese)\b/i,
    /\b(jpn|jap|japanese)[\s._-]+(kor|korean)\b/i,
    /\b(chi|chinese)[\s._-]+(jpn|jap|japanese)\b/i,
    /\b(jpn|jap|japanese)[\s._-]+(chi|chinese)\b/i,
    /\b(hindi|tamil)[\s._-]+(telugu|malayalam)\b/i,
    /\b(spa|spanish)[\s._-]+(fre|french)\b/i,
    
    // Bracketed multi-language [KOR+JPN], [HIN+TAM] (non-English)
    /\[(kor|jpn|chi|hin|spa|fre|ger|ita|rus|tam|tel)[\s._+-]+(kor|jpn|chi|hin|spa|fre|ger|ita|rus|tam|tel)\]/i,
    
    // Plus notation without brackets (non-English)
    /\b(kor|korean|jpn|japanese|chi|chinese|hindi|tamil|spanish|french|german)\+(kor|korean|jpn|japanese|chi|chinese|hindi|tamil|spanish|french|german)\b/i
  ];
  
  return multiLingualPatterns.some(pattern => pattern.test(titleLower));
}

/**
 * Detect primary language from title with conservative logic
 * @param {string} title - Release title/filename
 * @param {Object} dubInfo - Result from detectEnglishDub()
 * @param {boolean} isMultiLingual - Result from detectMultiLingual()
 * @returns {Object} - { flag: string, name: string }
 */
function detectLanguage(title, dubInfo, isMultiLingual) {
  const titleLower = title.toLowerCase();
  
  // PRIORITY 1: Check for SPECIFIC non-English languages FIRST
  // This prevents false "English" detection
  if (/\b(kor|korean|hangul|[한국어])/i.test(title)) {
    // If Korean + English dub, mark as dubbed
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Korean + ENG DUB' };
    }
    return { flag: '🇰🇷', name: 'Korean' };
  }
  
  if (/\b(jpn|jap|japanese|nihongo|[あいうえお])/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Japanese + ENG DUB' };
    }
    return { flag: '🇯🇵', name: 'Japanese' };
  }
  
  if (/\b(chi|chinese|mandarin|cantonese|[人是文国])/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Chinese + ENG DUB' };
    }
    return { flag: '🇨🇳', name: 'Chinese' };
  }
  
  if (/(german|deutsch)/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'German + ENG DUB' };
    }
    return { flag: '🇩🇪', name: 'German' };
  }
  
  if (/(french|français|vf\b)/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'French + ENG DUB' };
    }
    return { flag: '🇫🇷', name: 'French' };
  }
  
  if (/spanish|español/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Spanish + ENG DUB' };
    }
    return { flag: '🇪🇸', name: 'Spanish' };
  }
  
  if (/italian|italiano/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Italian + ENG DUB' };
    }
    return { flag: '🇮🇹', name: 'Italian' };
  }
  
  if (/russian/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Russian + ENG DUB' };
    }
    return { flag: '🇷🇺', name: 'Russian' };
  }
  
  if (/(hindi|tamil|telugu|malayalam)/i.test(title)) {
    if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
      return { flag: '🎙️', name: 'Indian + ENG DUB' };
    }
    return { flag: '🇮🇳', name: 'Indian' };
  }
  
  if (/(polish|polski)/i.test(title)) {
    return { flag: '🇵🇱', name: 'Polish' };
  }
  
  if (/(dutch|nederlands)/i.test(title)) {
    return { flag: '🇳🇱', name: 'Dutch' };
  }
  
  if (/(portuguese|português)/i.test(title)) {
    return { flag: '🇵🇹', name: 'Portuguese' };
  }
  
  if (/(turkish|türkçe)/i.test(title)) {
    return { flag: '🇹🇷', name: 'Turkish' };
  }
  
  if (/(arabic|عربي)/i.test(title)) {
    return { flag: '🇸🇦', name: 'Arabic' };
  }
  
  // PRIORITY 2: Non-English multi-lingual content
  if (isMultiLingual) {
    return { flag: '🌍', name: 'Multi-Lingual' };
  }
  
  // PRIORITY 3: English dub of unknown language content
  if (dubInfo.isDubbed && (dubInfo.confidence === 'high' || dubInfo.confidence === 'medium')) {
    return { flag: '🎙️', name: 'Multi-Audio (ENG DUB)' };
  }
  
  // PRIORITY 4: Explicit English ONLY if "eng" or "english" in title
  if (/\b(eng|english|en-us)\b/i.test(title)) {
    return { flag: '🇺🇸', name: 'English' };
  }
  
  // PRIORITY 5: No language info = assume original/default language
  return { flag: '🎬', name: 'Original Language' };
}

/**
 * Extract quality information from title
 * @param {string} title - Release title/filename
 * @returns {Object} - { resolution: string, emoji: string }
 */
function extractQuality(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('2160p') || titleLower.includes('4k') || titleLower.includes('uhd')) {
    return { resolution: '2160p', emoji: '🌟' };
  }
  if (titleLower.includes('1080p') || titleLower.includes('fhd')) {
    return { resolution: '1080p', emoji: '🎥' };
  }
  if (titleLower.includes('720p') || titleLower.includes('hd')) {
    return { resolution: '720p', emoji: '📺' };
  }
  if (titleLower.includes('480p') || titleLower.includes('sd')) {
    return { resolution: '480p', emoji: '📱' };
  }
  
  return { resolution: 'SD', emoji: '📱' };
}

/**
 * Extract HDR information from title
 * @param {string} title - Release title/filename
 * @returns {string} - HDR info string or empty
 */
function extractHDR(title) {
  if (/(dolby.?vision|dovi|dv)/i.test(title)) {
    return '🎨 Dolby Vision';
  }
  if (/hdr10\+/i.test(title)) {
    return '🌈 HDR10+';
  }
  if (/hdr10/i.test(title)) {
    return '🌟 HDR10';
  }
  if (/hlg/i.test(title)) {
    return '☀️ HLG';
  }
  if (/\bhdr\b/i.test(title)) {
    return '✨ HDR';
  }
  if (/sdr/i.test(title)) {
    return '📀 SDR';
  }
  
  // Check for bit-depth if no HDR found
  if (/(10.?bit|10bit|hi10p)/i.test(title)) {
    return '🔟 10-bit';
  }
  if (/(8.?bit|8bit)/i.test(title)) {
    return '🎨 8-bit';
  }
  
  return '';
}

/**
 * Extract source information from title
 * @param {string} title - Release title/filename
 * @returns {string} - Source info string or empty
 */
function extractSource(title) {
  const titleLower = title.toLowerCase();
  
  if (/remux/i.test(titleLower)) {
    return '💿 REMUX';
  }
  if (/(bluray|blu-?ray)/i.test(titleLower)) {
    return '💿 BluRay';
  }
  if (/(web-?dl|webrip)/i.test(titleLower)) {
    return '🌐 WEB-DL';
  }
  if (/hdtv/i.test(titleLower)) {
    return '📡 HDTV';
  }
  
  return '';
}

/**
 * Extract codec information from title
 * @param {string} title - Release title/filename
 * @returns {string} - Codec info string or empty
 */
function extractCodec(title) {
  const titleLower = title.toLowerCase();
  
  if (/(hevc|x265|h\.?265)/i.test(titleLower)) {
    return '🔢 HEVC/x265';
  }
  if (/(h264|x264|avc)/i.test(titleLower)) {
    return '🔢 AVC/x264';
  }
  if (/av1/i.test(titleLower)) {
    return '🔢 AV1';
  }
  
  return '';
}

/**
 * Extract audio information from title
 * @param {string} title - Release title/filename
 * @returns {string} - Audio info string or empty
 */
function extractAudio(title) {
  const titleLower = title.toLowerCase();
  
  if (/atmos/i.test(titleLower)) {
    return '🔊 Dolby Atmos';
  }
  if (/truehd/i.test(titleLower)) {
    return '🔊 TrueHD';
  }
  if (/dts-?hd|dts\.?hd/i.test(titleLower)) {
    return '🔊 DTS-HD MA';
  }
  if (/dts/i.test(titleLower)) {
    return '🔊 DTS';
  }
  if (/dd\+|ddp|eac3/i.test(titleLower)) {
    return '🔊 DD+';
  }
  if (/ac3|dd/i.test(titleLower)) {
    return '🔊 DD 5.1';
  }
  if (/aac/i.test(titleLower)) {
    return '🔊 AAC';
  }
  
  return '';
}

/**
 * Extract release group from title
 * @param {string} title - Release title/filename
 * @returns {string} - Release group string or empty
 */
function extractReleaseGroup(title) {
  const groupMatch = title.match(/-([A-Za-z0-9]+)$/) || 
                    title.match(/\[([A-Za-z0-9]+)\]/) ||
                    title.match(/\{([A-Za-z0-9]+)\}/) ||
                    title.match(/\.([A-Za-z0-9]+)$/);
  
  if (groupMatch && groupMatch[1]) {
    return `🏷️ ${groupMatch[1]}`;
  }
  
  return '';
}

/**
 * Main function to extract all metadata from NZB title
 * @param {string} title - Release title/filename
 * @returns {Object} - Complete metadata object
 */
function extractStreamMetadata(title) {
  const dubInfo = detectEnglishDub(title);
  const isMultiLingual = detectMultiLingual(title);
  const language = detectLanguage(title, dubInfo, isMultiLingual);
  const quality = extractQuality(title);
  const hdr = extractHDR(title);
  const source = extractSource(title);
  const codec = extractCodec(title);
  const audio = extractAudio(title);
  const releaseGroup = extractReleaseGroup(title);
  
  return {
    dubInfo,
    isMultiLingual,
    language,
    quality,
    hdr,
    source,
    codec,
    audio,
    releaseGroup
  };
}

module.exports = {
  detectEnglishDub,
  detectMultiLingual,
  detectLanguage,
  extractQuality,
  extractHDR,
  extractSource,
  extractCodec,
  extractAudio,
  extractReleaseGroup,
  extractStreamMetadata
};
