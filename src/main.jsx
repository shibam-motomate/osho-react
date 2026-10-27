import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { initGoogleAnalytics } from './analytics.js';
import './styles.css';
import './sizes.css'; // size system; must load after styles.css

initGoogleAnalytics();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
