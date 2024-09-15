import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserMetadata } from '../../hooks/useUserMetadata';
import AccountSetup from './setup/AccountSetup';
import Home from './home/Home';
import Search from './search/Search';
import Library from './library/Library';  // Updated import
import Profile from './profile/Profile';
import './MainContent.css'; // We'll create this CSS file

function MainContent({ setPlayingTrack }) { // Receive setPlayingTrack as a prop
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { userMetadata, updateUserMetadata } = useUserMetadata();
  const [setupComplete, setSetupComplete] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="main-content loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="main-content not-authenticated">
        <div className="auth-message">
          <h2>Welcome to Mixify</h2>
          <p>Please log in to access your personalized music experience.</p>
          <button onClick={() => loginWithRedirect()} className="login-button">
            Log In
          </button>
        </div>
      </div>
    );
  }

  const handleSetupComplete = async () => {
    await updateUserMetadata({ ...userMetadata, setupComplete: true });
    setSetupComplete(true);
    navigate('/');
  };

  if (!userMetadata?.setupComplete && !setupComplete) {
    return <AccountSetup onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search setPlayingTrack={setPlayingTrack} />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:playlistId" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default MainContent;
