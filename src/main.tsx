import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ App Error:', error);
    console.error('❌ Error Message:', error?.message);
    console.error('❌ Error Stack:', error?.stack);
    console.error('❌ Error Info:', errorInfo);
    console.error('❌ Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap in try-catch to prevent any import errors from blocking
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: system-ui;">
      <h1>Failed to load app</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button onclick="window.location.reload()">Reload</button>
    </div>
  `;
}
