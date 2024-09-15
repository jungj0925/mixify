import React, { useEffect } from 'react';

const SpotifyPlayer = ({ accessToken, setPlayer, setDeviceId }) => {
  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(accessToken); }
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offli ne', device_id);
      });

      player.connect();
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [accessToken, setPlayer, setDeviceId]);

  return null;
};

export default SpotifyPlayer;
