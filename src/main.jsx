import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initGoogleAnalytics } from './analytics.js';
import './styles.css';

initGoogleAnalytics();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
