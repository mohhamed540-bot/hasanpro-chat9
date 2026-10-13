// Global polyfill for OffscreenCanvas getBoundingClientRect to protect against library errors
if (typeof OffscreenCanvas !== 'undefined' && !(OffscreenCanvas.prototype as any).getBoundingClientRect) {
  (OffscreenCanvas.prototype as any).getBoundingClientRect = function () {
    return {
      top: 0,
      left: 0,
      right: this.width || 300,
      bottom: this.height || 150,
      width: this.width || 300,
      height: this.height || 150,
      x: 0,
      y: 0,
      toJSON: () => ({})
    };
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
