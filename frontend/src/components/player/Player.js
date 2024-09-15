import React from 'react';
import './Player.css';

function Player({ track }) {
  return (
    <div className="player">
      <div className="player-content">
        {track ? (
          <>
            <p className="track-title">{track.title}</p>
            <p className="track-artist">{track.artist}</p>
            <div className="player-controls">
              <button className="player-button">⏯️ Play</button>
              <button className="player-button">⏸️ Pause</button>
              <button className="player-button">⏭️ Next</button>
            </div>
          </>
        ) : (
          <p className="player-message">No track currently playing</p>
        )}
      </div>
    </div>
  );
}

export default Player;
