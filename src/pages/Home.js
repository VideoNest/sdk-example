import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const [authData, setAuthData] = useState(null);

  // Get authentication data from localStorage
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('videonestAuth');
      if (storedAuth) {
        setAuthData(JSON.parse(storedAuth));
      } else {
        // Redirect to login if no auth data
        navigate('/login');
      }
    } catch (e) {
      console.error('Error retrieving auth data:', e);
      navigate('/login');
    }
  }, [navigate]);

  // Create VideonestConfig object with channelId and apiKey
  const getVideonestConfig = () => {
    return {
      channelId: authData?.channelId,
      apiKey: authData?.apiKey
    };
  };

  const navigateToUpload = () => {
    navigate('/upload');
  };

  const navigateToVideos = () => {
    navigate('/videos');
  };
  
  const handleSignOut = () => {
    localStorage.removeItem('videonestAuth');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Videonest SDK Tester</h1>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
      
      <section className="auth-section">
        <h2>Step 1: Ready to Use Videonest SDK</h2>
        <p className="status success">
          SDK configured with Channel ID: {authData?.channelId}
        </p>
      </section>

      <section className="options-section">
        <h2>Step 2: Choose an Option</h2>
        <div className="options-container">
          <div className="option-card">
            <h3>Upload a New Video</h3>
            <p>Upload and process a new video to Videonest</p>
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
