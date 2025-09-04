import React, { useState, useEffect } from "react";

const clientId = "41d43e5b9f6041beba88ec9cd021c3cd"; // von Spotify Dashboard
const redirectUri = "https://my-react-app-67rd.vercel.app/"; // oder Codesandbox-URL
const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [track, setTrack] = useState(null);

  // ---------- PKCE Helper ----------
  function generateCodeVerifier(length) {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier)
    );
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // ---------- Login ----------
  async function login() {
    const codeVerifier = generateCodeVerifier(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("code_verifier", codeVerifier);

    const state = "spotify_auth_state";
    const scope = scopes.join(" ");

    const args = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

    window.location = "https://accounts.spotify.com/authorize?" + args;
  }

  // ---------- Get Token ----------
  async function getToken(code) {
    const codeVerifier = localStorage.getItem("code_verifier");

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body,
    });

    const data = await response.json();
    if (data.access_token) {
      setToken(data.access_token);
      localStorage.setItem("access_token", data.access_token);
    }
  }

  // ---------- Fetch Profile ----------
  async function getProfile() {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setProfile(data);
  }

  // ---------- Fetch Current Track ----------
  async function getCurrentTrack() {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    if (response.status === 200) {
      const data = await response.json();
      setTrack(data.item);
    }
  }

  // ---------- Control Playback ----------
  async function play() {
    await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token },
    });
  }

  async function pause() {
    await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token },
    });
  }

  async function next() {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
  }

  async function prev() {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
  }

  // ---------- Init ----------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!token && code) {
      getToken(code);
    } else {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) setToken(storedToken);
    }
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "linear-gradient(135deg, #1db954, #191414)",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      <h1>🎵 Spotify Controller</h1>

      {!token ? (
        <button
          onClick={login}
          style={{
            background: "#1db954",
            border: "none",
            padding: "12px 20px",
            borderRadius: "25px",
            fontSize: "16px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Login with Spotify
        </button>
      ) : (
        <>
          <button onClick={getProfile}>Get Profile</button>
          <button onClick={getCurrentTrack}>Get Current Track</button>
          <div style={{ marginTop: "20px" }}>
            <button onClick={play}>▶️ Play</button>
            <button onClick={pause}>⏸ Pause</button>
            <button onClick={prev}>⏮ Previous</button>
            <button onClick={next}>⏭ Next</button>
          </div>

          {profile && (
            <div style={{ marginTop: "20px" }}>
              <h2>Hallo {profile.display_name}</h2>
              <p>Email: {profile.email}</p>
            </div>
          )}

          {track && (
            <div style={{ marginTop: "20px" }}>
              <h3>Gerade läuft:</h3>
              <p>
                {track.name} – {track.artists.map((a) => a.name).join(", ")}
              </p>
              <img
                src={track.album.images[0].url}
                alt="album cover"
                style={{ width: "200px", borderRadius: "10px" }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
