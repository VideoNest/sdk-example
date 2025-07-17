import React from 'react';
import './RefreshIndicator.css';

const RefreshIndicator = ({ isRefreshing }) => {
  // Simple version - only show when isRefreshing is true
  if (!isRefreshing) return null;
  
  console.log('Refresh indicator visible:', isRefreshing);
  
  return (
    <div className="refresh-indicator-container">
      <div className="refresh-indicator-bar"></div>
    </div>
  );
};

export default RefreshIndicator;
