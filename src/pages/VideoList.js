import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listVideos, VideonestEmbed } from 'videonest-sdk';
import '../styles/VideoList.css';

function VideoList() {
  const navigate = useNavigate();
  const [videosList, setVideosList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Get authentication from localStorage
  const [videonestConfig, setVideonestConfig] = useState(null);
  
  // Load authentication on component mount
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('videonestAuth');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        // Ensure config exactly matches SDK expectations
        const config = {
          channelId: parsedAuth.channelId,
          apiKey: parsedAuth.apiKey
        };
        console.log("Setting config:", config);
        setVideonestConfig(config);
      } else {
        navigate('/login');
      }
    } catch (e) {
      console.error('Error retrieving auth data:', e);
      navigate('/login');
    }
  }, [navigate]);
  
  // Embed customization options
  const [embedOptions, setEmbedOptions] = useState({
    primaryColor: '#FE4800', // Orange theme
    darkMode: false,
    showTitle: true,
    showDescription: true
  });

  // Load videos on component mount if we have config
  useEffect(() => {
    if (videonestConfig) {
      loadVideos();
    } else {
      setError('Missing configuration. Please return to home.');
    }
  }, [videonestConfig]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Only attempt to load videos if we have config
      console.log("loading videos with videonest config ", videonestConfig);
      if (videonestConfig) {
        const result = await listVideos(videonestConfig);
        
        if (result.success) {
          setVideosList(result.videos || []);
          
          // If there are videos, select the first one by default
          if (result.videos && result.videos.length > 0) {
            setSelectedVideo(result.videos[0]);
          }
        } else {
          setError(result.message || 'Failed to load videos');
        }
      } else {
        setError('Not authenticated. Please authenticate first.');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while loading videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
  };

  const handleOptionChange = (option, value) => {
    setEmbedOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleColorChange = (e) => {
    setEmbedOptions(prev => ({
      ...prev,
      primaryColor: e.target.value
    }));
  };

  const navigateToHome = () => {
    navigate('/');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`videos-list-container ${embedOptions.darkMode ? 'dark-mode' : ''}`} style={{"--primary-color": "#FE4800"}}>
      <h1>Your Videos</h1>
      
      <div className="button-container top-buttons">
        <button onClick={navigateToHome} className="secondary-button">
          Back to Home
        </button>
        <button onClick={loadVideos} className="primary-button" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Videos'}
        </button>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="videos-content">
        {/* Video Embed Section - Moved Above the Fold */}
        <div className="video-preview-panel">
          {selectedVideo ? (
            <>
          
                <h3 style = {{marginBottom: '20px'}}>Video Preview</h3>
                <div className="responsive-embed-container  video-embed-wrapper">
                  <VideonestEmbed 
                    videoId={selectedVideo.id} 
                    style={{
                      width: '100%',
                      height: '100%',
                      primaryColor: embedOptions.primaryColor,
                      darkMode: embedOptions.darkMode,
                      showTitle: embedOptions.showTitle,
                      showDescription: embedOptions.showDescription
                    }}
                    config={videonestConfig}
                  />
                   </div>
      
     

              
              <div className="embed-options">
                <h3>Customize Embed</h3>
                
                <div className="option-group">
                  <label>Primary Color:</label>
                  <div className="color-picker-container">
                    <input 
                      type="color" 
                      value={embedOptions.primaryColor}
                      onChange={handleColorChange}
                    />
                    <span className="color-hex">{embedOptions.primaryColor}</span>
                  </div>
                </div>
                
                <div className="option-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={embedOptions.darkMode}
                      onChange={(e) => handleOptionChange('darkMode', e.target.checked)}
                    />
                    Dark Mode
                  </label>
                </div>
                
            
                
                <div className="option-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={embedOptions.showTitle}
                      onChange={(e) => handleOptionChange('showTitle', e.target.checked)}
                    />
                    Show Title
                  </label>
                </div>
                
                <div className="option-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={embedOptions.showDescription}
                      onChange={(e) => handleOptionChange('showDescription', e.target.checked)}
                    />
                    Show Description
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="no-video-selected">
              <p>Select a video from the list to preview</p>
            </div>
          )}
        </div>

        {/* Videos Table - Moved Below the Embed */}
        <div className="videos-table-container">
          <h3>All Videos</h3>
          {loading ? (
            <p className="loading-message">Loading videos...</p>
          ) : videosList.length === 0 ? (
            <p className="empty-message">No videos found.</p>
          ) : (
            <table className="videos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thumbnail</th>
                  <th>Title</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {videosList.map(video => (
                  <tr 
                    key={video.id} 
                    className={selectedVideo && selectedVideo.id === video.id ? 'selected' : ''}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <td>{video.id}</td>
                    <td>
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title || 'Video thumbnail'} 
                          className="thumbnail"
                        />
                      ) : (
                        <div className="no-thumbnail">No Thumbnail</div>
                      )}
                    </td>
                    <td>{video.title || 'Untitled'}</td>
                    <td>{formatDate(video.published_at)}</td>
                    <td>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          handleSelectVideo(video);
                        }}
                        className="preview-button"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoList;
