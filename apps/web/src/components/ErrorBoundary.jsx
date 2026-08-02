import React from 'react';

/**
 * Top-level error boundary. Catches render errors anywhere in the tree
 * and shows a recoverable fallback instead of a black screen.
 *
 * Use this in main.jsx to wrap the entire app, or use ErrorBoundary inline
 * around risky subtrees (e.g. third-party 3D scenes, OAuth components).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div style={{
          padding: '2rem',
          maxWidth: 720,
          margin: '4rem auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#1f2937',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.5rem 1rem',
              background: '#22d3ee',
              color: '#000',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginRight: '0.5rem',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#22d3ee',
              border: '1px solid #22d3ee',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
          {isDev && this.state.error && (
            <details style={{ marginTop: '1.5rem' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                Error details (dev only)
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: '#f3f4f6',
                borderRadius: '0.375rem',
                overflow: 'auto',
                fontSize: '0.75rem',
              }}>
                {String(this.state.error?.stack || this.state.error)}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
