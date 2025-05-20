
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VideoUploader from './pages/VideoUploader';
import VideoList from './pages/VideoList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<VideoUploader />} />
          <Route path="/videos" element={<VideoList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;