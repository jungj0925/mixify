import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import axios from 'axios';
import { FaSpotify, FaPlay, FaPlus } from 'react-icons/fa';
import { SiYoutubemusic } from 'react-icons/si';
import SpotifyPlayer from './SpotifyPlayer';
import './Search.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation, useNavigate } from 'react-router-dom';

const spotifyApi = new SpotifyWebApi();

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
};

function Search() {
  const [query, setQuery] = useState('');
  const [service, setService] = useState('all');
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [] });
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [player, setPlayer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const { getAccessTokenSilently } = useAuth0();
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const playlistId = searchParams.get('playlistId');
    if (playlistId) {
      setCurrentPlaylistId(playlistId);
    }
  }, [location]);

  useEffect(() => {
    const getSpotifyToken = async () => {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(process.env.REACT_APP_SPOTIFY_CLIENT_ID + ':' + process.env.REACT_APP_SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      });
      const data = await response.json();
      setToken(data.access_token);
      spotifyApi.setAccessToken(data.access_token);
    };

    getSpotifyToken();
  }, []);

  const searchSpotify = async (query) => {
    if (!token) {
      console.error('No Spotify token available');
      return { tracks: [], artists: [], albums: [] };
    }
    try {
      const searchResults = await spotifyApi.search(query, ['track', 'artist', 'album']);
      return {
        tracks: searchResults.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          image: track.album.images[0]?.url,
          type: 'track',
          service: 'spotify',
          explicit: track.explicit,
          duration: track.duration_ms
        })),
        artists: searchResults.artists.items.map(artist => ({
          id: artist.id,
          name: artist.name,
          image: artist.images[0]?.url,
          type: 'artist',
          service: 'spotify'
        })),
        albums: searchResults.albums.items.map(album => ({
          id: album.id,
          name: album.name,
          artist: album.artists[0].name,
          image: album.images[0]?.url,
          type: 'album',
          service: 'spotify'
        }))
      };
    } catch (error) {
      console.error('Error searching Spotify:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  };

  const searchYouTubeMusic = async (query) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search/youtube-music`, {
        params: { query }
      });
      return response.data.map(item => ({
        ...item,
        type: 'track'
      }));
    } catch (error) {
      console.error('Error searching YouTube Music:', error);
      return [];
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let spotifyResults = { tracks: [], artists: [], albums: [] };
    let youtubeResults = [];

    if (service === 'all' || service === 'spotify') {
      spotifyResults = await searchSpotify(query);
    }

    if (service === 'all' || service === 'youtube') {
      youtubeResults = await searchYouTubeMusic(query);
    }

    setResults({
      ...spotifyResults,
      tracks: [...spotifyResults.tracks, ...youtubeResults]
    });
    setIsLoading(false);
  };

  const playTrack = async (track) => {
    if (!player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [track.uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await player.pause();
      setIsPlaying(false);
    } else {
      await player.resume();
      setIsPlaying(true);
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: item
    });
  };

  const handleAddToPlaylist = (track) => {
    if (track.type !== 'track') {
      return; // Only allow adding tracks to playlists
    }
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  const addTrackToPlaylist = async (playlistId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${process.env.REACT_APP_API_URL}/api/playlists/${playlistId}/tracks`, {
        track: selectedTrack
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShowPlaylistModal(false);
      setSelectedTrack(null);
    } catch (error) {
      console.error('Error adding track to playlist:', error);
    }
  };


  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/playlists`, {
        name: newPlaylistName
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const newPlaylist = response.data;
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);

      // If a track is selected, add it to the new playlist
      if (selectedTrack) {
        await addTrackToPlaylist(newPlaylist._id);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const renderResultSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="result-section">
        <h3>{title}</h3>
        <div className="result-grid">
          {items.map(item => (
            <div key={item.id} className="result-item">
              <div className="result-image">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/1280x720?text=No+Image';
                  }}
                />
                {item.type === 'track' && (
                  <span className="result-duration">
                    {formatDuration(item.duration)}
                  </span>
                )}
              </div>
              <div className="result-info">
                <div className="result-info-header">
                  <h4>{item.name}</h4>
                  <div className={`service-icon ${item.service.toLowerCase()}`}>
                    {item.service.toLowerCase() === 'spotify' ? <FaSpotify /> : <SiYoutubemusic />}
                  </div>
                </div>
                <p>{item.artist}</p>
                {item.album && <p>{item.album}</p>}
              </div>
              <div className="result-meta">
                {/* <button onClick={() => playTrack(item)} className="play-button">
                  <FaPlay /> Play
                </button> */}
              {item.type === 'track' && (
                <button onClick={() => handleAddToPlaylist(item)} className="add-to-playlist-button">
                  <FaPlus /> Add to Playlist
                </button>
              )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/playlists`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  return (
    <div className="search">
      <h2>Search</h2>
      {currentPlaylistId && <p>Adding songs to playlist</p>}
      <form onSubmit={handleSearch}>
        <div className="search-inputs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, artists, or albums"
            className="search-input"
          />
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="service-select"
          >
            <option value="all">All Services</option>
            <option value="spotify">Spotify</option>
            <option value="youtube">YouTube Music</option>
          </select>
          <button type="submit" className="search-button">Search</button>
        </div>
      </form>
      <p>Current service: {service}</p>
      {isLoading && <p>Loading...</p>}
      {!isLoading && (
        <div className="search-results">
          {renderResultSection('Tracks and Videos', results.tracks)}
          {renderResultSection('Artists', results.artists)}
          {renderResultSection('Albums', results.albums)}
        </div>
      )}
      <SpotifyPlayer 
        accessToken={accessToken} 
        setPlayer={setPlayer} 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
      />
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => addTrackToPlaylist(contextMenu.item)}>
            <FaPlus /> Add to Playlist
          </button>
        </div>
      )}
      {showPlaylistModal && (
        <div className="playlist-modal-overlay">
          <div className="playlist-modal">
            <h3>Add to Playlist</h3>
            {isCreatingPlaylist ? (
              <>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="new-playlist-input"
                />
                <div className="playlist-modal-buttons">
                  <button onClick={handleCreatePlaylist} className="create-playlist-button">Create & Add</button>
                  <button onClick={() => setIsCreatingPlaylist(false)} className="cancel-button">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <ul>
                  {playlists.map(playlist => (
                    <li key={playlist._id} onClick={() => addTrackToPlaylist(playlist._id)}>
                      {playlist.name}
                    </li>
                  ))}
                </ul>
                <div className="playlist-modal-buttons">
                  <button onClick={() => setIsCreatingPlaylist(true)} className="create-playlist-button">New Playlist</button>
                  <button onClick={() => setShowPlaylistModal(false)} className="cancel-button">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;