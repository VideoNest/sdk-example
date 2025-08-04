// VideoUploader.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadVideo, setDebugMode } from 'videonest-sdk';
import '../styles/VideoUploader.css';

function VideoUploader() {
  setDebugMode(true);
  const navigate = useNavigate();
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
  
  // Upload state
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadStatus, setUploadStatus] = useState({ uploading: false, progress: 0, message: '', status: '' });
  const [showFailureModal, setShowFailureModal] = useState(false);
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
      
      // Move to the upload progress step
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
        onProgress: (progress, status) => {
          let message;
          if (status === 'finalizing') {
            message = 'Finalizing upload...';
          } else if (status === 'failed') {
            message = 'Upload failed!';
            setShowFailureModal(true);
          } else {
            message = `Uploading... ${Math.round(progress)}%`;
          }
          setUploadStatus(prev => ({ ...prev, progress, message, status }));
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
      
      setUploadStatus({ 
        uploading: false, 
        progress: 100, 
        message: 'Upload successful! Redirecting to home...' 
      });
      
      // Navigate to home after successful upload
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
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
          <p className={`status ${uploadStatus.uploading ? 'info' : uploadStatus.message.includes('error') || uploadStatus.message.includes('failed') ? 'error' : 'success'}`}>
            {uploadStatus.message}
          </p>
        )}
      </div>
    );
  };
  
  const renderUploadProgress = () => {
    return (
      <div className="upload-progress-step">
        <h2>Step 2: Uploading Video</h2>
        
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className={`progress ${uploadStatus.status === 'finalizing' ? 'pulse' : ''}`} 
              style={{ width: `${uploadStatus.progress}%` }}
            ></div>
          </div>
          {uploadStatus.status !== 'finalizing' && (
            <p>{Math.round(uploadStatus.progress)}%</p>
          )}
        </div>
        
        <p className="status-message">
          {uploadStatus.message}
        </p>
        
        <div className="button-container">
          <button onClick={navigateToHome} className="secondary-button">
            Back to Home
          </button>
        </div>

        {showFailureModal && (
          <div className="upload-failure-modal">
            <div className="modal-content">
              <h3>Upload Failed</h3>
              <p>The video upload process has failed. Please try again or contact support.</p>
              <button onClick={() => {
                setShowFailureModal(false);
                setCurrentStep(0);
              }} className="primary-button">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Main render function for the component
  return (
    <div className="video-uploader-container">
      <h1>Upload a New Video</h1>
      
      <div className="step-indicator">
        <div className={`step ${currentStep >= 0 ? 'active' : ''}`}>1. Upload Form</div>
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>2. Uploading</div>
      </div>
      
      <div className="step-content">
        {currentStep === 0 && renderUploadForm()}
        {currentStep === 1 && renderUploadProgress()}
      </div>
    </div>
  );
}

export default VideoUploader;