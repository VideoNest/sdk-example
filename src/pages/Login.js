import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [channelId, setChannelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedAuth = localStorage.getItem('videonestAuth');
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (auth.channelId && auth.apiKey) {
          navigate('/');
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('videonestAuth');
      }
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!channelId || !apiKey) {
      setError('Both Channel ID and API Key are required');
      return;
    }

    // Validate that channel ID is a number
    const channelIdInt = parseInt(channelId, 10);
    if (isNaN(channelIdInt)) {
      setError('Channel ID must be a valid number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store authentication in localStorage
      localStorage.setItem('videonestAuth', JSON.stringify({
        channelId: channelIdInt,
        apiKey
      }));

      // Navigate to home
      navigate('/');
    } catch (e) {
      setError('Failed to save authentication data');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/VideonestLogo.svg" alt="Videonest Logo" />
        </div>
        
        <h1>Login to Videonest SDK</h1>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="channel-id">Channel ID</label>
            <input
              id="channel-id"
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Enter your Channel ID"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="api-key">API Key</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="login-note">
          Don't have a Videonest account? Please sign up on the Videonest website.
        </p>
      </div>
    </div>
  );
}

export default Login;
