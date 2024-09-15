
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const { YTMusic } = require('ytmusic');
const YoutubeMusicApi = require('youtube-music-api');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Auth0 middleware
const authCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const playlistSchema = new mongoose.Schema({
  name: String,
  userId: String,
  tracks: [{
    id: String,
    title: String,
    artist: String,
    album: String,
    image: String,
    service: String
  }]
});

const Playlist = mongoose.model('Playlist', playlistSchema);

// YouTube Music search route
app.get('/api/search/youtube-music', async (req, res) => {
  try {
    const { query } = req.query;
    console.log('Searching YouTube Music for:', query);
    const api = new YoutubeMusicApi();
    await api.initalize();
    
    // Search for both songs and videos
    const songResults = await api.search(query, "song");
    const videoResults = await api.search(query, "video");
    
    // Combine and process results
    const combinedResults = [...songResults.content, ...videoResults.content];
    
    const formattedResults = await Promise.all(combinedResults.map(async item => {
      // Construct high-resolution image URL
      const highResImageUrl = `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`;
      
      // Fallback to medium resolution if maxresdefault is not available
      const mediumResImageUrl = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

      // Check if high-res image exists, if not use medium-res
      let imageUrl;
      try {
        await axios.head(highResImageUrl);
        imageUrl = highResImageUrl;
      } catch (error) {
        imageUrl = mediumResImageUrl;
      }

      return {
        id: item.videoId,
        name: item.name,
        artist: item.artist ? item.artist.name : (item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist'),
        album: item.album ? item.album.name : '',
        image: imageUrl,
        type: item.resultType === 'song' ? 'track' : 'video',
        service: 'youtube',
        duration: item.duration
      };
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching YouTube Music:', error);
    res.status(500).json({ error: 'An error occurred while searching YouTube Music', details: error.message });
  }
});

// Existing routes
app.post('/api/playlists', authCheck, async (req, res) => {
  try {
    const { name, tracks } = req.body;
    const userId = req.user.sub;
    const playlist = new Playlist({ name, userId, tracks });
    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/playlists', authCheck, async (req, res) => {
  try {
    const userId = req.user.sub;
    const playlists = await Playlist.find({ userId });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/playlists/:id', authCheck, async (req, res) => {
  try {
    const userId = req.user.sub;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/playlists/:id', authCheck, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, tracks } = req.body;
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, userId },
      { name, tracks },
      { new: true }
    );
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/playlists/:id', authCheck, async (req, res) => {
  try {
    const userId = req.user.sub;
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/playlists/:id/tracks', authCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const { track } = req.body;
    const userId = req.user.sub;

    const playlist = await Playlist.findOne({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (!track) {
      return res.status(400).json({ message: 'Invalid track data: track is null or undefined' });
    }

    if (!track.id) {
      return res.status(400).json({ message: 'Invalid track data: track.id is missing' });
    }

    const trackExists = playlist.tracks.some(t => t && t.id === track.id);
    if (!trackExists) {
      const essentialTrackInfo = {
        id: track.id,
        title: track.name,
        artist: track.artist,
        album: track.album,
        image: track.image,
        service: track.service
      };
      playlist.tracks.push(essentialTrackInfo);
      await playlist.save();
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    res.status(400).json({ message: error.message, stack: error.stack });
  }
});

app.delete('/api/playlists/:id/tracks/:trackId', authCheck, async (req, res) => {
  try {
    const userId = req.user.sub;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    playlist.tracks = playlist.tracks.filter(track => track.id !== req.params.trackId);
    await playlist.save();
    res.status(200).json(playlist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
