
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import VideoUploader from './pages/VideoUploader';
import VideoList from './pages/VideoList';
import Login from './pages/Login';
import './App.css';

// Authentication check component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => {
    const auth = localStorage.getItem('videonestAuth');
    if (!auth) return false;
    
    try {
      const { channelId, apiKey } = JSON.parse(auth);
      return !!channelId && !!apiKey;
    } catch (e) {
      return false;
    }
  };

  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <VideoUploader />
            </ProtectedRoute>
          } />
          <Route path="/videos" element={
            <ProtectedRoute>
              <VideoList />
            </ProtectedRoute>
          } />
          {/* Redirect all other paths to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;