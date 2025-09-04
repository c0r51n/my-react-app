import React, { useState, useEffect } from "react";
import { FaPlay, FaPause, FaForward, FaBackward, FaSearch, FaPlus } from "react-icons/fa";

const clientId = "41d43e5b9f6041beba88ec9cd021c3cd";
const redirectUri = "https://corxify.vercel.app/";
const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
];

function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------- PKCE & Login ----------
  function generateCodeVerifier(length) { /* ... wie vorher ... */ }
  async function generateCodeChallenge(codeVerifier) { /* ... wie vorher ... */ }

  async function login() {
    const codeVerifier = generateCodeVerifier(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    localStorage.setItem("code_verifier", codeVerifier);

    const args = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scopes.join(" "),
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    window.location = "https://accounts.spotify.com/authorize?" + args;
  }

  async function getToken(code) { /* ... wie vorher ... */ }
  async function getProfile() { /* ... wie vorher ... */ }
  async function getCurrentTrack() { /* ... wie vorher ... */ }

  // ---------- Playback ----------
  async function togglePlay() { /* ... wie vorher ... */ }
  async function next() { /* ... wie vorher ... */ }
  async function prev() { /* ... wie vorher ... */ }

  // ---------- Suche ----------
  async function search() { /* ... wie vorher ... */ }

  // ---------- Playlists ----------
  async function getPlaylists() { /* ... wie vorher ... */ }
  async function createPlaylist(name) { /* ... wie vorher ... */ }
  async function addToPlaylist(playlistId, trackUri) { /* ... wie vorher ... */ }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!token && code) getToken(code);
    else {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) setToken(storedToken);
    }
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#191414",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "15px",
        overflow: "hidden", // Kein Scrollen Hauptscreen
      }}
    >
      <h1 style={{ color: "#1DB954", marginBottom: "10px" }}>Spotify Clone</h1>

      {!token ? (
        <button
          onClick={login}
          style={{
            background: "#1DB954",
            border: "none",
            padding: "12px 30px",
            borderRadius: "50px",
            fontSize: "16px",
            color: "white",
            cursor: "pointer",
            marginTop: "50%",
          }}
        >
          Login with Spotify
        </button>
      ) : (
        <>
          {track && (
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <img
                src={track.album.images[0].url}
                alt="album cover"
                style={{ width: "220px", borderRadius: "10px" }}
              />
              <h3 style={{ margin: "10px 0 5px" }}>{track.name}</h3>
              <p style={{ margin: "0 0 10px" }}>
                {track.artists.map((a) => a.name).join(", ")}
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "25px" }}>
                <button onClick={prev} style={btnStyle}>
                  <FaBackward />
                </button>
                <button onClick={togglePlay} style={btnStyle}>
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button onClick={next} style={btnStyle}>
                  <FaForward />
                </button>
              </div>
            </div>
          )}

          {/* Suche */}
          <div style={{ width: "100%", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
              <input
                type="text"
                placeholder="Songs / Künstler / Alben"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "25px",
                  border: "none",
                  outline: "none",
                }}
              />
              <button onClick={search} style={btnStyle}>
                <FaSearch />
              </button>
            </div>
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                padding: "5px",
              }}
            >
              {searchResults.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "5px 0",
                    borderBottom: "1px solid #333",
                  }}
                >
                  {s.name} – {s.artists.map((a) => a.name).join(", ")}
                </div>
              ))}
            </div>
          </div>

          {/* Playlists */}
          <div style={{ marginTop: "15px", width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
              <button onClick={getPlaylists} style={btnStyle}>
                📂 Playlists abrufen
              </button>
              <button
                onClick={() => createPlaylist("Neue Playlist")}
                style={btnStyle}
              >
                <FaPlus /> Neue Playlist
              </button>
            </div>
            <div
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                padding: "5px",
                borderTop: "1px solid #333",
              }}
            >
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 0",
                    borderBottom: "1px solid #333",
                  }}
                >
                  {pl.name}
                  {track && (
                    <button
                      style={btnStyleSmall}
                      onClick={() => addToPlaylist(pl.id, track.uri)}
                    >
                      <FaPlus />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Button Styles ----------------
const btnStyle = {
  background: "#1DB954",
  border: "none",
  borderRadius: "50px",
  padding: "10px 15px",
  color: "white",
  cursor: "pointer",
  fontSize: "18px",
};

const btnStyleSmall = {
  ...btnStyle,
  padding: "5px 10px",
  fontSize: "14px",
};

export default App;
