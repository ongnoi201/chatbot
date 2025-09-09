// LoadingSpinner.jsx

import React from 'react';
import './LoadingSpinner.css'; // Import file CSS

export default function LoadingSpinner() {
  return (
    <div className="loading-overlay">
      <div className="loader"></div>
    </div>
  );
}