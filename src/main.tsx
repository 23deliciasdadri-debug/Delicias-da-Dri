import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import PublicQuotePreviewApp from './features/public/PublicQuotePreviewApp';
import { ThemeProvider } from './providers/ThemeProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const isPublicPreview = window.location.pathname.startsWith('/orcamento/preview/');

const root = ReactDOM.createRoot(rootElement);

const Application = isPublicPreview ? (
  <PublicQuotePreviewApp />
) : (
  <AuthProvider>
    <App />
  </AuthProvider>
);

root.render(
  <React.StrictMode>
    <ThemeProvider>{Application}</ThemeProvider>
  </React.StrictMode>,
);
