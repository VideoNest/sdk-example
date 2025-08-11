import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listVideos, VideonestEmbed, VideonestPreview } from 'videonest-sdk';
import RefreshIndicator from '../components/RefreshIndicator';
import '../styles/VideoList.css';

function VideoList() {
  const navigate = useNavigate();
  const [videosList, setVideosList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
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

  const loadVideos = async (isManualRefresh = false) => {
    // Track when the request started
    const startTime = Date.now();
    
    try {
      // Show loading indicator on initial load, show refresh indicator on manual refreshes
      if (!isManualRefresh) {
        setLoading(true);
      } else {
        // Set refreshing state - will be reset in finally block
        setRefreshing(true);
      }
      setError('');
      
      //  lets see
      // Only attempt to load videos if we have config
      console.log("loading videos with videonest config ", videonestConfig);
      if (videonestConfig) {
        const result = await listVideos(videonestConfig);
        
        if (result.success) {
          const newVideosList = result.videos || [];
          setVideosList(newVideosList);
          
          if (isManualRefresh && selectedVideo) {
            // During manual refresh, try to maintain the current selection
            // but update its status if it changed
            const updatedSelectedVideo = newVideosList.find(video => video.id === selectedVideo.id);
            if (updatedSelectedVideo) {
              setSelectedVideo(updatedSelectedVideo);
            }
          } else if (newVideosList.length > 0) {
            // Initial load or manual refresh - select the first completed video
            const completedVideos = newVideosList.filter(video => video.status === 'completed');
            if (completedVideos.length > 0) {
              setSelectedVideo(completedVideos[0]);
            } else {
              // No completed videos available
              setSelectedVideo(null);
            }
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
      // Ensure the indicator displays for at least 500ms for visibility
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const minVisibleTime = 500; // 500ms minimum visibility
      
      if (elapsedTime < minVisibleTime) {
        // If the operation was too fast, delay the state reset
        const delayTime = minVisibleTime - elapsedTime;
        setTimeout(() => {
          setLoading(false);
          setRefreshing(false);
        }, delayTime);
      } else {
        // Operation took longer than minimum time, reset immediately
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
  };

  const handleToggleFiles = (videoId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
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

  const handleManualRefresh = () => {
    loadVideos(true); // Pass true to indicate this is a manual refresh
  };

  // Format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { className: 'status-completed', text: 'Completed' },
      'uploading': { className: 'status-uploading', text: 'Uploading' },
      'reencoding': { className: 'status-reencoding', text: 'Processing' },
      'failed': { className: 'status-failed', text: 'Failed' },
      'unknown': { className: 'status-unknown', text: 'Unknown' }
    };
    
    const config = statusConfig[status] || statusConfig['unknown'];
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  // Handle file download
  const handleDownloadFile = (file) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = file.hosted_url;
    link.download = `video_${file.id}.${file.file_type || 'mp4'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`videos-list-container ${embedOptions.darkMode ? 'dark-mode' : ''}`} style={{"--primary-color": "#FE4800"}}>
      <h1>Your Videos</h1>
      
      <div className="button-container top-buttons">
        <button onClick={navigateToHome} className="secondary-button">
          Back to Home
        </button>
        <button 
          onClick={handleManualRefresh} 
          className="refresh-button"
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Position the indicator at the very top of the page */}
      <RefreshIndicator isRefreshing={refreshing} />
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="videos-content">
        {/* Video Embed Section */}
        <div className="video-preview-panel">
          {selectedVideo ? (
            <>
              <h3 style={{marginBottom: '20px'}}>Video Preview</h3>
              <div className="responsive-embed-container video-embed-wrapper">
                {selectedVideo.status === 'completed' ? (
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
                ) : (
                  <VideonestPreview 
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
                )}
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

        {/* Videos Table with New Structure */}
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
                  <th>Thumbnail</th>
                  <th>Title</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videosList.map(video => (
                  <React.Fragment key={video.id}>
                    <tr className={selectedVideo && selectedVideo.id === video.id ? 'selected' : ''}>
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
                      <td>
                        <div className="video-title">
                          {video.title || 'Untitled'}
                        </div>
                      </td>
                      <td>{formatDuration(video.duration)}</td>
                      <td>{getStatusBadge(video.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handlePlayVideo(video)}
                            className="action-button play-button"
                          >
                            {video.status === 'completed' ? 'Play Video' : 'Preview Video'}
                          </button>
                          <button 
                            onClick={() => handleToggleFiles(video.id)}
                            className="action-button files-button"
                          >
                            {expandedRows.has(video.id) ? 'Hide Files' : 'View Files'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(video.id) && (
                      <tr className="expanded-row">
                        <td colSpan="5">
                          <div className="hosted-files-container">
                            <h4>Hosted Files</h4>
                            {video.hosted_files && video.hosted_files.length > 0 ? (
                              <div className="hosted-files-grid">
                                {video.hosted_files.map(file => (
                                  <div key={file.id} className="hosted-file-item">
                                    <div className="file-info">
                                      <div className="file-type">{file.file_type || 'video'}</div>
                                      <div className="file-size">{formatFileSize(file.file_size)}</div>
                                      {file.width && file.height && (
                                        <div className="file-dimensions">{file.width}x{file.height}</div>
                                      )}
                                    </div>
                                    <button 
                                      onClick={() => handleDownloadFile(file)}
                                      className="download-button"
                                    >
                                      Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-files">No hosted files available</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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