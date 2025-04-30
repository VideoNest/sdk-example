import React, { useState, useEffect } from 'react';
import { authVideonest, VideonestEmbed, setDebugMode } from 'videonest-sdk';

function TestEmbed() {
  setDebugMode(true);
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    message: '',
    loading: false
  });
  
  // Channel credentials should come from environment variables
  const CHANNEL_ID = process.env.REACT_APP_VIDEONEST_CHANNEL_ID;
  const CHANNEL_ID_INT = parseInt(CHANNEL_ID, 10);
  const API_KEY = process.env.REACT_APP_VIDEONEST_API_KEY;
  
  // The specific video ID we want to embed
  const videoId = 420151;
  
  // Handle authentication on component mount
  useEffect(() => {
    const authenticate = async () => {
      setAuthStatus({
        authenticated: false,
        message: 'Authenticating...',
        loading: true
      });
      
      try {
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
    
    authenticate();
  }, [CHANNEL_ID_INT, API_KEY]);
  
  return (
    <div className="test-embed-container">
      <h1>Video Embed Test</h1>
      
      <div className="auth-status">
        <h2>Authentication Status</h2>
        <p className={authStatus.authenticated ? 'success' : 'error'}>
          {authStatus.message}
        </p>
      </div>
      
      {authStatus.authenticated && (
        <div className="video-container">
          <h2>Video Embed</h2>
          <p>Testing embed for Video ID: {videoId}</p>
          
          <div className="embed-wrapper">
            {/* Very simple embed with minimal props */}
            <VideonestEmbed 
              videoId={videoId}
            />
          </div>
        </div>
      )}
      
      <style jsx>{`
        .test-embed-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        h1, h2 {
          color: #333;
        }
        
        .auth-status {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f8f8f8;
        }
        
        .success {
          color: #4CAF50;
          font-weight: bold;
        }
        
        .error {
          color: #f44336;
          font-weight: bold;
        }
        
        .video-container {
          margin-top: 30px;
        }
        
        .embed-wrapper {
          margin-top: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
          background-color: #000;
        }
      `}</style>
    </div>
  );
}

export default TestEmbed;