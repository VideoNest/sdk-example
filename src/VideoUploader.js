// VideoUploader.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { authVideonest, uploadVideo, getVideoStatus, VideonestEmbed, listVideos } from 'videonest-sdk';


function VideoUploader() {
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: '' });
  const [uploadStatus, setUploadStatus] = useState({ uploading: false, progress: 0, message: '' });
  const [processingStatus, setProcessingStatus] = useState({ processing: false, status: '', message: '' });
  const [videoId, setVideoId] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [customThumbnail, setCustomThumbnail] = useState(false);
  const [videosList, setVideosList] = useState([]);
  const [videosListStatus, setVideosListStatus] = useState({ loading: false, message: '' });
  
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const tagsRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  // Channel credentials - these should come from environment variables in production
  const CHANNEL_ID = process.env.REACT_APP_CHANNEL_ID 
  const API_KEY = process.env.REACT_APP_API_KEY 
  
  const handleAuth = async () => {
    try {
      setAuthStatus({ authenticated: false, message: 'Authenticating...' });
      
      const authResult = await authVideonest(CHANNEL_ID, API_KEY);
      
      if (authResult.success) {
        setAuthStatus({ 
          authenticated: true, 
          message: 'Authentication successful!' 
        });
      } else {
        setAuthStatus({ 
          authenticated: false, 
          message: `Authentication failed: ${authResult.message || 'Unknown error'}` 
        });
      }
    } catch (error) {
      setAuthStatus({ 
        authenticated: false, 
        message: `Authentication error: ${error.message}` 
      });
    }
  };
  
  // Function to generate thumbnail from video at 2 seconds
  const generateThumbnail = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.includes('video')) {
        reject(new Error('Not a valid video file'));
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      // When video metadata is loaded, seek to 2 seconds
      video.onloadedmetadata = () => {
        video.currentTime = 2; // Seek to 2 seconds
      };

      // When the seek is complete, capture the frame
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
          }, 'image/jpeg', 0.95); // Use JPEG format with 95% quality
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Error loading video'));
      };

      // Start loading the video
      video.load();
    });
  }, []);

  // Handle video file selection
  const handleVideoFileChange = useCallback(async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const videoFile = fileInput.files[0];
    
    // Clear custom thumbnail if a new video is selected
    if (!customThumbnail) {
      setThumbnailPreview(null);
      setThumbnail(null);
      
      try {
        const thumbnailBlob = await generateThumbnail(videoFile);
        setThumbnail(thumbnailBlob);
        setThumbnailPreview(URL.createObjectURL(thumbnailBlob));
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    }
  }, [customThumbnail, generateThumbnail]);

  // Handle custom thumbnail selection
  const handleThumbnailFileChange = () => {
    const fileInput = thumbnailInputRef.current;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const thumbnailFile = fileInput.files[0];
    if (!thumbnailFile.type.includes('image')) {
      alert('Please select a valid image file (JPEG, PNG)');
      return;
    }
    
    setThumbnail(thumbnailFile);
    setThumbnailPreview(URL.createObjectURL(thumbnailFile));
    setCustomThumbnail(true);
  };

  // Listen for video file changes
  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (fileInput) {
      fileInput.addEventListener('change', handleVideoFileChange);
      return () => {
        fileInput.removeEventListener('change', handleVideoFileChange);
      };
    }
  }, [handleVideoFileChange]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const handleUpload = async () => {
    if (!authStatus.authenticated) {
      setUploadStatus({ 
        uploading: false, 
        progress: 0, 
        message: 'Please authenticate first' 
      });
      return;
    }
    
    const fileInput = fileInputRef.current;
    if (!fileInput.files || fileInput.files.length === 0) {
      setUploadStatus({ 
        uploading: false, 
        progress: 0, 
        message: 'Please select a video file' 
      });
      return;
    }
    
    if (!thumbnail) {
      setUploadStatus({
        uploading: false,
        progress: 0,
        message: 'Thumbnail is required. Please wait for it to generate or upload a custom one.'
      });
      return;
    }
    
    const videoFile = fileInput.files[0];
    const title = titleRef.current.value || 'Untitled Video';
    const description = descriptionRef.current.value || '';
    const tags = tagsRef.current.value ? tagsRef.current.value.split(',').map(tag => tag.trim()) : [];
    
    try {
      setUploadStatus({ 
        uploading: true, 
        progress: 0, 
        message: 'Starting upload...' 
      });
      
      const uploadResult = await uploadVideo(videoFile, {
        metadata: {
          channelId: CHANNEL_ID,
          title,
          description,
          tags
        },
        onProgress: (progress) => {
          setUploadStatus(prev => ({ 
            ...prev, 
            progress, 
            message: `Uploading: ${progress.toFixed(2)}%` 
          }));
        },
        thumbnail: thumbnail
      });
      
      if (uploadResult.success && uploadResult.video && uploadResult.video.id) {
        const newVideoId = uploadResult.video.id;
        setVideoId(newVideoId);
        
        setUploadStatus({ 
          uploading: false, 
          progress: 100, 
          message: `Upload complete! Video ID: ${newVideoId}` 
        });
        
        // Start checking processing status
        checkVideoStatus(newVideoId);
      } else {
        setUploadStatus({ 
          uploading: false, 
          progress: 0, 
          message: `Upload failed: ${uploadResult.message || 'Unknown error'}` 
        });
      }
    } catch (error) {
      setUploadStatus({ 
        uploading: false, 
        progress: 0, 
        message: `Upload error: ${error.message}` 
      });
    }
  };
  
  const checkVideoStatus = async (id) => {
    setProcessingStatus({ 
      processing: true, 
      status: 'pending', 
      message: 'Checking video status...' 
    });
    
    let statusInterval;
    try {
      statusInterval = setInterval(async () => {
        try {
          const statusResult = await getVideoStatus(id);
          
          setProcessingStatus({ 
            processing: true, 
            status: statusResult.status, 
            message: `Processing status: ${statusResult.status}` 
          });
          
          if (statusResult.status === 'completed' || statusResult.status === 'failed') {
            clearInterval(statusInterval);
            
            setProcessingStatus({ 
              processing: false, 
              status: statusResult.status, 
              message: `Final status: ${statusResult.status}` 
            });
          }
        } catch (statusError) {
          clearInterval(statusInterval);
          
          setProcessingStatus({ 
            processing: false, 
            status: 'error', 
            message: `Error checking status: ${statusError.message}` 
          });
        }
      }, 5000);
    } catch (error) {
      clearInterval(statusInterval);
      
      setProcessingStatus({ 
        processing: false, 
        status: 'error', 
        message: `Error setting up status check: ${error.message}` 
      });
    }
  };

  // Function to fetch the list of videos using the SDK's listVideos function
  const handleListVideos = async () => {
    if (!authStatus.authenticated) {
      setVideosListStatus({
        loading: false,
        message: 'Please authenticate first'
      });
      return;
    }

    try {
      setVideosListStatus({
        loading: true,
        message: 'Fetching videos...'
      });

      // Using the SDK's listVideos function directly
      const result = await listVideos();
      
      if (!result.success) {
        setVideosListStatus({
          loading: false,
          message: result.message || 'Failed to retrieve videos'
        });
        return;
      }
      
      setVideosList(result.videos || []);
      setVideosListStatus({
        loading: false,
        message: `Successfully retrieved ${result.videos ? result.videos.length : 0} videos`
      });
    } catch (error) {
      setVideosListStatus({
        loading: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve videos'
      });
    }
  };
  
  return (
    <div className="video-uploader">
      <h1>VideoNest SDK Tester</h1>
      
      <section className="auth-section">
        <h2>Step 1: Authentication</h2>
        <button onClick={handleAuth} disabled={authStatus.authenticated}>
          {authStatus.authenticated ? 'Authenticated' : 'Authenticate'}
        </button>
        <p className={`status ${authStatus.authenticated ? 'success' : ''}`}>
          {authStatus.message}
        </p>
      </section>
      
      <section className="upload-section">
        <h2>Step 2: Upload Video</h2>
        <div className="form-group">
          <label>Video File:</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="video/*" 
            disabled={!authStatus.authenticated || uploadStatus.uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Title:</label>
          <input 
            type="text" 
            ref={titleRef} 
            placeholder="Video title" 
            disabled={!authStatus.authenticated || uploadStatus.uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea 
            ref={descriptionRef} 
            placeholder="Video description" 
            disabled={!authStatus.authenticated || uploadStatus.uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Tags (comma-separated):</label>
          <input 
            type="text" 
            ref={tagsRef} 
            placeholder="tag1, tag2, tag3" 
            disabled={!authStatus.authenticated || uploadStatus.uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Thumbnail:</label>
          {thumbnailPreview && (
            <div className="thumbnail-preview">
              <img src={thumbnailPreview} alt="Video thumbnail" />
              <p className="thumbnail-info">{customThumbnail ? 'Custom thumbnail' : 'Auto-generated from 2-second mark'}</p>
            </div>
          )}
          <div className="thumbnail-controls">
            <input 
              type="file" 
              ref={thumbnailInputRef} 
              accept="image/jpeg,image/png" 
              onChange={handleThumbnailFileChange}
              disabled={!authStatus.authenticated || uploadStatus.uploading}
            />
            <p className="thumbnail-help">Upload a custom thumbnail or use the auto-generated one from the 2-second mark</p>
          </div>
        </div>
        
        <button 
          onClick={handleUpload} 
          disabled={!authStatus.authenticated || uploadStatus.uploading}
        >
          Upload Video
        </button>
        
        {uploadStatus.uploading && (
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${uploadStatus.progress}%` }}
            ></div>
          </div>
        )}
        
        <p className="status">
          {uploadStatus.message}
        </p>
      </section>
      
      {videoId && (
        <section className="processing-section">
          <h2>Step 3: Processing Status</h2>
          <p>Video ID: {videoId}</p>
          <p className="status">
            {processingStatus.message}
          </p>
        </section>
      )}
      
      {videoId && processingStatus.status === 'completed' && (
          <section className="embed-section">
            <h2>Step 4: Video Embed</h2>
            <p>Embed this video on your website:</p>
            
            <div className="embed-preview">
              <h3>Preview:</h3>
              <VideonestEmbed 
                videoId={videoId} 
                style={{
                  width: '100%',
                  height: '500px',
                  primaryColor: '#4CAF50', // Using the same green as your buttons
                  darkMode: 'false',
                  hideVideoDetails: 'true'
                }}
              />
            </div>
          </section>
        )}
      
      <section className="videos-list-section">
        <h2>List Videos</h2>
        <button 
          onClick={handleListVideos} 
          disabled={!authStatus.authenticated || videosListStatus.loading}
        >
          {videosListStatus.loading ? 'Loading...' : 'Fetch Videos'}
        </button>
        
        <p className="status">
          {videosListStatus.message}
        </p>
        
        {videosList.length > 0 && (
          <div className="videos-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Published At</th>
                </tr>
              </thead>
              <tbody>
                {videosList.map(video => (
                  <tr key={video.id}>
                    <td>{video.id}</td>
                    <td>{video.title}</td>
                    <td>{video.description ? (video.description.length > 20 ? `${video.description.substring(0, 20)}...` : video.description) : 'No description'}</td>
                    <td>{video.published_at ? new Date(video.published_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      <style jsx>{`
        .video-uploader {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input[type="text"], textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        textarea {
          height: 100px;
        }
        
        button {
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .status {
          margin-top: 10px;
          padding: 10px;
          background-color: #f8f8f8;
          border-radius: 4px;
        }
        
        .status.success {
          background-color: #dff0d8;
          color: #3c763d;
        }
        
        .progress-bar {
          height: 20px;
          background-color: #f0f0f0;
          border-radius: 4px;
          margin-top: 15px;
          overflow: hidden;
        }
        
        .progress {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }
        
        .thumbnail-preview {
          margin: 10px 0;
          text-align: center;
        }
        
        .thumbnail-preview img {
          max-width: 100%;
          max-height: 200px;
          border: 1px solid #ddd;
          border-radius: 4px;
          object-fit: contain;
        }
        
        .thumbnail-info {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
        
        .thumbnail-help {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
        
        .thumbnail-controls {
          margin-top: 10px;
        }
        
        .videos-table {
          margin-top: 20px;
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tr:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
}

export default VideoUploader;