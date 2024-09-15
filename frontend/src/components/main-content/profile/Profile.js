import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserMetadata } from '../../../hooks/useUserMetadata';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Profile.css';

const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Soundcloud'];
const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz', 'R&B', 'Country', 'Folk', 'Metal', 'Indie'];

const DEFAULT_PROFILE_IMAGE = '/images/default-profile.png';

function Profile() {
  const { user } = useAuth0();
  const { userMetadata, updateUserMetadata } = useUserMetadata();
  const [displayName, setDisplayName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [notifications, setNotifications] = useState(false);
  const [bio, setBio] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [profilePicture, setProfilePicture] = useState(DEFAULT_PROFILE_IMAGE);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userMetadata) {
      setDisplayName(userMetadata.displayName || '');
      setSelectedPlatforms(userMetadata.selectedPlatforms || []);
      setSelectedGenres(userMetadata.selectedGenres || []);
      setNotifications(userMetadata.notifications || false);
      setBio(userMetadata.bio || '');
      setFavoriteArtist(userMetadata.favoriteArtist || '');
      setProfilePicture(userMetadata.profilePicture || user.picture || DEFAULT_PROFILE_IMAGE);
    }
  }, [userMetadata, user.picture]);

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

  const handleRemoveProfilePicture = () => {
    setProfilePicture(DEFAULT_PROFILE_IMAGE);
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
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="profile">
      <h2>Your Profile</h2>
      <div className="profile-header">
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            <img src={profilePicture} alt={user.name} className="profile-picture" />
          </div>
          <div className="profile-picture-actions">
            <button onClick={() => fileInputRef.current.click()} className="picture-action-button">
              Change
            </button>
            {profilePicture !== DEFAULT_PROFILE_IMAGE && (
              <button onClick={handleRemoveProfilePicture} className="picture-action-button">
                Remove
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
          </div>
        </div>
        <div className="profile-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="displayName">Display Name:</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="favoriteArtist">Favorite Artist:</label>
          <input
            type="text"
            id="favoriteArtist"
            value={favoriteArtist}
            onChange={(e) => setFavoriteArtist(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Music Platforms:</label>
          <div className="checkbox-group">
            {platforms.map(platform => (
              <label key={platform} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                {platform}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Favorite Genres:</label>
          <div className="checkbox-group">
            {genres.map(genre => (
              <label key={genre} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                />
                {genre}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            Receive email notifications
          </label>
        </div>

        <button type="submit" className="submit-button">Save Changes</button>
      </form>
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default Profile;
