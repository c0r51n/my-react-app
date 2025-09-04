import React, { useState, useEffect } from "react";

const clientId = "41d43e5b9f6041beba88ec9cd021c3cd"; 
const redirectUri = "https://corxify.vercel.app/"; 
const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-collaborative",
  "user-library-modify",
  "user-library-read",
  "user-read-email",
  "user-read-private",
];

function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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
      { headers: { Authorization: "Bearer " + token } }
    );
    if (response.status === 200) {
      const data = await response.json();
      setTrack(data.item);
      setIsPlaying(!data.is_playing ? false : true);
    }
  }

  // ---------- Control Playback ----------
  async function togglePlay() {
    if (isPlaying) {
      await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
      });
      setIsPlaying(false);
    } else {
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
      });
      setIsPlaying(true);
    }
  }

  async function next() {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
    getCurrentTrack();
  }

  async function prev() {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
    getCurrentTrack();
  }

  // ---------- Search ----------
  async function search() {
    if (!searchQuery) return;
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        searchQuery
      )}&type=track,artist,album&limit=5`,
      { headers: { Authorization: "Bearer " + token } }
    );
    const data = await response.json();
    setSearchResults(data.tracks ? data.tracks.items : []);
  }

  // ---------- Playlists ----------
  async function getPlaylists() {
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setPlaylists(data.items);
  }

  async function createPlaylist(name) {
    if (!profile) return;
    const response = await fetch(
      `https://api.spotify.com/v1/users/${profile.id}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, public: false }),
      }
    );
    const data = await response.json();
    setPlaylists([...playlists, data]);
  }

  async function addToPlaylist(playlistId, trackUri) {
    await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      }
    );
    alert("Track hinzugefügt!");
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
        background: "linear-gradient(135deg, #000000, #191414)",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#1db954" }}>🎵 Spotify Controller</h1>

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
            marginTop: "20px",
          }}
        >
          Login with Spotify
        </button>
      ) : (
        <>
          {profile && (
            <div>
              <h2>Hallo {profile.display_name}</h2>
              <p>{profile.email}</p>
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
              <div style={{ marginTop: "10px" }}>
                <button onClick={prev}>⏮</button>
                <button onClick={togglePlay}>
                  {isPlaying ? "⏸" : "▶️"}
                </button>
                <button onClick={next}>⏭</button>
              </div>
              <button
                style={{
                  background: "#1db954",
                  marginTop: "10px",
                  border: "none",
                  borderRadius: "15px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: "white",
                }}
                onClick={() =>
                  playlists.length > 0 &&
                  addToPlaylist(playlists[0].id, track.uri)
                }
              >
                ➕ In Playlist speichern
              </button>
            </div>
          )}

          {/* Suche */}
          <div style={{ marginTop: "20px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Song/Artist/Album suchen..."
              style={{
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #333",
                width: "60%",
                marginRight: "10px",
              }}
            />
            <button onClick={search} style={{ background: "#1db954" }}>
              🔍
            </button>
            <div>
              {searchResults.map((s) => (
                <div key={s.id} style={{ marginTop: "10px" }}>
                  {s.name} – {s.artists.map((a) => a.name).join(", ")}
                </div>
              ))}
            </div>
          </div>

          {/* Playlists */}
          <div style={{ marginTop: "30px" }}>
            <button
              onClick={getPlaylists}
              style={{ background: "#1db954", marginRight: "10px" }}
            >
              📂 Playlists abrufen
            </button>
            <button
              onClick={() => createPlaylist("Neue Playlist")}
              style={{ background: "#1db954" }}
            >
              ➕ Neue Playlist
            </button>

            {playlists.length > 0 && (
              <ul>
                {playlists.map((pl) => (
                  <li key={pl.id}>{pl.name}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
