import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserMetadata } from '../../../hooks/useUserMetadata';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AccountSetup.css'; // Create this file in the same directory

// Import the default image
const defaultProfileImage = '/images/default-profile.png'; // Adjust the path as needed

const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Soundcloud'];
const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz', 'R&B', 'Country', 'Folk', 'Metal', 'Indie'];

function AccountSetup({ onSetupComplete }) {
  const { user } = useAuth0();
  const { updateUserMetadata } = useUserMetadata();
  const [displayName, setDisplayName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [notifications, setNotifications] = useState(false);
  const [bio, setBio] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [profilePicture, setProfilePicture] = useState(defaultProfileImage);
  const fileInputRef = useRef(null);

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserMetadata({
        displayName,
        selectedPlatforms,
        selectedGenres,
        notifications,
        bio,
        favoriteArtist,
        profilePicture,
        setupComplete: true,
      });
      toast.success('Account setup completed successfully!');
      onSetupComplete();
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup. Please try again.');
    }
  };

  return (
    <div className="account-setup">
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="setup-form">
        <div className="setup-section">
          <h3>Profile Picture:</h3>
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <img src={profilePicture} alt="Profile" className="profile-picture" />
            </div>
            <button 
              type="button" 
              className="change-picture-button"
              onClick={() => fileInputRef.current.click()}
            >
              Change Picture
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </div>
        </div>

        <div className="setup-section">
          <h3>Choose a display name:</h3>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="display-name-input"
            required
          />
        </div>

        <div className="setup-section">
          <h3>Select your music platforms:</h3>
          <div className="option-grid">
            {platforms.map(platform => (
              <label key={platform} className="option-item">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h3>Select your favorite genres:</h3>
          <div className="option-grid">
            {genres.map(genre => (
              <label key={genre} className="option-item">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                />
                <span>{genre}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h3>Bio:</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="bio-input"
            required
          />
        </div>

        <div className="setup-section">
          <h3>Favorite Artist:</h3>
          <input
            type="text"
            value={favoriteArtist}
            onChange={(e) => setFavoriteArtist(e.target.value)}
            placeholder="Enter your favorite artist"
            className="favorite-artist-input"
            required
          />
        </div>

        <div className="setup-section">
          <h3>Notification preferences:</h3>
          <label className="option-item">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            <span>Receive email notifications</span>
          </label>
        </div>

        <button type="submit" className="submit-button">Complete Setup</button>
      </form>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default AccountSetup;
