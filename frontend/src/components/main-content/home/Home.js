import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaMusic, FaUser, FaPlus } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserMetadata } from '../../../hooks/useUserMetadata';
import axios from 'axios';
import './Home.css';

function Home() {
  const { user, getAccessTokenSilently } = useAuth0();
  const { userMetadata } = useUserMetadata();
  const [userPlaylists, setUserPlaylists] = useState([]);
  const navigate = useNavigate();

  const displayName = userMetadata?.displayName || user?.name || 'there';

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/playlists`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserPlaylists(response.data);
      } catch (error) {
        console.error('Error fetching user playlists:', error);
      }
    };

    fetchUserPlaylists();
  }, [getAccessTokenSilently]);

  const handlePlaylistClick = (playlist) => {
    navigate(`/library/${playlist._id}`);
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1>Welcome back, {displayName}!</h1>
        <p className="tagline">Your personalized music experience awaits.</p>
      </header>

      <section className="quick-actions">
        <Link to="/search" className="action-card">
          <FaSearch />
          <span>Search</span>
        </Link>
        <Link to="/library" className="action-card">
          <FaMusic />
          <span>Your Library</span>
        </Link>
        <Link to="/profile" className="action-card">
          <FaUser />
          <span>Profile</span>
        </Link>
      </section>

      <section className="recent-playlists">
        <h2>Your Playlists</h2>
        <div className="playlist-grid">
          {userPlaylists.map(playlist => (
            <div key={playlist._id} className="playlist-card" onClick={() => handlePlaylistClick(playlist)}>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.tracks ? playlist.tracks.length : 0} tracks</p>
              </div>
            </div>
          ))}
          <Link to="/library" className="create-playlist-card">
            <FaPlus />
            <span>Create New Playlist</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
