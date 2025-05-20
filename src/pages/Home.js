import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();

  // Channel credentials - these should come from environment variables
  const CHANNEL_ID = process.env.REACT_APP_VIDEONEST_CHANNEL_ID;
  const CHANNEL_ID_INT = parseInt(CHANNEL_ID, 10);
  const API_KEY = process.env.REACT_APP_VIDEONEST_API_KEY;

  // Create VideonestConfig object with channelId and apiKey
  const getVideonestConfig = () => {
    return {
      channelId: CHANNEL_ID_INT,
      apiKey: API_KEY
    };
  };

  const navigateToUpload = () => {
    navigate('/upload', { state: { config: getVideonestConfig() } });
  };

  const navigateToVideos = () => {
    navigate('/videos', { state: { config: getVideonestConfig() } });
  };

  return (
    <div className="home-container">
      <h1>Videonest SDK Tester </h1>
      
      <section className="auth-section">
        <h2>Step 1: Ready to Use Videonest SDK</h2>
        <p className="status success">
          SDK configured with Channel ID: {CHANNEL_ID}
        </p>
      </section>

      <section className="options-section">
        <h2>Step 2: Choose an Option</h2>
        <div className="options-container">
          <div className="option-card">
            <h3>Upload a New Video</h3>
            <p>Upload and process a new video to  Videonest</p>
            <button 
              onClick={navigateToUpload} 
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
