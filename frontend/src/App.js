import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import Sidebar from './components/sidebar/Sidebar';
import MainContent from './components/main-content/MainContent';
import Player from './components/player/Player';

function App() {
  const [playingTrack, setPlayingTrack] = useState(null); // Store the current track info

  return (
    <Router>
      <div className="app">
        <Sidebar />
        <MainContent setPlayingTrack={setPlayingTrack} /> {/* Pass the setPlayingTrack function */}
        <Player playingTrack={playingTrack} /> {/* Pass the playing track to the Player */}
      </div>
    </Router>
  );
}

export default App;
