import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './Library.css';

function Library() {
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const { getAccessTokenSilently } = useAuth0();
  const [error, setError] = useState('');
  const { playlistId } = useParams();

  // Import PlaylistView here
  const PlaylistView = React.lazy(() => import('./PlaylistView'));

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist(playlistId);
    } else {
      fetchPlaylists();
    }
  }, [playlistId]);

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

  const fetchPlaylist = async (id) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/playlists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedPlaylist(response.data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPlaylistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${process.env.REACT_APP_API_URL}/api/playlists`, {
        name: newPlaylistName.trim(),
        tracks: []
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNewPlaylistName('');
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist. Please try again.');
    }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const startEditingPlaylist = (e, playlist) => {
    e.stopPropagation();
    setEditingPlaylist({ ...playlist, newName: playlist.name });
  };

  const updatePlaylist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = await getAccessTokenSilently();
      await axios.put(`${process.env.REACT_APP_API_URL}/api/playlists/${editingPlaylist._id}`, {
        name: editingPlaylist.newName,
        tracks: editingPlaylist.tracks
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEditingPlaylist(null);
      fetchPlaylists();
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingPlaylist(null);
  };

  const handlePlaylistClick = (playlist) => {
    if (!editingPlaylist) {
      setSelectedPlaylist(playlist);
    }
  };

  const handleBackToLibrary = () => {
    setSelectedPlaylist(null);
  };

  const handlePlayTrack = (track) => {
    // Implement your play logic here
    setCurrentlyPlaying(track);
  };

  const handlePlaylistUpdate = (updatedPlaylist) => {
    setPlaylists(playlists.map(p => p._id === updatedPlaylist._id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
  };

  if (selectedPlaylist) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <PlaylistView 
          playlist={selectedPlaylist} 
          onBack={() => {
            setSelectedPlaylist(null);
            window.history.pushState(null, '', '/library');
          }}
          onPlayTrack={handlePlayTrack}
          currentlyPlaying={currentlyPlaying}
          onPlaylistUpdate={handlePlaylistUpdate}
        />
      </Suspense>
    );
  }

  return (
    <div className="library">
      <h2>Your Library</h2>
      <div className="playlist-creator">
        <h3>Create New Playlist</h3>
        <form onSubmit={createPlaylist} className="search-inputs">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name"
            className="search-input"
          />
          <button type="submit" className="search-button">Create Playlist</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
      <div className="playlists">
        <h3>Your Playlists</h3>
        {playlists.length === 0 ? (
          <p>You don't have any playlists yet. Create one to get started!</p>
        ) : (
          <ul>
            {playlists.map(playlist => (
              <li 
                key={playlist._id} 
                onClick={() => handlePlaylistClick(playlist)}
                className={editingPlaylist && editingPlaylist._id === playlist._id ? 'editing' : ''}
              >
                {editingPlaylist && editingPlaylist._id === playlist._id ? (
                  <form onSubmit={updatePlaylist} className="edit-form" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingPlaylist.newName}
                      onChange={(e) => setEditingPlaylist({...editingPlaylist, newName: e.target.value})}
                      className="search-input"
                    />
                    <div className="button-group">
                      <button type="submit" className="search-button">Save</button>
                      <button type="button" onClick={cancelEditing} className="cancel-button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="playlist-info">
                      <span className="playlist-name">{playlist.name}</span>
                      <span className="track-count">{playlist.tracks.length} tracks</span>
                    </div>
                    <div className="button-group">
                      <button onClick={(e) => startEditingPlaylist(e, playlist)} className="edit-button">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist._id); }} className="delete-button">
                        <FaTrash />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Library;
