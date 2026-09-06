import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Log startup
console.log('[LUAUFORGE X] Initializing...');

// Remove loading screen
const removeLoadingScreen = () => {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
};

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[LUAUFORGE X] Root element not found!');
  throw new Error('Root element #root not found');
}

try {
  // Render React app
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  // Remove loading screen after render
  setTimeout(removeLoadingScreen, 100);
  
  console.log('[LUAUFORGE X] Application rendered successfully');
} catch (error) {
  console.error('[LUAUFORGE X] Failed to render:', error);
  
  // Show error on screen
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #07090d;
      color: #ef4444;
      padding: 20px;
    ">
      <div style="text-align: center;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Failed to load LUAUFORGE X</h1>
        <p style="color: #6b7280;">${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    </div>
  `;
}
