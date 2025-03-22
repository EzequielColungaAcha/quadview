import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const cache = new NodeCache();
const port = 3000;

// Video configuration
const VIDEO_ROOT_PATH = process.env.VIDEO_PATH || join(__dirname, '..', 'videos');
const CACHE_PATH = join(__dirname, 'cache');
const MAX_CONCURRENT_TRANSCODERS = 2; // Limit concurrent transcoding processes

// Transcoding settings
const TRANSCODING_SETTINGS = {
  crf: '23',
  preset: 'veryfast',
  threads: '0',
  movflags: 'faststart+frag_keyframe',
  maxrate: '2M',
  bufsize: '4M',
  x264opts: 'no-scenecut',
  audioBitrate: '128k',
  audioChannels: '2',
};

// Track active transcoding processes
const activeTranscoders = new Map();
const transcodingQueue = [];

const WEATHER_CACHE_FILE = join(CACHE_PATH, 'weatherCache.json');
const DOLLAR_CACHE_FILE = join(CACHE_PATH, 'dollarCache.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_PATH)) {
  fs.mkdirSync(CACHE_PATH, { recursive: true });
}

// Load persistent cache from files
function loadPersistentCache() {
  try {
    if (fs.existsSync(WEATHER_CACHE_FILE)) {
      const rawData = fs.readFileSync(WEATHER_CACHE_FILE, 'utf8');
      const { timestamp, data } = JSON.parse(rawData);
      const age = Date.now() - timestamp;
      if (age <= 30 * 60 * 1000) {
        const ttl = Math.floor((30 * 60 * 1000 - age) / 1000);
        cache.set('weatherData', data, ttl);
        console.log('Loaded weather data from persistent cache');
      }
    }
  } catch (error) {
    console.error('Error loading weather cache:', error);
  }

  try {
    if (fs.existsSync(DOLLAR_CACHE_FILE)) {
      const rawData = fs.readFileSync(DOLLAR_CACHE_FILE, 'utf8');
      const { timestamp, data } = JSON.parse(rawData);
      const age = Date.now() - timestamp;
      if (age <= 30 * 60 * 1000) {
        const ttl = Math.floor((30 * 60 * 1000 - age) / 1000);
        cache.set('dollarRates', data, ttl);
        console.log('Loaded dollar rates from persistent cache');
      }
    }
  } catch (error) {
    console.error('Error loading dollar rates cache:', error);
  }
}

// Load existing cache on startup
loadPersistentCache();


app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeTranscoders: activeTranscoders.size,
    transcodingQueue: transcodingQueue.length,
  });
});

// Check FFmpeg installation and codecs
async function checkFFmpegCapabilities() {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableCodecs((err, codecs) => {
      if (err) {
        reject(new Error('FFmpeg is not properly installed'));
        return;
      }

      const hasLibx264 = Object.keys(codecs).some(codec => 
        codec.includes('libx264') && codecs[codec].canEncode);
      const hasAAC = Object.keys(codecs).some(codec => 
        codec.includes('aac') && codecs[codec].canEncode);

      if (!hasLibx264 || !hasAAC) {
        const missing = [];
        if (!hasLibx264) missing.push('libx264');
        if (!hasAAC) missing.push('aac');
        reject(new Error(`Missing required encoders: ${missing.join(', ')}`));
      } else {
        resolve();
      }
    });
  });
}

