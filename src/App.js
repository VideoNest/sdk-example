
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import VideoUploader from './VideoUploader';
import VideoList from './VideoList';
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