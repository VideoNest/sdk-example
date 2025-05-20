// VideoUploader.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadVideo, getVideoStatus, VideonestEmbed, setDebugMode } from 'videonest-sdk';
import '../styles/VideoUploader.css';

function VideoUploader() {
  setDebugMode(true);
  const navigate = useNavigate();
  const location = useLocation();
  const videonestConfig = location.state?.config || null;
  
  // Redirect if no config
  useEffect(() => {
    if (!videonestConfig) {
      navigate('/');
    }
  }, [videonestConfig, navigate]);
  
  // Upload state
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadStatus, setUploadStatus] = useState({ uploading: false, progress: 0, message: '' });
  const [processingStatus, setProcessingStatus] = useState({ processing: false, status: '', message: '' });
  const [videoId, setVideoId] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [customThumbnail, setCustomThumbnail] = useState(false);
  
  // Form references
  const fileInputRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const tagsRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // Navigation function
  const navigateToHome = () => {
    navigate('/');
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

  // Handle video upload
  const handleUpload = async () => {
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
    console.log("title is ", title);
    const description = descriptionRef.current.value || '';
    const tags = tagsRef.current.value ? tagsRef.current.value.split(',').map(tag => tag.trim()) : [];
    
    try {
      setUploadStatus({ uploading: true, progress: 0, message: 'Preparing upload...' });
      
      // Move to the processing step
      setCurrentStep(1);
      
      // Start the upload process
      const uploadResult = await uploadVideo(videoFile, {
        metadata: {
          title,
          description,
          tags,
          channelId: videonestConfig.channelId
        },
        thumbnail,
        onProgress: (progress) => {
          setUploadStatus(prev => ({ ...prev, progress }));
        }
      }, videonestConfig);
      
      if (!uploadResult.success) {
        setUploadStatus({ 
          uploading: false, 
          progress: 0, 
          message: `Upload failed: ${uploadResult.message || 'Unknown error'}` 
        });
        return;
      }
      
      setVideoId(uploadResult.video.id);
      setUploadStatus({ 
        uploading: false, 
        progress: 100, 
        message: 'Upload successful! Processing video...' 
      });
      
      // Start polling for video processing status
      setProcessingStatus({ 
        processing: true, 
        status: 'processing', 
        message: 'Your video is being processed...' 
      });
      
      // Poll for processing status
      const checkStatus = async () => {
        try {
          const statusResult = await getVideoStatus(uploadResult.video.id, videonestConfig);
          console.log("status result was ", statusResult);
          if (statusResult.success) {
            // Set more descriptive status messages based on the status
            let statusMessage = '';
            switch(statusResult.status) {
              case 'processing':
                statusMessage = 'Processing video...'; 
                break;
              case 'reencoding':
                statusMessage = 'Re-encoding video for optimal playback...'; 
                break;
              case 'completed':
                statusMessage = 'Processing complete! Video is ready to view.';
                break;
              default:
                statusMessage = `Status: ${statusResult.status}`;
            }
            
            setProcessingStatus({ 
              processing: statusResult.status !== 'completed', 
              status: statusResult.status, 
              message: statusMessage
            });
            
            if (statusResult.status !== 'completed') {
              // Keep polling every 3 seconds
              setTimeout(checkStatus, 3000);
            }
          } else {
            setProcessingStatus({ 
              processing: false, 
              status: 'error', 
              message: `Error checking status: ${statusResult.message || 'Unknown error'}` 
            });
          }
        } catch (error) {
          setProcessingStatus({ 
            processing: false, 
            status: 'error', 
            message: `Error checking status: ${error.message}` 
          });
        }
      };
      
      // Start the polling process
      checkStatus();
      
    } catch (error) {
      setUploadStatus({ 
        uploading: false, 
        progress: 0, 
        message: `Upload error: ${error.message}` 
      });
    }
  };
  
  const renderUploadForm = () => {
    return (
      <div className="upload-form">
        <h2>Step 1: Upload a Video</h2>
        
        <div className="form-group">
          <label>Video File:</label>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="video/*"
          />
        </div>
        
        <div className="form-group">
          <label>Title:</label>
          <input 
            type="text" 
            ref={titleRef} 
            placeholder="Enter video title"
          />
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea 
            ref={descriptionRef}
            placeholder="Enter video description"
          />
        </div>
        
        <div className="form-group">
          <label>Tags (comma separated):</label>
          <input 
            type="text" 
            ref={tagsRef}
            placeholder="tag1, tag2, tag3"
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
              disabled={uploadStatus.uploading}
            />
            <p className="thumbnail-help">Upload a custom thumbnail or use the auto-generated one from the 2-second mark</p>
          </div>
        </div>
        
        <div className="button-container">
          <button onClick={navigateToHome} className="secondary-button">
            Back to Home
          </button>
          <button 
            onClick={handleUpload}
            disabled={uploadStatus.uploading}
            className="primary-button"
          >
            Upload Video
          </button>
        </div>
        
        {uploadStatus.message && (
          <p className={`status ${uploadStatus.uploading ? 'info' : 'error'}`}>
            {uploadStatus.message}
          </p>
        )}
      </div>
    );
  };
  
  const renderProcessingStep = () => {
    return (
      <div className="processing-step">
        <h2>Step 2: Video Processing</h2>
        
        {uploadStatus.uploading && (
          <div className="upload-progress">
            <h3>Uploading...</h3>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
            <p>{Math.round(uploadStatus.progress)}%</p>
          </div>
        )}
        
        {videoId && (
          <div className="processing-info">
            <h3>Processing Video</h3>
            <p>Video ID: {videoId}</p>
            
            <div className="processing-status-container">
              <div className="processing-stages">
                <div className={`stage ${processingStatus.status === 'processing' || processingStatus.status === 'reencoding' || processingStatus.status === 'completed' ? 'active' : ''}`}>
                  <div className="stage-icon">1</div>
                  <div className="stage-label">Processing</div>
                </div>
                <div className={`stage ${processingStatus.status === 'reencoding' || processingStatus.status === 'completed' ? 'active' : ''}`}>
                  <div className="stage-icon">2</div>
                  <div className="stage-label">Encoding</div>
                </div>
                <div className={`stage ${processingStatus.status === 'completed' ? 'active' : ''}`}>
                  <div className="stage-icon">3</div>
                  <div className="stage-label">Ready</div>
                </div>
              </div>
              
              <p className="status-message">
                {processingStatus.message}
              </p>
            </div>
            
            {processingStatus.status === 'completed' && (
              <button 
                onClick={() => setCurrentStep(2)} 
                className="primary-button view-video-button"
              >
                View Processed Video
              </button>
            )}
          </div>
        )}
        
        <div className="button-container">
          <button onClick={navigateToHome} className="secondary-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  };
  
  const renderPreviewStep = () => {
    return (
      <div className="preview-step">
        <h2>Step 3: Video Preview</h2>
        
          <VideonestEmbed 
            videoId={videoId}
            config={videonestConfig} 
            style={{
              width: '100%',
              primaryColor: '#FE4800',
              darkMode: false,
              showVideoDetails: true
            }}
          />
  
        
        <div className="button-container">
          <button onClick={navigateToHome} className="primary-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  };
  
  // Main render function for the component
  return (
    <div className="video-uploader-container">
      <h1>Upload a New Video</h1>
      
      <div className="step-indicator">
        <div className={`step ${currentStep >= 0 ? 'active' : ''}`}>1. Upload Form</div>
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>2. Processing</div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>3. Preview</div>
      </div>
      
      <div className="step-content">
        {currentStep === 0 && renderUploadForm()}
        {currentStep === 1 && renderProcessingStep()}
        {currentStep === 2 && renderPreviewStep()}
      </div>
    </div>
  );
}

export default VideoUploader;