// Weather API endpoints
async function fetchWeatherData() {
  try {
    const timestamp = new Date().getTime();
    const currentUrl = `http://dataservice.accuweather.com/currentconditions/v1/7492?apikey=NexHawAsdzd19XkjUXV6uS5pJozc8Kbn&language=es-ar&details=true&timestamp=${timestamp}`;
    const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/7492?apikey=B5ozTlGWDsuDSkaDqLnmemsuTr9c1hGn&language=es-ar&details=true&metric=true&timestamp=${timestamp}`;

    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(currentUrl),
      axios.get(forecastUrl)
    ]);

    return {
      current: currentResponse.data[0],
      forecast: forecastResponse.data.DailyForecasts[0]
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

// Update weather data every 30 minutes
async function updateWeatherCache() {
  try {
    const data = await fetchWeatherData();
    cache.set('weatherData', data, 1800);
    fs.writeFileSync(WEATHER_CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (error) {
    console.error('Error updating weather cache:', error);
  }
}

if (!cache.get('weatherData')) {
  updateWeatherCache();
}
setInterval(updateWeatherCache, 1800000);

app.get('/api/weather', (req, res) => {
  const weatherData = cache.get('weatherData');
  if (weatherData) {
    res.json(weatherData);
  } else {
    res.status(503).json({ error: 'Weather data not available' });
  }
});

// Dollar rates API endpoints
async function fetchDollarRates() {
  try {
    const response = await axios.get('https://dolarapi.com/v1/dolares');
    return response.data;
  } catch (error) {
    console.error('Error fetching dollar rates:', error);
    throw error;
  }
}

async function updateDollarCache() {
  try {
    const data = await fetchDollarRates();
    cache.set('dollarRates', data, 1800);
    fs.writeFileSync(DOLLAR_CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (error) {
    console.error('Error updating dollar rates cache:', error);
  }
}

if (!cache.get('dollarRates')) {
  updateDollarCache();
}
setInterval(updateDollarCache, 1800000);

app.get('/api/dollar-rates', (req, res) => {
  const dollarRates = cache.get('dollarRates');
  if (dollarRates) {
    res.json(dollarRates);
  } else {
    res.status(503).json({ error: 'Dollar rates not available' });
  }
});

// Video handling functions
function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.flv'];
  return videoExtensions.includes(extname(filename).toLowerCase());
}

function getVideoMetadata(fullPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(fullPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const streams = metadata.streams;
      const videoStream = streams.find(s => s.codec_type === 'video');
      const audioStreams = streams.filter(s => s.codec_type === 'audio');
      const subtitleStreams = streams.filter(s => s.codec_type === 'subtitle');

      resolve({
        duration: metadata.format.duration || 0,
        audioTracks: audioStreams.map(stream => ({
          index: stream.index,
          language: stream.tags?.language || 'und',
          title: stream.tags?.title || `Audio Track ${stream.index + 1}`,
          codec: stream.codec_name
        })),
        subtitles: subtitleStreams.map(stream => ({
          index: stream.index,
          language: stream.tags?.language || 'und',
          title: stream.tags?.title || `Subtitle Track ${stream.index + 1}`,
          codec: stream.codec_name
        }))
      });
    });
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function flattenVideoList(directory) {
  let videos = [];
  
  async function traverse(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = fs.statSync(fullPath);
      const relativePath = fullPath.replace(VIDEO_ROOT_PATH, '').replace(/\\/g, '/');
      
      if (stat.isDirectory()) {
        await traverse(fullPath);
      } else if (stat.isFile() && isVideoFile(item)) {
        try {
          const metadata = await getVideoMetadata(fullPath);
          videos.push({
            id: crypto.randomUUID(),
            name: item,
            path: relativePath,
            size: stat.size,
            mtime: stat.mtime,
            duration: metadata.duration,
            audioTracks: metadata.audioTracks,
            subtitles: metadata.subtitles
          });
        } catch (error) {
          console.error(`Error getting metadata for ${item}:`, error);
        }
      }
    }
  }
  
  await traverse(directory);
  return shuffleArray(videos);
}

// Video streaming endpoints
app.get('/api/videos/playlist', async (req, res) => {
  try {
    const playlist = await flattenVideoList(VIDEO_ROOT_PATH);
    res.json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Cleanup function for transcoding processes
function cleanupTranscoder(videoPath) {
  const transcoder = activeTranscoders.get(videoPath);
  if (transcoder) {
    try {
      transcoder.kill('SIGKILL');
    } catch (error) {
      console.error('Error killing transcoder:', error);
    }
    activeTranscoders.delete(videoPath);
  }
}

// Cleanup all transcoders on process exit
process.on('exit', () => {
  for (const videoPath of activeTranscoders.keys()) {
    cleanupTranscoder(videoPath);
  }
});

// Helper function to check if a video needs transcoding
function needsTranscoding(fullPath) {
  const ext = extname(fullPath).toLowerCase();
  return !['.mp4', '.webm'].includes(ext);
}

// Helper function to get video stream configuration
function getStreamConfig(audioTrack, subtitleTrack) {
  const config = {
    ...TRANSCODING_SETTINGS,
    outputOptions: [
      '-movflags', TRANSCODING_SETTINGS.movflags,
      '-preset', TRANSCODING_SETTINGS.preset,
      '-threads', TRANSCODING_SETTINGS.threads,
      '-crf', TRANSCODING_SETTINGS.crf,
      '-maxrate', TRANSCODING_SETTINGS.maxrate,
      '-bufsize', TRANSCODING_SETTINGS.bufsize,
      '-x264opts', TRANSCODING_SETTINGS.x264opts,
      '-ac', TRANSCODING_SETTINGS.audioChannels,
      '-b:a', TRANSCODING_SETTINGS.audioBitrate,
    ],
  };

  // Map first video stream by default
  config.outputOptions.push('-map', '0:v:0');

  // Handle audio tracks
  if (audioTrack !== undefined) {
    config.outputOptions.push('-map', `0:a:${audioTrack}`);
  } else {
    config.outputOptions.push('-map', '0:a?'); // '?' suppresses error if no audio
  }

  return config;
}

app.get('/api/videos/stream/*', async (req, res) => {
  const videoPath = req.params[0];
  const fullPath = join(VIDEO_ROOT_PATH, videoPath);
  const audioTrack = req.query.audio !== undefined ? parseInt(req.query.audio, 10) : undefined;
  const subtitleTrack = req.query.subtitle !== undefined ? parseInt(req.query.subtitle, 10) : undefined;

  cleanupTranscoder(videoPath);

  try {
    await checkFFmpegCapabilities();

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const requiresTranscoding = needsTranscoding(fullPath);

    if (!requiresTranscoding) {
      // For web-compatible formats, stream directly with range support
      const stat = fs.statSync(fullPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(fullPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(fullPath).pipe(res);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Transfer-Encoding': 'chunked'
      });

      const streamConfig = getStreamConfig(audioTrack, subtitleTrack);
      let transcoder = ffmpeg(fullPath)
        .format('mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(streamConfig.outputOptions);

      // Handle subtitles with correct filter syntax
      if (subtitleTrack !== undefined) {
        transcoder = transcoder.videoFilters({
          filter: 'subtitles',
          options: {
            filename: fullPath,
            si: subtitleTrack  // Changed from stream_index to si
          }
        });
      }

      // Store the transcoder instance
      activeTranscoders.set(videoPath, transcoder);

      // Clean up on request close
      req.on('close', () => {
        cleanupTranscoder(videoPath);
      });

      transcoder
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command:', commandLine);
        })
        .on('error', (err) => {
          console.error('Transcoding error:', err);
          cleanupTranscoder(videoPath);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Transcoding failed',
              details: err.message,
              solution: 'Please ensure FFmpeg is installed with libx264 and aac codecs. On Ubuntu/Debian, run: sudo apt install ffmpeg'
            });
          }
        })
        .on('end', () => {
          cleanupTranscoder(videoPath);
          res.end();
        });

      // Stream directly to response
      transcoder.pipe(res, { end: true });
    }
  } catch (error) {
    console.error('Streaming error:', error);
    cleanupTranscoder(videoPath);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to stream video',
        details: error.message,
        solution: 'Please install FFmpeg with required codecs. On Ubuntu/Debian, run: sudo apt install ffmpeg'
      });
    }
  }
});

app.listen(port, async () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Serving videos from: ${VIDEO_ROOT_PATH}`);
  
  try {
    await checkFFmpegCapabilities();
    console.log('FFmpeg is properly installed with required codecs');
  } catch (error) {
    console.error('FFmpeg check failed:', error.message);
    console.error('Please install FFmpeg with required codecs. On Ubuntu/Debian, run: sudo apt install ffmpeg');
  }
});