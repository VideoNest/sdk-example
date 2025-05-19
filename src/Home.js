import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authVideonest } from 'videonest-sdk';
import './Home.css';

function Home() {
  const [authStatus, setAuthStatus] = useState({ 
    authenticated: false, 
    message: '', 
    loading: false 
  });
  const navigate = useNavigate();

  // Channel credentials - these should come from environment variables
  const CHANNEL_ID = process.env.REACT_APP_VIDEONEST_CHANNEL_ID;
  const CHANNEL_ID_INT = parseInt(CHANNEL_ID, 10);
  const API_KEY = process.env.REACT_APP_VIDEONEST_API_KEY;

  const handleAuth = async () => {
    try {
      setAuthStatus({ authenticated: false, message: 'Authenticating...', loading: true });
      
      const authResult = await authVideonest(CHANNEL_ID_INT, API_KEY);
      
      if (authResult.success) {
        setAuthStatus({ 
          authenticated: true, 
          message: 'Authentication successful!',
          loading: false
        });
      } else {
        setAuthStatus({ 
          authenticated: false, 
          message: `Authentication failed: ${authResult.message || 'Unknown error'}`,
          loading: false
        });
      }
    } catch (error) {
      setAuthStatus({ 
        authenticated: false, 
        message: `Authentication error: ${error.message}`,
        loading: false
      });
    }
  };

  const navigateToUpload = () => {
    navigate('/upload');
  };

  const navigateToVideos = () => {
    navigate('/videos');
  };

  return (
    <div className="home-container">
      <h1>Videonest Demo App</h1>
      
      <section className="auth-section">
        <h2>Step 1: Authenticate with Videonest</h2>
        <button 
          onClick={handleAuth} 
          className="auth-button"
          disabled={authStatus.loading}
        >
          {authStatus.loading ? 'Authenticating...' : 'Authenticate'}
        </button>
        <p className={`status ${authStatus.authenticated ? 'success' : authStatus.message ? 'error' : ''}`}>
          {authStatus.message}
        </p>
      </section>

      <section className="options-section">
        <h2>Step 2: Choose an Option</h2>
        <div className="options-container">
          <div className="option-card">
            <h3>Upload a New Video</h3>
            <p>Upload and process a new video to your Videonest account</p>
            <button 
              onClick={navigateToUpload} 
              disabled={!authStatus.authenticated}
              className="option-button"
            >
              Upload Video
            </button>
          </div>
          
          <div className="option-card">
            <h3>See Your Videos</h3>
            <p>View and preview all your existing videos</p>
            <button 
              onClick={navigateToVideos} 
              disabled={!authStatus.authenticated}
              className="option-button"
            >
              View Videos
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
