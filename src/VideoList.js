import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listVideos, VideonestEmbed } from 'videonest-sdk';
import './VideoList.css';

function VideoList() {
  const navigate = useNavigate();
  const [videosList, setVideosList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Embed customization options
  const [embedOptions, setEmbedOptions] = useState({
    primaryColor: '#4e73df',
    darkMode: false,
    showVideoDetails: true,
    showTitle: true,
    showDescription: true
  });

  // Load videos on component mount
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await listVideos();
      
      if (result.success) {
        setVideosList(result.videos || []);
        
        // If there are videos, select the first one by default
        if (result.videos && result.videos.length > 0) {
          setSelectedVideo(result.videos[0]);
        }
      } else {
        setError(result.message || 'Failed to load videos');
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
    <div className={`videos-list-container ${embedOptions.darkMode ? 'dark-mode' : ''}`}>
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
        <div className="videos-table-container">
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
        
        <div className="video-preview-panel">
          {selectedVideo ? (
            <>
              <div className="embed-container">
                <VideonestEmbed 
                  videoId={selectedVideo.id} 
                  style={{
                    width: '100%',
                    height: '500px',
                    primaryColor: embedOptions.primaryColor,
                    darkMode: embedOptions.darkMode,
                    showVideoDetails: embedOptions.showVideoDetails,
                    showTitle: embedOptions.showTitle,
                    showDescription: embedOptions.showDescription
                  }}
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
                      checked={embedOptions.showVideoDetails}
                      onChange={(e) => handleOptionChange('showVideoDetails', e.target.checked)}
                    />
                    Show Video Details
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
      </div>
    </div>
  );
}

export default VideoList;
