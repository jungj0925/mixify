import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaPlay, FaPause, FaStepBackward, FaStepForward, FaMusic, FaTrash, FaSpotify, FaApple, FaYoutube, FaSoundcloud, FaPlus, FaRandom, FaRedo } from 'react-icons/fa'; // Added FaRandom and FaRedo for shuffle and repeat icons
import { SiYoutubemusic } from 'react-icons/si';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './PlaylistView.css';

function PlaylistView({ playlist, onBack, onPlaylistUpdate }) {
  const [tracks, setTracks] = useState(playlist.tracks.filter(track => track !== null));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false); // Shuffle state
  const [isRepeat, setIsRepeat] = useState(false);   // Repeat state
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentTrackIndex !== null) {
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  const playTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle); // Toggle shuffle mode
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat); // Toggle repeat mode
  };

  const playNextTrack = () => {
    if (currentTrackIndex !== null) {
      if (isShuffle) {
        // Shuffle mode: Play a random track
        const randomIndex = Math.floor(Math.random() * tracks.length);
        playTrack(randomIndex);
      } else if (isRepeat) {
        // Repeat mode: Play the current track again
        playTrack(currentTrackIndex);
      } else if (currentTrackIndex < tracks.length - 1) {
        // Normal play: Move to the next track
        playTrack(currentTrackIndex + 1);
      } else if (currentTrackIndex === tracks.length - 1 && isRepeat) {
        // If at the last track and repeat is on, loop to the first track
        playTrack(0);
      }
    }
  };

  const playPreviousTrack = () => {
    if (currentTrackIndex !== null) {
      if (isShuffle) {
        // Shuffle mode: Play a random track
        const randomIndex = Math.floor(Math.random() * tracks.length);
        playTrack(randomIndex);
      } else if (isRepeat) {
        // Repeat mode: Play the current track again
        playTrack(currentTrackIndex);
      } else if (currentTrackIndex > 0) {
        // Normal play: Move to the previous track
        playTrack(currentTrackIndex - 1);
      }
    }
  };

  const deleteTrack = async (trackId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/playlists/${playlist._id}/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const updatedTracks = tracks.filter(track => track.id !== trackId);
      setTracks(updatedTracks);
      if (onPlaylistUpdate) {
        onPlaylistUpdate({ ...playlist, tracks: updatedTracks });
      }
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const navigateToSearch = () => {
    navigate('/search');
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  return (
    <div className="playlist-view">
      <button className="back-button" onClick={onBack}>
        <FaArrowLeft /> Back to Library
      </button>
      <h2>{playlist.name}</h2>
      <p>{tracks.length} tracks</p>
      <button className="add-song-button" onClick={navigateToSearch}>
        <FaPlus /> Add a Song
      </button>
      
      {/* Player Controls */}
      <div className="player-controls">
        {currentTrack && (
          <div className="now-playing">
            <div className="now-playing-info">
              {currentTrack.image && (
                <img
                  src={currentTrack.image}
                  alt={currentTrack.album || 'Album Cover'}
                  className="now-playing-image"
                />
              )}
              <div className="track-details">
                <p className="track-title">{currentTrack.title || currentTrack.name || 'Unknown Track'}</p>
                <p className="track-artist">{currentTrack.artist || 'Unknown Artist'}</p>
                <p className="track-album">{currentTrack.album || 'Unknown Album'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="controls-wrapper">
          <button onClick={toggleShuffle} className={isShuffle ? 'active' : ''}>
            <FaRandom />
          </button>
          <button onClick={playPreviousTrack} disabled={currentTrackIndex === 0 || currentTrackIndex === null}>
            <FaStepBackward />
          </button>
          <button onClick={togglePlayPause} disabled={currentTrackIndex === null}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={playNextTrack} disabled={currentTrackIndex === tracks.length - 1 || currentTrackIndex === null}>
            <FaStepForward />
          </button>
          <button onClick={toggleRepeat} className={isRepeat ? 'active' : ''}>
            <FaRedo />
          </button>
        </div>
      </div>

      <ul className="track-list">
        {tracks.map((track, index) => {
          if (!track) return null; // Skip null tracks
          return (
            <li key={track?.id || index} className={`track-item ${currentTrackIndex === index ? 'playing' : ''}`}>
              <div className="track-info">
                <span className="track-number">{index + 1}</span>
                {track?.image ? (
                  <img src={track.image} alt={track.album || 'Album'} className="track-image" />
                ) : (
                  <div className="track-image placeholder-image">
                    <FaMusic />
                  </div>
                )}
                <div className="track-details">
                  <div className="track-name-container">
                    <span className="track-name">{track?.title || track?.name || 'Unknown Track'}</span>
                    <span className={`service-icon ${track.service.toLowerCase()}`}>
                      {track.service.toLowerCase() === 'spotify' && <FaSpotify />}
                      {track.service.toLowerCase() === 'apple' && <FaApple />}
                      {track.service.toLowerCase() === 'youtube' && <SiYoutubemusic />}
                      {track.service.toLowerCase() === 'soundcloud' && <FaSoundcloud />}
                    </span>
                  </div>
                  <span className="track-artist">{track?.artist || 'Unknown Artist'}</span>
                </div>
              </div>
              <div className="track-actions">
                <button 
                  className="play-button" 
                  onClick={() => playTrack(index)}
                  disabled={!track}
                >
                  {currentTrackIndex === index && isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button 
                  className="delete-button" 
                  onClick={() => track?.id && deleteTrack(track.id)}
                  disabled={!track || !track.id}
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PlaylistView;
